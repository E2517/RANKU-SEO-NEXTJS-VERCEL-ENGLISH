import { NextResponse } from 'next/server';
import Promotion from '@/models/Promotion';
import { connectDB } from '@/lib/mongoose';

export async function GET() {
    await connectDB();
    try {
        const promo = await Promotion.findOne({ type: 'trial' });
        if (!promo || !promo.isActive) {
            return NextResponse.json({ show: false });
        }
        return NextResponse.json({
            show: true,
            days: promo.trialPeriodDays,
        });
    } catch (err) {
        console.error('Error fetching trial status:', err);
        return NextResponse.json({ show: false }, { status: 500 });
    }
}