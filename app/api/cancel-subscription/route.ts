import { NextResponse } from 'next/server';
import User from '@/models/User';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongoose';
import { cookies } from 'next/headers';

export async function POST() {
    await connectDB();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) {
        return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    }
    const user = await User.findById(userId);
    if (!user || !user.subscriptionId) {
        return NextResponse.json({ success: false, message: 'You do not have an active subscription.' }, { status: 400 });
    }
    try {
        await stripe.subscriptions.update(user.subscriptionId, { cancel_at_period_end: true });
        user.isSubscriptionCanceled = true;
        await user.save();
        return NextResponse.json({
            success: true,
            message: 'Subscription canceled. You will retain access until the end of the current billing period.',
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        return NextResponse.json({ success: false, message: 'Error canceling subscription.' }, { status: 500 });
    }
}