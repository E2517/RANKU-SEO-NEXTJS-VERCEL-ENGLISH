import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import SearchResult from '@/models/SearchResult';
import { connectDB } from '@/lib/mongoose';

export async function GET() {
    console.log('Starting GET in /api/historial-options-domains');
    await connectDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    console.log('user_id from cookies:', userId);

    if (!userId) {
        console.log('User not authenticated: user_id missing');
        return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    }

    try {
        console.log('Querying domains for userId:', userId);
        const domains = (
            await SearchResult.distinct('dominio', {
                userId,
                dominio: { $nin: [null, ''] }
            })
        ).filter((d) => d && d.length > 0);
        console.log('Domains found:', domains);

        return NextResponse.json({ success: true, domains });
    } catch (err) {
        console.error('Error loading domain history options:', err);
        return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
    }
}