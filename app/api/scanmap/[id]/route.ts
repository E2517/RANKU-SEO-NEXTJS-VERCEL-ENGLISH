import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import LocalVisibilityCampaign from '@/models/LocalVisibilityCampaign';
import LocalVisibilityResult from '@/models/LocalVisibilityResult';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    const { id } = await params;
    try {
        const campaign = await LocalVisibilityCampaign.findById(id);
        if (!campaign) {
            return NextResponse.json({ success: false, message: 'ScanMap not found.' }, { status: 404 });
        }
        const results = await LocalVisibilityResult.find({ campaignId: id });
        return NextResponse.json({ success: true, campaign, results });
    } catch (error) {
        console.error('Error retrieving results:', error);
        return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
    }
}