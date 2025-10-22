import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongoose';
import SearchResult from '@/models/SearchResult';
import LocalVisibilityCampaign from '@/models/LocalVisibilityCampaign';
import { Types } from 'mongoose';
import * as XLSX from 'xlsx';

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
        console.error(e)
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
            palabraClave: c.keyword,
            dominio: c.domain,
            posicion: null,
            buscador: 'scanmap',
            dispositivo: 'scanmap',
            location: c.centerLocation?.name || 'N/A',
            createdAt: c.createdAt,
            updatedAt: c.updatedAt || c.createdAt
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

        const worksheetData = uniqueRecords.map(r => ({
            'Keyword': r.palabraClave || '',
            'Domain': r.dominio || '',
            'Position': r.posicion !== null && r.posicion !== undefined ? r.posicion : '—',
            'Search Engine': r.buscador || '',
            'Device': r.dispositivo || '',
            'Location': r.location || '',
            'Last Updated': r.updatedAt ? new Date(r.updatedAt).toLocaleString('en-US') : ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const headers = new Headers();
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        headers.set('Content-Disposition', `attachment; filename="seo_report_${domain || 'all'}.xlsx"`);

        return new NextResponse(excelBuffer, { headers });
    } catch (err) {
        console.error('Error generating Excel:', err);
        return NextResponse.json({ success: false, message: 'Error generating Excel file.' }, { status: 500 });
    }
}