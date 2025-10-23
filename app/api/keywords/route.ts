import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import SearchResult from '@/models/SearchResult';
import LocalVisibilityCampaign from '@/models/LocalVisibilityCampaign';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
        return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    }

    await connectDB();

    try {
        const searchResults = await SearchResult.find(
            { userId, tipoBusqueda: 'palabraClave' },
            {
                palabraClave: 1,
                dominio: 1,
                dominioFiltrado: 1,
                dispositivo: 1,
                buscador: 1,
                updatedAt: 1,
            }
        ).lean();

        const campaigns = await LocalVisibilityCampaign.find(
            { userId },
            {
                keyword: 1,
                domain: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        ).lean();

        const campaignRecords = campaigns.map(c => ({
            palabraClave: c.keyword,
            dominio: c.domain,
            dispositivo: 'scanmap',
            buscador: 'scanmap',
            updatedAt: c.updatedAt || c.createdAt,
        }));

        const allRecords = [...searchResults, ...campaignRecords].sort(
            (a, b) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return dateB - dateA;
            }
        );

        return NextResponse.json({ success: true, records: allRecords });
    } catch (error) {
        console.error('Error loading history:', error);
        return NextResponse.json({ success: false, message: 'Error loading history.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
        return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    }

    await connectDB();

    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');
        const all = url.searchParams.get('all');

        if (all === 'true') {
            await SearchResult.deleteMany({
                userId,
                tipoBusqueda: 'palabraClave'
            });
            await LocalVisibilityCampaign.deleteMany({ userId });
        } else if (id) {
            const deletedSearchResult = await SearchResult.findByIdAndDelete(id);
            if (!deletedSearchResult) {
                await LocalVisibilityCampaign.findByIdAndDelete(id);
            }
        } else {
            return NextResponse.json({ success: false, message: 'ID or "all" parameter required.' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting history:', error);
        return NextResponse.json({ success: false, message: 'Error deleting.' }, { status: 500 });
    }
}