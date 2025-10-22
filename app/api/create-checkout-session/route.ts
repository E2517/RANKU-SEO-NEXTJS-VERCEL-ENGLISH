import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import User from '@/models/User';
import Promotion from '@/models/Promotion';
import { connectDB } from '@/lib/mongoose';
import { cookies } from 'next/headers';

const PLAN_PRICE_IDS = {
    Basico: process.env.STRIPE_BASICO_PRICE_ID,
    Pro: process.env.STRIPE_PRO_PRICE_ID,
    Ultra: process.env.STRIPE_ULTRA_PRICE_ID,
} as const;

export async function POST(req: Request) {
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

    const { plan } = await req.json();
    const priceId = PLAN_PRICE_IDS[plan as keyof typeof PLAN_PRICE_IDS];
    if (!priceId) {
        return NextResponse.json({ success: false, message: 'Invalid plan.' }, { status: 400 });
    }

    try {
        const promotion = await Promotion.findOne({ type: 'trial' });
        const trialPeriodDays = promotion?.isActive && promotion.trialPeriodDays > 0
            ? promotion.trialPeriodDays
            : undefined;

        const sessionParams: any = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile`,
            client_reference_id: userId,
            metadata: { plan },
        };

        if (trialPeriodDays !== undefined) {
            sessionParams.subscription_data = { trial_period_days: trialPeriodDays };
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Error in create-checkout-session:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}