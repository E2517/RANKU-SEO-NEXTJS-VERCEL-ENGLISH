import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import User from '@/models/User';
import { connectDB } from '@/lib/mongoose';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/auth', process.env.NEXT_PUBLIC_APP_URL));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    let user = await User.findOne({ email: data.email });

    if (!user) {
      user = await User.create({
        username: data.name || data.email?.split('@')[0],
        email: data.email,
        googleId: data.id,
        password: null,
      });
    } else if (!user.googleId) {
      user.googleId = data.id;
      await user.save();
    }

    const cookieStore = await cookies();
    cookieStore.set('user_id', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL));
  } catch (err) {
    console.error('Error in Google callback:', err);
    return NextResponse.redirect(new URL('/auth', process.env.NEXT_PUBLIC_APP_URL));
  }
}