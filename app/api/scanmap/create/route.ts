import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import LocalVisibilityCampaign from '@/models/LocalVisibilityCampaign';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function geocodeAddress(address: string) {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json  ');
    url.searchParams.set('address', address);
    url.searchParams.set('key', process.env.GOOGLE_MAPS_API_KEY as string);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || data.results.length === 0) {
        throw new Error('Address not found');
    }
    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
}

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const userIdFromCookie = cookieStore.get('user_id')?.value;
    if (!userIdFromCookie) {
        return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    }
    await connectDB();
    const user = await User.findById(userIdFromCookie);
    if (!user) {
        return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }
    if (user.limitScanMap <= 0) {
        return NextResponse.json({ success: false, message: 'ScanMap limit reached.' }, { status: 403 });
    }
    const body = await req.json();
    const { keyword, domain, address, maxRadiusMeters = 1000, stepMeters = 500 } = body;
    if (!keyword || !domain || !address) {
        return NextResponse.json({ success: false, message: 'Missing parameters.' }, { status: 400 });
    }
    try {
        const { lat, lng } = await geocodeAddress(address);
        const campaign = new LocalVisibilityCampaign({
            userId: userIdFromCookie,
            keyword,
            domain,
            centerLocation: { name: address, lat, lng },
            maxRadiusMeters,
            stepMeters,
            status: 'processing'
        });
        await campaign.save();
        user.limitScanMap = Math.max(0, user.limitScanMap - 1);
        await user.save();
        const campaignId = campaign._id.toString();
        console.log('🚀 ScanMap started. ID:', campaignId, 'Domain:', domain, 'Keyword:', keyword);

        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scanmap/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId, keyword, domain, lat, lng, maxRadiusMeters, stepMeters })
        }).catch(console.error);

        return NextResponse.json({ success: true, campaignId });
    } catch (error: any) {
        console.error('Error creating ScanMap:', error.message);
        return NextResponse.json({ success: false, message: error.message || 'Internal error.' }, { status: 500 });
    }
}