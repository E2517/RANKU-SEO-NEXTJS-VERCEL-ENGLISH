import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/mongoose';
import transporter from '@/lib/nodemailer';
import crypto from 'crypto';

export async function POST(request: Request) {
  await connectDB();

  try {
    const { email } = await request.json();

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return NextResponse.json({
        success: true,
        message: 'If the email exists and has a password, you will receive a link.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

    await transporter.sendMail({
      to: user.email,
      from: process.env.EMAIL_USER!,
      subject: 'Reset your password - Ranku',
      html: `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>The link expires in 1 hour.</p>`,
    });

    return NextResponse.json({
      success: true,
      message: 'If the email exists and has a password, you will receive a link.',
    });
  } catch (err) {
    console.error('Error in forgot-password:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to send email.' },
      { status: 500 }
    );
  }
}