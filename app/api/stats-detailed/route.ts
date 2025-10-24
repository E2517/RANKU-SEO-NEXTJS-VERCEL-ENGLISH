import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongoose';
import SearchResult from '@/models/SearchResult';
import LocalVisibilityCampaign from '@/models/LocalVisibilityCampaign';
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


export async function GET(req: NextRequest) {
    console.log("[API stats-detailed] Iniciando solicitud...");
    await connectDB();
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get('user_id')?.value;
    if (!userIdStr) {
        console.log("[API stats-detailed] No se encontró user_id en las cookies.");
        return NextResponse.json({ success: false, message: 'No autenticado.' }, { status: 401 });
    }
    let userId;
    try {
        userId = new Types.ObjectId(userIdStr);
        console.log("[API stats-detailed] User ID parseado:", userId);
    } catch (e) {
        console.error("[API stats-detailed] Error parseando user_id:", e);
        return NextResponse.json({ success: false, message: 'ID de usuario inválido.' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain') || '';
    const keyword = searchParams.get('keyword') || '';
    console.log("[API stats-detailed] Parámetros recibidos - domain:", domain, "keyword:", keyword);

    try {
        const matchBase: any = { userId, tipoBusqueda: 'palabraClave' };
        if (domain) matchBase.dominio = domain;
        if (keyword) matchBase.palabraClave = keyword;
        console.log("[API stats-detailed] Criterios de búsqueda para SearchResult:", matchBase);

        const searchResults = await SearchResult.find(matchBase).sort({ createdAt: -1 });
        console.log("[API stats-detailed] SearchResult encontrados:", searchResults.length);

        const campaignMatch: any = { userId };
        if (domain) campaignMatch.domain = domain;
        if (keyword) campaignMatch.keyword = keyword;
        console.log("[API stats-detailed] Criterios de búsqueda para LocalVisibilityCampaign:", campaignMatch);

        const campaigns = await LocalVisibilityCampaign.find(campaignMatch).sort({ createdAt: -1 });
        console.log("[API stats-detailed] LocalVisibilityCampaign encontrados:", campaigns.length);

        const campaignRecords = campaigns.map(c => ({
            _id: c._id,
            palabraClave: c.keyword,
            dominio: c.domain,
            dominioFiltrado: c.domain,
            posicion: null,
            posicionAnterior: null,
            buscador: 'scanmap',
            dispositivo: 'scanmap',
            location: c.centerLocation?.name || 'N/A',
            createdAt: c.createdAt,
            updatedAt: c.updatedAt || c.createdAt,
            tipoBusqueda: 'palabraClave',
            rating: null,
            reviews: null
        }));

        const allRecords = [...searchResults, ...campaignRecords];
        console.log("[API stats-detailed] Total registros antes de agrupar (SearchResult + Campaigns):", allRecords.length);

        const uniqueKeyFields = ['palabraClave', 'location', 'dispositivo', 'buscador', 'dominio'];
        const uniqueMap = new Map();
        allRecords.forEach(r => {
            if (!r.dominio || r.dominio === 'N/A') {
                return;
            }
            const key = uniqueKeyFields.map(f => (r as any)[f] || '').join('|');
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, r);
            }
        });

        const uniqueRecords = Array.from(uniqueMap.values());
        console.log("[API stats-detailed] Total registros únicos después de agrupar:", uniqueRecords.length);

        const detailedResults = uniqueRecords.map(r => {
            if (typeof r.posicion === 'number' && r.posicion > 0) {
                const currentPos = r.posicion;
                const savedPreviousPos = r.posicionAnterior;
                const tend24 = calculateTrendFromSavedData(currentPos, savedPreviousPos);
                const tend7d = calculateTrendFromSavedData(currentPos, savedPreviousPos);

                let change24h = '—';
                let change7d = '—';

                if (tend24.diferencia !== null) {
                    const sign = tend24.diferencia > 0 ? '+' : '';
                    change24h = `${sign}${tend24.diferencia} ${tend24.simbolo}`;
                }
                if (tend7d.diferencia !== null) {
                    const sign = tend7d.diferencia > 0 ? '+' : '';
                    change7d = `${sign}${tend7d.diferencia} ${tend7d.simbolo}`;
                }

                return {
                    keyword: r.palabraClave,
                    domain: r.dominio,
                    position: r.posicion,
                    change24h,
                    change7d,
                    searchEngine: r.buscador,
                    device: r.dispositivo,
                    location: r.location
                };
            } else {
                return {
                    keyword: r.palabraClave,
                    domain: r.dominio,
                    position: r.posicion,
                    change24h: '—',
                    change7d: '—',
                    searchEngine: r.buscador,
                    device: r.dispositivo,
                    location: r.location
                };
            }
        });

        console.log("[API stats-detailed] Resultados finales calculados:", detailedResults.length);
        console.log("[API stats-detailed] Ejemplo de resultado final:", detailedResults[0]); // Solo el primero para no saturar

        return NextResponse.json({
            success: true,
            results: detailedResults
        });
    } catch (err) {
        console.error('[API stats-detailed] Error interno:', err);
        return NextResponse.json({ success: false, message: 'Error interno.' }, { status: 500 });
    }
}