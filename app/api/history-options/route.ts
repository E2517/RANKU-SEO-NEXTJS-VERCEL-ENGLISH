// app/api/history-options/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongoose';
import SearchResult from '@/models/SearchResult';
import { Types } from 'mongoose';

export const dynamic = 'force-dynamic';

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

    try {
        const keywords = await SearchResult.distinct('palabraClave', {
            userId,
            tipoBusqueda: 'palabraClave',
            palabraClave: { $nin: [null, ''] }
        });

        const domains = (await SearchResult.distinct('dominio', {
            userId,
            tipoBusqueda: 'palabraClave',
            dominio: { $nin: [null, 'N/A'] }
        })).filter(d => d && d.length > 0);

        return NextResponse.json({ success: true, keywords, domains });
    } catch (err) {
        console.error('Error loading history options:', err);
        return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
    }
}