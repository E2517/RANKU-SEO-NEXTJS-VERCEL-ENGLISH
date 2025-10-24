import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongoose';
import SearchResult from '@/models/SearchResult';
import { Types } from 'mongoose';

function calculateTrendFromSavedData(currentPos: number, savedPreviousPos: number | null | undefined) {
    let tendencia = {
        posicionAnterior: null as number | null,
        diferencia: null as number | null,
        color: 'gray',
        simbolo: '—'
    };
    const previousPos = savedPreviousPos ?? null;
    if (previousPos !== null && previousPos > 0) {
        tendencia.posicionAnterior = previousPos;
        const diferencia = previousPos - currentPos;
        tendencia.diferencia = diferencia;
        if (diferencia > 0) {
            tendencia.color = 'green';
            tendencia.simbolo = '▲';
        } else if (diferencia < 0) {
            tendencia.color = 'red';
            tendencia.simbolo = '▼';
        } else {
            tendencia.color = 'black';
            tendencia.simbolo = '●';
        }
    }
    return tendencia;
}

async function enrichHistoryWithTrend(historyResults: any[]) {
    const enrichedResults = historyResults.map(result => {
        const currentPos = result.posicion;
        const tendencia24h = calculateTrendFromSavedData(currentPos, result.posicionAnterior24h);
        const tendencia7d = calculateTrendFromSavedData(currentPos, result.posicionAnterior7d);
        const tendencia30d = calculateTrendFromSavedData(currentPos, result.posicionAnterior30d);

        return {
            ...result.toObject(),
            tendencia24h,
            tendencia7d,
            tendencia30d
        };
    });
    return enrichedResults;
}

export async function GET(req: NextRequest) {
    await connectDB();
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get('user_id')?.value;
    if (!userIdStr) {
        return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    }
    let userId;
    try {
        userId = new Types.ObjectId(userIdStr);
    } catch (e) {
        return NextResponse.json({ success: false, message: 'Invalid user ID.' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain') || '';
    const keyword = searchParams.get('keyword') || '';

    try {
        const matchBase: any = { userId, tipoBusqueda: 'palabraClave' };
        if (domain) matchBase.dominio = domain;
        if (keyword) matchBase.palabraClave = keyword;

        const allResults = await SearchResult.find(matchBase);
        const enriched = await enrichHistoryWithTrend(allResults);

        const uniqueKeyFields = ['palabraClave', 'location', 'dispositivo', 'buscador', 'dominio'];
        const uniqueMap = new Map();
        enriched.forEach(r => {
            if (!r.dominio || r.dominio === 'N/A') return;
            const key = uniqueKeyFields.map(f => (r as any)[f] || '').join('|');
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, r);
            }
        });

        const uniqueEnriched = Array.from(uniqueMap.values());
        const domains = [...new Set(allResults.map(r => r.dominio).filter(d => d && d !== 'N/A'))];
        const keywords = [...new Set(uniqueEnriched.map(r => r.palabraClave))];

        let improved24h = 0, worsened24h = 0;
        uniqueEnriched.forEach(r => {
            if (r.tendencia24h.diferencia !== null) {
                if (r.tendencia24h.diferencia > 0) improved24h++;
                else if (r.tendencia24h.diferencia < 0) worsened24h++;
            }
        });

        const domainImprovement: Record<string, { mejoraTotal: number; count: number }> = {};
        uniqueEnriched.forEach(r => {
            const d = r.dominio;
            if (!d || d === 'N/A') return;
            if (!domainImprovement[d]) domainImprovement[d] = { mejoraTotal: 0, count: 0 };
            if (r.tendencia24h.diferencia !== null) {
                domainImprovement[d].mejoraTotal += r.tendencia24h.diferencia;
                domainImprovement[d].count++;
            }
        });

        const topDomains = Object.entries(domainImprovement)
            .map(([dominio, data]) => ({ dominio, mejoraAbsoluta: data.mejoraTotal }))
            .sort((a, b) => b.mejoraAbsoluta - a.mejoraAbsoluta)
            .slice(0, 3);

        return NextResponse.json({
            success: true,
            stats: {
                totalDomains: domains.length,
                totalKeywords: keywords.length,
                improved24h,
                worsened24h,
                detailed: uniqueEnriched,
                topDomains
            }
        });
    } catch (err) {
        console.error('[API stats] Internal error:', err);
        return NextResponse.json({ success: false, message: 'Internal error.' }, { status: 500 });
    }
}