import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import SearchResult from '@/models/SearchResult';
import LocalVisibilityCampaign from '@/models/LocalVisibilityCampaign';
import { connectDB } from '@/lib/mongoose';
import { Types } from 'mongoose';

function calculateTrend(currentPos: number, pastPos: number | null) {
    let tendencia = { posicionAnterior: null as number | null, diferencia: null as number | null, color: 'gray', simbolo: '—' };
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
            tendencia.color = 'black';
            tendencia.simbolo = '●';
        }
    }
    return tendencia;
}

export async function GET(request: Request) {
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
        console.error(e)
        return NextResponse.json({ success: false, message: 'Invalid user ID.' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const dominio = searchParams.get('dominio');
    const keywordFilter = searchParams.get('keywordFilter');

    if (!dominio) {
        return NextResponse.json({ success: false, message: 'Missing "dominio" parameter.' }, { status: 400 });
    }

    try {
        let matchCriteria: any = { userId, dominioFiltrado: dominio };
        if (keywordFilter) {
            matchCriteria.palabraClave = { $regex: new RegExp(`^${keywordFilter}$`, 'i') };
        }

        const pipeline: any[] = [
            { $match: matchCriteria },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: { palabraClave: '$palabraClave', dispositivo: '$dispositivo', buscador: '$buscador', location: '$location' },
                    doc: { $first: '$$ROOT' }
                }
            },
            { $replaceRoot: { newRoot: '$doc' } },
            { $sort: { posicion: 1, createdAt: -1 } },
            { $limit: 100 }
        ];

        const aggregationResults = await SearchResult.aggregate(pipeline);

        const latestScanMap = await LocalVisibilityCampaign.findOne(
            { userId, domain: dominio },
            {},
            { sort: { updatedAt: -1, createdAt: -1 } }
        ).lean();

        let scanMapRecord = null;
        if (latestScanMap) {
            scanMapRecord = {
                _id: latestScanMap._id,
                palabraClave: latestScanMap.keyword,
                dominio: latestScanMap.domain,
                dominioFiltrado: latestScanMap.domain,
                posicion: null,
                posicionAnterior: null,
                buscador: 'scanmap',
                dispositivo: 'scanmap',
                location: latestScanMap.centerLocation?.name || 'N/A',
                createdAt: latestScanMap.createdAt,
                updatedAt: latestScanMap.updatedAt || latestScanMap.createdAt,
                rating: null,
                reviews: null,
                tipoBusqueda: 'palabraClave',
                tendencia24h: { posicionAnterior: null, diferencia: null, color: 'gray', simbolo: '—' },
                tendencia7d: { posicionAnterior: null, diferencia: null, color: 'gray', simbolo: '—' }
            };
        }

        const enrichedResults = aggregationResults.map(result => ({
            ...result,
            tendencia24h: calculateTrend(result.posicion, result.posicionAnterior),
            tendencia7d: calculateTrend(result.posicion, result.posicionAnterior)
        }));

        if (scanMapRecord) {
            enrichedResults.push(scanMapRecord);
        }

        enrichedResults.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
        });

        return NextResponse.json({ success: true, historial: enrichedResults });
    } catch (err) {
        console.error('Error loading domain history:', err);
        return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
    }
}