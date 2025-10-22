'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './reset-password.css';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/auth');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: decodeURIComponent(token), password }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ text: 'Password updated successfully.', type: 'success' });
        setTimeout(() => {
          window.location.href = '/auth';
        }, 1500);
      } else {
        setMessage({ text: data.message || 'Failed to reset password.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Connection error.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) return null;

  return (
    <div className="reset-password-container">
      <div className="reset-password-form">
        <h1>Reset Password</h1>
        <form id="resetForm" onSubmit={handleSubmit}>
          <input type="hidden" id="token" value={decodeURIComponent(token)} />
          <label htmlFor="password">New password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        {message && (
          <div
            id="message"
            className={message.type === 'success' ? 'message-success' : 'message-error'}
            style={{ marginTop: '10px', padding: '8px', borderRadius: '4px' }}
          >
            {message.text}
          </div>
        )}
        <div className="switch-form">
          <a href="/auth">Back to login</a>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}