import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongoose';
import SearchResult from '@/models/SearchResult';
import { Types } from 'mongoose';

function calculateTrend(currentPos: number, pastPos: number | null) {
    let tendencia = {
        posicionAnterior: null as number | null,
        diferencia: null as number | null,
        color: 'gray',
        simbolo: '—'
    };
    if (pastPos !== null && pastPos > 0) {
        const diferencia = pastPos - currentPos;
        tendencia.posicionAnterior = pastPos;
        tendencia.diferencia = diferencia;
        if (diferencia > 0) {
            tendencia.color = 'green';
            tendencia.simbolo = '▲';
        } else if (diferencia < 0) {
            tendencia.color = 'red';
            tendencia.simbolo = '▼';
        } else {
            tendencia.color = 'yellow';
            tendencia.simbolo = '●';
        }
    }
    return tendencia;
}

async function enrichHistoryWithTrend(historyResults: any[], userId: Types.ObjectId) {
    const enrichedResults = [];
    for (const result of historyResults) {
        const now = result.createdAt;
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const baseQuery = {
            userId,
            palabraClave: result.palabraClave,
            dominio: result.dominio,
            buscador: result.buscador,
            dispositivo: result.dispositivo,
            location: result.location
        };
        const pastResult24h = await SearchResult.findOne({ ...baseQuery, createdAt: { $lte: oneDayAgo } }).sort({ createdAt: -1 });
        const pastResult7d = await SearchResult.findOne({ ...baseQuery, createdAt: { $lte: sevenDaysAgo } }).sort({ createdAt: -1 });
        const currentPos = result.posicion;
        const tendencia24h = calculateTrend(currentPos, pastResult24h?.posicion ?? null);
        const tendencia7d = calculateTrend(currentPos, pastResult7d?.posicion ?? null);
        enrichedResults.push({
            ...result.toObject(),
            tendencia24h,
            tendencia7d
        });
    }
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

        const allResults = await SearchResult.find(matchBase).sort({ createdAt: -1 });
        const enriched = await enrichHistoryWithTrend(allResults, userId);

        const uniqueKeyFields = ['palabraClave', 'location', 'dispositivo', 'buscador', 'dominio'];
        const uniqueMap = new Map();
        enriched.forEach(r => {
            if (!r.dominio || r.dominio === 'N/A') return;
            const key = uniqueKeyFields.map(f => (r as any)[f] || '').join('|');
            if (!uniqueMap.has(key)) uniqueMap.set(key, r);
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
        console.error('Error in /api/stats:', err);
        return NextResponse.json({ success: false, message: 'Internal error.' }, { status: 500 });
    }
}