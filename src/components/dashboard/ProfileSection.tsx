'use client';

import { useState, useEffect } from 'react';
import styles from './ProfileSection.module.css';
import { getKeywordLimit, getScanMapBaseLimit } from '@/lib/utils';
import { showToast } from 'nextjs-toast-notify';

export default function ProfileSection() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [keywordUsage, setKeywordUsage] = useState<number>(0);
    const [scanmapUsage, setScanmapUsage] = useState<{ usedThisCycle: number; baseLimit: number; creditsPurchased: number; creditsUsed: number } | null>(null);
    const [trialInfo, setTrialInfo] = useState<{ show: boolean; days: number }>({ show: false, days: 0 });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/user');
                if (res.status === 401) {
                    window.location.href = '/auth';
                    return;
                }
                const data = await res.json();
                if (data.success) {
                    setUser(data.user);
                }
            } catch (err) {
                console.error('Error loading profile:', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchTrialStatus = async () => {
            try {
                const res = await fetch('/api/trial-status');
                if (res.ok) {
                    const data = await res.json();
                    setTrialInfo({
                        show: data.show || false,
                        days: data.days || 0,
                    });
                }
            } catch (err) {
                console.error('Error loading trial status:', err);
            }
        };

        fetchUser();
        fetchTrialStatus();
    }, []);

    useEffect(() => {
        const fetchKeywordUsage = async () => {
            try {
                const res = await fetch('/api/keywords');
                if (!res.ok) return;
                const data = await res.json();
                if (data.success) {
                    setKeywordUsage(data.records.length);
                }
            } catch (err) {
                console.error('Error loading keywords:', err);
            }
        };

        const fetchScanMapUsage = async () => {
            try {
                const res = await fetch('/api/user-scanmap-usage');
                if (res.status === 401) {
                    window.location.href = '/auth';
                    return;
                }
                const data = await res.json();
                if (data.success) {
                    setScanmapUsage(data.usage);
                }
            } catch (err) {
                console.error('Error loading ScanMap usage:', err);
            }
        };

        if (user) {
            fetchKeywordUsage();
            fetchScanMapUsage();
        }
    }, [user]);

    const handlePlanClick = (plan: string) => {
        const subscribe = async () => {
            try {
                const res = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan }),
                });
                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    showToast.error(`Error starting subscription: ${data.error || data.message || 'Unknown error.'}`, {
                        duration: 4000,
                        position: 'top-center',
                        transition: 'topBounce',
                        sound: true,
                    });
                }
            } catch (e) {
                showToast.error('Connection error with payment server.', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            }
        };

        showToast.info(`Redirecting to ${plan} plan subscription...`, {
            duration: 2000,
            position: 'top-center',
            transition: 'topBounce',
            sound: true,
        });

        setTimeout(subscribe, 1000);
    };

    const handleCreditsClick = (credits: number) => {
        const buyCredits = async () => {
            try {
                const res = await fetch('/api/scanmap/buy-credits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: credits }),
                });
                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    showToast.error(`Error initiating payment: ${data.error || data.message || 'Unknown error.'}`, {
                        duration: 4000,
                        position: 'top-center',
                        transition: 'topBounce',
                        sound: true,
                    });
                }
            } catch (e) {
                showToast.error('Connection error with payment server.', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            }
        };

        buyCredits();
    };

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription?')) {
            return;
        }

        try {
            const res = await fetch('/api/cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (data.success) {
                showToast.success('Subscription canceled. You will retain access until the end date.', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
                window.location.reload();
            } else {
                showToast.error(`Error canceling: ${data.message || 'Unknown error.'}`, {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            }
        } catch (e) {
            showToast.error('Connection error with server.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
        }
    };

    if (loading) {
        return <div className={styles.profileCard}>Loading profile...</div>;
    }

    if (!user) {
        return <div className={styles.profileCard}>Error loading profile.</div>;
    }

    const keywordLimit = getKeywordLimit(user.subscriptionPlan);
    const scanMapBaseLimit = getScanMapBaseLimit(user.subscriptionPlan);
    const isSubscribed = user.subscriptionPlan !== 'Gratuito' && !user.isSubscriptionCanceled;

    return (
        <div className={styles.profileCard}>
            <h4>User Information</h4>
            <p><strong>Username:</strong> <span id="profile-username">{user.username}</span></p>
            <p><strong>Email:</strong> <span id="profile-email">{user.email}</span></p>

            <div className={styles.subscriptionCard}>
                <h4>My Subscription</h4>
                <p><strong>Status:</strong> <span id="profile-subscription-status">{isSubscribed ? 'Active' : 'Not subscribed'}</span></p>
                <p><strong>Plan:</strong> <span id="profile-subscription-plan">{user.subscriptionPlan === 'Gratuito' ? 'Gratuito' : user.subscriptionPlan}</span></p>
                {isSubscribed && user.subscriptionEndDate && (
                    <p><strong>Auto-renews on:</strong> {new Date(user.subscriptionEndDate).toLocaleDateString()}</p>
                )}
                {!isSubscribed && <p><strong>Auto-renews on:</strong> --</p>}
                {user.subscriptionPlan !== 'Gratuito' && (
                    <p><strong>Keywords searched:</strong> <span id="keyword-usage">{keywordUsage} / {keywordLimit} ({user.subscriptionPlan})</span></p>
                )}
                {scanmapUsage && (
                    <div className={styles.usageInfo}>
                        <p id="scanmap-usage-info">
                            ScanMap: {scanmapUsage.usedThisCycle} / {scanMapBaseLimit} (base monthly searches)
                            {scanmapUsage.creditsPurchased > 0 ? ` + ${scanmapUsage.creditsUsed} / ${scanmapUsage.creditsPurchased} (purchased credits)` : ''}
                        </p>
                    </div>
                )}
                {isSubscribed && (
                    <button className={styles.cancelButton} onClick={handleCancelSubscription}>
                        Cancel Subscription
                    </button>
                )}
            </div>

            <h2 style={{ textAlign: 'center', marginTop: '2rem' }}>Choose your plan</h2>

            {trialInfo.show && trialInfo.days > 0 && (
                <div style={{
                    textAlign: 'center',
                    margin: '1.5rem auto',
                    padding: '12px 20px',
                    backgroundColor: '#f8f9fa',
                    color: '#6c4ab6',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                    maxWidth: '600px'
                }}>
                    ✨ <strong>Subscribe</strong> to a <span>{trialInfo.days}-day Free Trial</span> 🎁.
                </div>
            )}

            <div className={styles.subscriptionPlans}>
                <div className={styles.planCard}>
                    <h3>Basico</h3>
                    <div className={styles.planPrice}>$50<span className={styles.period}>/month</span></div>
                    <ul>
                        <li>250 keywords</li>
                        <li>Multi-device analysis (Desktop + Mobile + Local)</li>
                        <li>Domain History</li>
                        <li>Search history (by keyword or domain)</li>
                        <li>Daily (24h) and weekly (7-day) updates</li>
                        <li>Competitor analysis</li>
                        <li>✅ RankMap: Google Maps ranking by location</li>
                        <li>🥷 ScanMap: Domain visibility based on user location (5 searches/month)</li>
                        <li>📈 Smart statistics</li>
                        <li>Downloadable Excel report</li>
                        <li>Downloadable SEO PDF report</li>
                    </ul>
                    <button className={styles.checkoutButton} onClick={() => handlePlanClick('Basico')}>Select Basico Plan</button>
                </div>

                <div className={styles.planCard}>
                    <h3>Pro</h3>
                    <div className={styles.planPrice}>$100<span className={styles.period}>/month</span></div>
                    <ul>
                        <li>500 keywords</li>
                        <li>Multi-device analysis (Desktop + Mobile + Local)</li>
                        <li>Domain History</li>
                        <li>Search history (by keyword or domain)</li>
                        <li>Daily (24h) and weekly (7-day) updates</li>
                        <li>Competitor analysis</li>
                        <li>✅ RankMap: Google Maps ranking by location</li>
                        <li>🥷 ScanMap: Domain visibility based on user location (10 searches/month)</li>
                        <li>📈 Smart statistics</li>
                        <li>Downloadable Excel report</li>
                        <li>Downloadable SEO PDF report</li>
                    </ul>
                    <button className={styles.checkoutButton} onClick={() => handlePlanClick('Pro')}>Select Pro Plan</button>
                </div>

                <div className={styles.planCard}>
                    <h3>Ultra</h3>
                    <div className={styles.planPrice}>$250<span className={styles.period}>/month</span></div>
                    <ul>
                        <li>1,000 keywords</li>
                        <li>Multi-device analysis (Desktop + Mobile + Local)</li>
                        <li>Domain History</li>
                        <li>Search history (by keyword or domain)</li>
                        <li>Daily (24h) and weekly (7-day) updates</li>
                        <li>Competitor analysis</li>
                        <li>✅ RankMap: Google Maps ranking by location</li>
                        <li>🥷 ScanMap: Domain visibility based on user location (15 searches/month)</li>
                        <li>📈 Smart statistics</li>
                        <li>Downloadable Excel report</li>
                        <li>Downloadable SEO PDF report</li>
                    </ul>
                    <button className={styles.checkoutButton} onClick={() => handlePlanClick('Ultra')}>Select Ultra Plan</button>
                </div>
            </div>

            <h2 style={{ marginTop: '2rem' }}>Additional ScanMap Credits</h2>
            <div className={styles.subscriptionPlans}>
                <div className={styles.planCard}>
                    <h3>5 searches</h3>
                    <div className={styles.planPrice}>$5</div>
                    <button className={styles.creditsButton} onClick={() => handleCreditsClick(5)}>Buy</button>
                </div>
                <div className={styles.planCard}>
                    <h3>10 searches</h3>
                    <div className={styles.planPrice}>$10</div>
                    <button className={styles.creditsButton} onClick={() => handleCreditsClick(10)}>Buy</button>
                </div>
                <div className={styles.planCard}>
                    <h3>15 searches</h3>
                    <div className={styles.planPrice}>$15</div>
                    <button className={styles.creditsButton} onClick={() => handleCreditsClick(15)}>Buy</button>
                </div>
                <div className={styles.planCard}>
                    <h3>25 searches</h3>
                    <div className={styles.planPrice}>$25</div>
                    <button className={styles.creditsButton} onClick={() => handleCreditsClick(25)}>Buy</button>
                </div>
            </div>
        </div>
    );
}