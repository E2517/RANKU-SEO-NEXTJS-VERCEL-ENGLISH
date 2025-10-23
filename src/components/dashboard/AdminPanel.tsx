'use client';

import { useState, useEffect } from 'react';
import styles from './AdminPanel.module.css';
import { showToast } from 'nextjs-toast-notify';

interface User {
    _id: string;
    username: string;
    email: string;
    subscriptionPlan: string;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    isSubscriptionCanceled: boolean;
    createdAt: string;
    limitKeywords: number;
    limitScanMap: number;
}

interface TrialConfig {
    isActive: boolean;
    trialPeriodDays: number;
}

export default function AdminPanel() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [trialConfig, setTrialConfig] = useState<TrialConfig>({ isActive: false, trialPeriodDays: 7 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/admin/users');
                if (res.status === 403) {
                    showToast.error('Access denied. You do not have admin permissions.', {
                        duration: 4000,
                        position: 'top-center',
                        transition: 'topBounce',
                        sound: true,
                    });
                    setLoading(false);
                    return;
                }
                if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                const data = await res.json();
                if (data && data.success === true && Array.isArray(data.users)) {
                    const sortedUsers = data.users.sort((a: User, b: User) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setUsers(sortedUsers);
                } else {
                    showToast.error('Invalid server response. Incorrect format.', {
                        duration: 4000,
                        position: 'top-center',
                        transition: 'topBounce',
                        sound: true,
                    });
                }
            } catch (err: any) {
                showToast.error(err.message || 'Network error loading users', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            } finally {
                setLoading(false);
            }
        };

        const fetchTrialConfig = async () => {
            try {
                const res = await fetch('/api/admin/update-trial');
                if (res.status === 403) {
                    showToast.error('Access denied. You do not have admin permissions.', {
                        duration: 4000,
                        position: 'top-center',
                        transition: 'topBounce',
                        sound: true,
                    });
                    return;
                }
                if (!res.ok) throw new Error('Error loading trial configuration');
                const data = await res.json();
                if (data.success) {
                    setTrialConfig({
                        isActive: data.isActive,
                        trialPeriodDays: data.trialPeriodDays,
                    });
                }
            } catch (err: any) {
                showToast.error(err.message || 'Error loading trial configuration', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            }
        };

        fetchUsers();
        fetchTrialConfig();
    }, []);

    const handleResetLimits = async () => {
        try {
            const res = await fetch('/api/reset-keyword-limits', { method: 'GET' });
            if (res.status === 403) {
                showToast.error('Access denied. You do not have admin permissions.', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
                return;
            }
            const data = await res.json();
            if (data.success) {
                showToast.success(`Limits reset. Updated users: ${data.updated}`, {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            } else {
                showToast.error(data.message || 'Error resetting limits', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            }
        } catch (err: any) {
            showToast.error(err.message || 'Network error resetting limits', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
        }
    };

    const handleUpdateAllKeywords = async () => {
        try {
            const res = await fetch('/api/admin/update-all-keywords', { method: 'GET' });
            if (res.status === 403) {
                showToast.error('Access denied. You do not have admin permissions.', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
                return;
            }
            const data = await res.json();
            if (data.success) {
                showToast.success(`Keywords updated. Processed records: ${data.updated}`, {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            } else {
                showToast.error(data.message || 'Error updating keywords', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            }
        } catch (err: any) {
            showToast.error(err.message || 'Network error updating keywords', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
        }
    };

    const handleSaveTrialConfig = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/update-trial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isActive: trialConfig.isActive,
                    trialPeriodDays: trialConfig.trialPeriodDays,
                }),
            });
            if (res.status === 403) {
                showToast.error('Access denied. You do not have admin permissions.', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
                setSaving(false);
                return;
            }
            const data = await res.json();
            if (data.success) {
                showToast.success('Trial period configuration updated.', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            } else {
                showToast.error(data.message || 'Error saving configuration', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            }
        } catch (err: any) {
            showToast.error(err.message || 'Network error saving configuration', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleTrial = () => {
        setTrialConfig((prev) => ({ ...prev, isActive: !prev.isActive }));
    };

    const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        if (value >= 1 && value <= 90) {
            setTrialConfig((prev) => ({ ...prev, trialPeriodDays: value }));
        }
    };

    if (loading) {
        return <div className={styles.card}>Loading users...</div>;
    }

    return (
        <div className={styles.card}>
            <h2>Admin Panel</h2>
            <div className={styles.actionSection}>
                <div className={styles.buttonGroup}>
                    <button className={styles.primaryButton} onClick={handleResetLimits}>
                        Reset Keyword Limits
                    </button>
                    <button className={styles.secondaryButton} onClick={handleUpdateAllKeywords}>
                        Update All Keywords
                    </button>
                </div>
                <p className={styles.hint}>A Cron job runs on Vercel daily at 00:00 and 03:00 (configured in vercel.json)</p>
            </div>

            <div className={styles.trialSection}>
                <h3>Trial Period Configuration</h3>
                <div className={styles.trialToggle}>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={trialConfig.isActive}
                            onChange={handleToggleTrial}
                        />
                        <span className={styles.slider}></span>
                    </label>
                    <span>Enable trial period</span>
                </div>
                <div className={styles.daysInput}>
                    <label>Trial days:</label>
                    <input
                        type="number"
                        min="1"
                        max="90"
                        value={trialConfig.trialPeriodDays}
                        onChange={handleDaysChange}
                        disabled={!trialConfig.isActive}
                    />
                </div>
                <button
                    className={styles.saveButton}
                    onClick={handleSaveTrialConfig}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.usersTable}>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Plan</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Canceled</th>
                            <th>Registered</th>
                            <th>Keywords</th>
                            <th>ScanMap</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <tr key={user._id}>
                                    <td>{user.email}</td>
                                    <td><span className={`${styles.planTag} ${styles[user.subscriptionPlan.toLowerCase()]}`}>{user.subscriptionPlan}</span></td>
                                    <td>{user.subscriptionStartDate ? new Date(user.subscriptionStartDate).toLocaleDateString() : '-'}</td>
                                    <td>{user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString() : '-'}</td>
                                    <td><span className={user.isSubscriptionCanceled ? styles.statusRed : styles.statusGreen}>{user.isSubscriptionCanceled ? 'Yes' : 'No'}</span></td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>{user.limitKeywords}</td>
                                    <td>{user.limitScanMap}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className={styles.noData}>No registered users.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}