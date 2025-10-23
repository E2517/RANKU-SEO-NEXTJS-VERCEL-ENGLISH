'use client';

import { useState, useEffect } from 'react';
import styles from './KeywordCounter.module.css';
import { showToast } from 'nextjs-toast-notify';

export default function KeywordCounter() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/keywords');
            const data = await res.json();
            if (data.success) {
                setRecords(data.records);
            } else {
                showToast.error('Error: ' + (data.message || 'Failed to load history.'), {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            }
        } catch (err) {
            console.error(err);
            showToast.error('Network error loading history.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteRecord = async (id: string) => {
        if (!confirm('Delete this record?')) return;
        setDeleting(true);
        try {
            await fetch(`/api/keywords?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            setRecords(records.filter(r => r._id !== id));
        } catch (err) {
            showToast.error('Error deleting record.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
        } finally {
            setDeleting(false);
        }
    };

    const deleteAll = async () => {
        if (!confirm('Delete all keyword history? This action cannot be undone.')) return;
        setDeleting(true);
        try {
            await fetch('/api/keywords?all=true', { method: 'DELETE' });
            setRecords([]);
        } catch (err) {
            showToast.error('Error deleting all records.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    return (
        <div className={styles.card}>
            <h2>Searched Keywords</h2>
            <div className={styles.formGroup}>
                <label>🔍 Review the keywords you’ve searched.</label>
            </div>
            <div className={styles.usageInfo}>
                {records.length > 0
                    ? `You have ${records.length} saved searches.`
                    : loading
                        ? 'Loading...'
                        : 'Perform a search to populate your results.'}
            </div>
            <button
                className={styles.button}
                onClick={loadHistory}
                disabled={loading || deleting}
            >
                {loading ? 'Loading...' : 'Reload History'}
            </button>
            {records.length > 0 && (
                <button
                    className={`${styles.button} ${styles.dangerButton}`}
                    onClick={deleteAll}
                    disabled={deleting}
                    style={{ marginTop: '0.5rem' }}
                >
                    {deleting ? 'Deleting...' : 'Delete All'}
                </button>
            )}
            <div className={styles.tableContainer}>
                {records.length > 0 && (
                    <table className={styles.keywordsTable}>
                        <thead>
                            <tr>
                                <th>Keyword</th>
                                <th>Domain</th>
                                <th>Device</th>
                                <th>Last Search</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record, index) => (
                                <tr key={record._id || `kw-${index}-${record.palabraClave}-${record.dominioFiltrado}-${record.dispositivo}`}>
                                    <td>{record.palabraClave || '-'}</td>
                                    <td>{record.dominio || record.dominioFiltrado || '-'}</td>
                                    <td>{record.dispositivo || '-'}</td>
                                    <td>
                                        {record.updatedAt
                                            ? new Date(record.updatedAt).toLocaleString()
                                            : '-'}
                                    </td>
                                    <td>
                                        <button
                                            className={styles.deleteButton}
                                            onClick={() => deleteRecord(record._id)}
                                            disabled={deleting}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}