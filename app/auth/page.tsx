'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './login.css';

export default function LoginPage() {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ text: data.message, type: 'success' });
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1200);
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch {
      setMessage({ text: 'Connection error.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Ranku</h1>
        <p>Log In</p>

        {message && (
          <div
            className={message.type === 'success' ? 'message-success' : 'message-error'}
            style={{ marginBottom: '16px', padding: '10px', borderRadius: '4px' }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" required />
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required />
          <div className="remember-me">
            <input type="checkbox" id="remember-me" name="remember-me" />
            <label htmlFor="remember-me">Remember password</label>
          </div>
          <Link href="/auth/forgot-password" className="forgot-password">
            Forgot your password?
          </Link>
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <div className="divider">
          <span>Or log in with</span>
        </div>
        <button
          className="google-button"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/api/auth/google';
          }}
        >
          <Image src="/assets/google-icon.webp" alt="Google" width={20} height={20} />
          Log in with Google
        </button>
        <div className="register-link">
          Don’t have an account? <Link href="/auth/register">Sign up here</Link>
        </div>
      </div>
    </div>
  );
}