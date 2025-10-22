import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { cookies } from 'next/headers';

const CREDITS_PRICE_IDS = {
    5: process.env.STRIPE_SCANMAP_5_CREDITS_PRICE_ID,
    10: process.env.STRIPE_SCANMAP_10_CREDITS_PRICE_ID,
    15: process.env.STRIPE_SCANMAP_15_CREDITS_PRICE_ID,
    25: process.env.STRIPE_SCANMAP_25_CREDITS_PRICE_ID,
} as const;

type CreditAmount = keyof typeof CREDITS_PRICE_IDS;

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) {
        return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    }

    const body = await req.json();
    const amount = body.amount as CreditAmount;

    if (!CREDITS_PRICE_IDS[amount]) {
        return NextResponse.json(
            { success: false, message: 'Invalid amount. Options: 5, 10, 15, or 25 searches.' },
            { status: 400 }
        );
    }

    const priceId = CREDITS_PRICE_IDS[amount];
    if (!priceId) {
        return NextResponse.json(
            { success: false, message: 'Pricing configuration incomplete.' },
            { status: 500 }
        );
    }

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile`,
            client_reference_id: userId,
            metadata: {
                credits: amount.toString(),
                type: 'scanmap_credits',
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}