import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongoose';
import SearchResult from '@/models/SearchResult';
import LocalVisibilityCampaign from '@/models/LocalVisibilityCampaign';
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

        const searchResults = await SearchResult.find(matchBase).sort({ createdAt: -1 });

        const campaignMatch: any = { userId };
        if (domain) campaignMatch.domain = domain;
        if (keyword) campaignMatch.keyword = keyword;

        const campaigns = await LocalVisibilityCampaign.find(campaignMatch).sort({ createdAt: -1 });

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

        const uniqueKeyFields = ['palabraClave', 'location', 'dispositivo', 'buscador', 'dominio'];
        const uniqueMap = new Map();
        allRecords.forEach(r => {
            if (!r.dominio || r.dominio === 'N/A') return;
            const key = uniqueKeyFields.map(f => (r as any)[f] || '').join('|');
            if (!uniqueMap.has(key)) uniqueMap.set(key, r);
        });
        const uniqueRecords = Array.from(uniqueMap.values());

        return NextResponse.json({
            success: true,
            results: uniqueRecords.map(r => ({
                keyword: r.palabraClave,
                domain: r.dominio,
                position: r.posicion,
                change24h: '—',
                change7d: '—',
                searchEngine: r.buscador,
                device: r.dispositivo,
                location: r.location
            }))
        });
    } catch (err) {
        console.error('Error in /api/stats-detailed:', err);
        return NextResponse.json({ success: false, message: 'Internal error.' }, { status: 500 });
    }
}