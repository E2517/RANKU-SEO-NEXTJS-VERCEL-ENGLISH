import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Promotion from '@/models/Promotion';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { Types } from 'mongoose';

export async function GET() {
    await connectDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId || !Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ success: false }, { status: 403 });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ success: false }, { status: 403 });
    }

    try {
        const promotion = await Promotion.findOne({ type: 'trial' });
        return NextResponse.json({
            success: true,
            isActive: promotion?.isActive ?? false,
            trialPeriodDays: promotion?.trialPeriodDays ?? 7,
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error fetching configuration' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await connectDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId || !Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ success: false }, { status: 403 });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ success: false }, { status: 403 });
    }

    try {
        const { isActive, trialPeriodDays } = await req.json();

        if (typeof isActive !== 'boolean') {
            return NextResponse.json({ success: false, message: 'isActive must be a boolean' }, { status: 400 });
        }

        const days = Number(trialPeriodDays);
        if (isNaN(days) || days < 1 || days > 90) {
            return NextResponse.json({ success: false, message: 'trialPeriodDays must be a number between 1 and 90' }, { status: 400 });
        }

        await Promotion.findOneAndUpdate(
            { type: 'trial' },
            { isActive, trialPeriodDays: days, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error saving configuration' }, { status: 500 });
    }
}