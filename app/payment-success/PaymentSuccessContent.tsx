'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { showToast } from 'nextjs-toast-notify';

export default function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        if (!sessionId) {
            showToast.error('Session ID not found.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
            return;
        }

        showToast.success('Payment completed. You will be redirected to Ranku.', {
            duration: 2500,
            position: 'top-center',
            transition: 'topBounce',
            sound: true,
        });

        const timer = setTimeout(() => {
            window.location.href = '/dashboard';
        }, 3000);

        return () => clearTimeout(timer);
    }, [sessionId]);

    return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1>Payment completed</h1>
            <p>Thank you for your purchase. You will be automatically redirected in 3 seconds...</p>
            <button
                onClick={() => (window.location.href = '/dashboard')}
                style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#00f36dff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }}
            >
                Go to Profile & Subscription Now
            </button>
        </div>
    );
}