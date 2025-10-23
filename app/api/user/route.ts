import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/mongoose';
import { cookies } from 'next/headers';

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
    return NextResponse.json({
        success: true,
        user: {
            username: user.username,
            email: user.email,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionEndDate: user.subscriptionEndDate,
            subscriptionId: user.subscriptionId,
            isSubscriptionCanceled: user.isSubscriptionCanceled || false,
            role: user.role,
            stripeCustomerId: user.stripeCustomerId,
            limitKeywords: user.limitKeywords,
            limitScanMap: user.limitScanMap,
        },
    });
}