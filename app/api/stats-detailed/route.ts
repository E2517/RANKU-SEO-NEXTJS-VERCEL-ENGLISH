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

        const searchResults = await SearchResult.find(matchBase);

        const campaignMatch: any = { userId };
        if (domain) campaignMatch.domain = domain;
        if (keyword) campaignMatch.keyword = keyword;

        const campaigns = await LocalVisibilityCampaign.find(campaignMatch);

        const campaignRecords = campaigns.map(c => ({
            _id: c._id,
            palabraClave: c.keyword,
            dominio: c.domain,
            dominioFiltrado: c.domain,
            posicion: null,
            posicionAnterior24h: null,
            posicionAnterior7d: null,
            posicionAnterior30d: null,
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

        const uniqueKeyFields = ['palabraClave', 'location', 'dispositivo', 'buscador', 'dominio'];
        const uniqueMap = new Map();
        allRecords.forEach(r => {
            if (!r.dominio || r.dominio === 'N/A') return;
            const key = uniqueKeyFields.map(f => (r as any)[f] || '').join('|');
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, r);
            }
        });

        const uniqueRecords = Array.from(uniqueMap.values());

        const detailedResults = uniqueRecords.map(r => {
            if (typeof r.posicion === 'number' && r.posicion > 0) {
                const currentPos = r.posicion;
                const tend24 = calculateTrendFromSavedData(currentPos, r.posicionAnterior24h);
                const tend7d = calculateTrendFromSavedData(currentPos, r.posicionAnterior7d);
                const tend30d = calculateTrendFromSavedData(currentPos, r.posicionAnterior30d);

                let change24h = '—';
                let change7d = '—';
                let change30d = '—';

                if (tend24.diferencia !== null) {
                    const sign = tend24.diferencia > 0 ? '+' : '';
                    change24h = `${sign}${tend24.diferencia} ${tend24.simbolo}`;
                }
                if (tend7d.diferencia !== null) {
                    const sign = tend7d.diferencia > 0 ? '+' : '';
                    change7d = `${sign}${tend7d.diferencia} ${tend7d.simbolo}`;
                }
                if (tend30d.diferencia !== null) {
                    const sign = tend30d.diferencia > 0 ? '+' : '';
                    change30d = `${sign}${tend30d.diferencia} ${tend30d.simbolo}`;
                }

                return {
                    keyword: r.palabraClave,
                    domain: r.dominio,
                    position: r.posicion,
                    change24h,
                    change7d,
                    change30d,
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
                    change30d: '—',
                    searchEngine: r.buscador,
                    device: r.dispositivo,
                    location: r.location
                };
            }
        });

        return NextResponse.json({
            success: true,
            results: detailedResults
        });
    } catch (err) {
        console.error('[API stats-detailed] Internal error:', err);
        return NextResponse.json({ success: false, message: 'Internal error.' }, { status: 500 });
    }
}