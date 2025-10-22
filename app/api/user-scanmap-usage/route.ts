import { NextResponse } from 'next/server';
import User from '@/models/User';
import LocalVisibilityCampaign from '@/models/LocalVisibilityCampaign';
import { connectDB } from '@/lib/mongoose';
import { cookies } from 'next/headers';

function getScanMapLimit(subscriptionPlan: string) {
    if (subscriptionPlan === 'Basico') return 5;
    if (subscriptionPlan === 'Pro') return 10;
    if (subscriptionPlan === 'Ultra') return 15;
    return 0;
}

function getStartOfCurrentBillingCycle(user: any) {
    if (user.subscriptionId && !user.isSubscriptionCanceled && user.subscriptionStartDate) {
        return new Date(user.subscriptionStartDate);
    }
    return new Date(user.createdAt);
}

export async function GET() {
    await connectDB();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) {
        return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    }
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }
    const baseLimit = getScanMapLimit(user.subscriptionPlan);
    const cycleStart = getStartOfCurrentBillingCycle(user);
    const usedThisCycle = await LocalVisibilityCampaign.countDocuments({
        userId,
        createdAt: { $gte: cycleStart },
    });
    const totalUsedEver = await LocalVisibilityCampaign.countDocuments({ userId });
    const baseLimitEver = await LocalVisibilityCampaign.countDocuments({
        userId,
        createdAt: { $gte: new Date(user.createdAt || new Date(0)) },
    });
    const creditsUsed = Math.max(0, totalUsedEver - baseLimitEver);
    return NextResponse.json({
        success: true,
        usage: {
            baseLimit,
            usedThisCycle,
            creditsPurchased: user.limitScanMap,
            creditsUsed,
        },
    });
}