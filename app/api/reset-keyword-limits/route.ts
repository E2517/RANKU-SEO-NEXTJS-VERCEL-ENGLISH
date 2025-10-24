import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/mongoose';
import { getKeywordLimit } from '@/lib/utils';
import { cookies } from 'next/headers';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
    const url = new URL(request.url);
    const cookieStore = await cookies();
    const userIdFromCookie = cookieStore.get('user_id')?.value;
    const tokenFromQuery = url.searchParams.get('token');

    let isAuthorized = false;

    if (!userIdFromCookie && CRON_SECRET && tokenFromQuery === CRON_SECRET) {
        isAuthorized = true;
    } else if (userIdFromCookie) {
        await connectDB();
        const user = await User.findById(userIdFromCookie);
        if (user && user.role === 'admin') {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 401 });
    }

    const mongooseGlobal: any = global;
    if (!userIdFromCookie || !mongooseGlobal.mongoose) {
        await connectDB();
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const usersToUpdate = await User.find({
        subscriptionPlan: { $ne: 'Gratuito' },
        isSubscriptionCanceled: false,
        subscriptionEndDate: { $gte: today },
    });

    for (const user of usersToUpdate) {
        const newLimit = getKeywordLimit(user.subscriptionPlan);
        user.limitKeywords = newLimit;
        await user.save();
    }

    return NextResponse.json({ success: true, updated: usersToUpdate.length });
}