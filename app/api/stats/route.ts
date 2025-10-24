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
    console.log("[API stats - enrichHistoryWithTrend] Iniciando cálculo de tendencias desde datos guardados.");
    const enrichedResults = historyResults.map(result => {
        const currentPos = result.posicion;
        const savedPreviousPos = result.posicionAnterior;
        const tendencia24h = calculateTrendFromSavedData(currentPos, savedPreviousPos);

        const savedPreviousPos7d = result.posicionAnterior;
        const tendencia7d = calculateTrendFromSavedData(currentPos, savedPreviousPos7d);

        return {
            ...result.toObject(),
            tendencia24h,
            tendencia7d
        };
    });
    console.log("[API stats - enrichHistoryWithTrend] Cálculo completado para", enrichedResults.length, "registros.");
    return enrichedResults;
}


export async function GET(req: NextRequest) {
    console.log("[API stats] Iniciando solicitud...");
    await connectDB();
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get('user_id')?.value;
    if (!userIdStr) {
        console.log("[API stats] No se encontró user_id en las cookies.");
        return NextResponse.json({ success: false, message: 'No autenticado.' }, { status: 401 });
    }
    let userId;
    try {
        userId = new Types.ObjectId(userIdStr);
        console.log("[API stats] User ID parseado:", userId);
    } catch (e) {
        console.error("[API stats] Error parseando user_id:", e);
        return NextResponse.json({ success: false, message: 'ID de usuario inválido.' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain') || '';
    const keyword = searchParams.get('keyword') || '';
    console.log("[API stats] Parámetros recibidos - domain:", domain, "keyword:", keyword);

    try {
        const matchBase: any = { userId, tipoBusqueda: 'palabraClave' };
        if (domain) matchBase.dominio = domain;
        if (keyword) matchBase.palabraClave = keyword;
        console.log("[API stats] Criterios de búsqueda:", matchBase);

        const allResults = await SearchResult.find(matchBase).sort({ createdAt: -1 });
        console.log("[API stats] SearchResult encontrados:", allResults.length);

        const enriched = await enrichHistoryWithTrend(allResults);
        console.log("[API stats] SearchResult después de enrichHistoryWithTrend:", enriched.length);

        const uniqueKeyFields = ['palabraClave', 'location', 'dispositivo', 'buscador', 'dominio'];
        const uniqueMap = new Map();
        enriched.forEach(r => {
            if (!r.dominio || r.dominio === 'N/A') {
                return;
            }
            const key = uniqueKeyFields.map(f => (r as any)[f] || '').join('|');
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, r);
            }
        });

        const uniqueEnriched = Array.from(uniqueMap.values());
        console.log("[API stats] Total registros únicos después de agrupar:", uniqueEnriched.length);

        const domains = [...new Set(allResults.map(r => r.dominio).filter(d => d && d !== 'N/A'))];
        const keywords = [...new Set(uniqueEnriched.map(r => r.palabraClave))];
        console.log("[API stats] Dominios únicos:", domains.length);
        console.log("[API stats] Keywords únicas:", keywords.length);

        let improved24h = 0, worsened24h = 0;
        uniqueEnriched.forEach(r => {
            if (r.tendencia24h.diferencia !== null) {
                if (r.tendencia24h.diferencia > 0) improved24h++;
                else if (r.tendencia24h.diferencia < 0) worsened24h++;
            }
        });
        console.log("[API stats] Mejoradas (24h):", improved24h, "Empeoradas (24h):", worsened24h);

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
        console.log("[API stats] Top 3 dominios:", topDomains);

        console.log("[API stats] Enviando respuesta final.");
        console.log("[API stats] Ejemplo de registro con tendencias:", uniqueEnriched[0]); // Solo el primero para no saturar

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
        console.error('[API stats] Error interno:', err);
        return NextResponse.json({ success: false, message: 'Error interno.' }, { status: 500 });
    }
}