import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/mongoose';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  await connectDB();

  try {
    const { username, email, password } = await request.json();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email is already registered.' },
        { status: 400 }
      );
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    (await cookies()).set('user_id', newUser._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'Registration successful.' });
  } catch (err) {
    console.error('Error in registration:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}