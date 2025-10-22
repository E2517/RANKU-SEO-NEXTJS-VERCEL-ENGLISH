'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './register.css';

export default function RegisterPage() {
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirm-password') as string;

        setMessage(null);

        if (password !== confirmPassword) {
            setMessage({ text: 'Passwords do not match.', type: 'error' });
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: name, email, password }),
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ text: data.message, type: 'success' });
                setTimeout(() => {
                    window.location.href = '/auth';
                }, 1500);
            } else {
                setMessage({ text: data.message, type: 'error' });
            }
        } catch (error) {
            console.error('Registration error:', error);
            setMessage({ text: 'Connection error.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-form">
                <h1>Ranku</h1>
                <p>Create an account</p>

                {message && (
                    <div
                        className={message.type === 'success' ? 'message-success' : 'message-error'}
                        style={{ marginBottom: '16px', padding: '10px', borderRadius: '4px' }}
                    >
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="name">Full name:</label>
                    <input type="text" id="name" name="name" required />

                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" required />

                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" required />

                    <label htmlFor="confirm-password">Confirm password:</label>
                    <input type="password" id="confirm-password" name="confirm-password" required />

                    <div className="terms">
                        <input type="checkbox" id="terms" name="terms" required />
                        <label htmlFor="terms">
                            <Link href="/legal#condiciones-contratacion">
                                I accept the Terms of Service
                            </Link>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Registering...' : 'Sign up'}
                    </button>
                </form>

                <div className="divider">
                    <span>Or sign up with</span>
                </div>

                <button
                    className="google-button"
                    onClick={(e) => {
                        e.preventDefault();
                        window.location.href = '/api/auth/google';
                    }}
                >
                    <Image src="/assets/google-icon.webp" alt="Google" width={20} height={20} />
                    Sign up with Google
                </button>

                <div className="login-link">
                    Already have an account?{' '}
                    <Link href="/auth">
                        Log in here
                    </Link>
                </div>
            </div>
        </div>
    );
}