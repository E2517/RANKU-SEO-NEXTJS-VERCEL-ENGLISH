'use client';

import { useState, useEffect } from 'react';
import styles from './StatsSection.module.css';
import { showToast } from 'nextjs-toast-notify';

export default function StatsSection() {
    const [stats, setStats] = useState<any>(null);
    const [detailedStats, setDetailedStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingDetailed, setLoadingDetailed] = useState(false);
    const [domainFilter, setDomainFilter] = useState('');
    const [keywordFilter, setKeywordFilter] = useState('');
    const [availableDomains, setAvailableDomains] = useState<string[]>([]);
    const [availableKeywords, setAvailableKeywords] = useState<string[]>([]);
    const [selectedDevices, setSelectedDevices] = useState<{ desktop: boolean; mobile: boolean; google_local: boolean }>({ desktop: true, mobile: false, google_local: false });

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const res = await fetch('/api/history-options');
                if (res.status === 401) {
                    window.location.href = '/auth';
                    return;
                }
                const data = await res.json();
                if (data.success) {
                    setAvailableDomains(data.domains || []);
                    setAvailableKeywords(data.keywords || []);
                }
            } catch (err) {
                console.error('Error loading filters:', err);
            }
        };
        loadFilters();
    }, []);

    const loadStats = async (domain = '', keyword = '') => {
        setLoading(true);
        try {
            const url = `/api/stats?domain=${encodeURIComponent(domain)}&keyword=${encodeURIComponent(keyword)}`;
            const res = await fetch(url);
            if (res.status === 401) {
                window.location.href = '/auth';
                return;
            }
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                if (domain || keyword) {
                    loadDetailedStats(domain, keyword);
                }
            }
        } catch (err) {
            console.error('Error loading stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadDetailedStats = async (domain = '', keyword = '') => {
        setLoadingDetailed(true);
        try {
            const url = `/api/stats-detailed?domain=${encodeURIComponent(domain)}&keyword=${encodeURIComponent(keyword)}`;
            const res = await fetch(url);
            if (res.status === 401) {
                window.location.href = '/auth';
                return;
            }
            const data = await res.json();
            if (data.success) {
                setDetailedStats(data.results || []);
            }
        } catch (err) {
            console.error('Error loading detailed stats:', err);
        } finally {
            setLoadingDetailed(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const handleFilterChange = () => {
        loadStats(domainFilter, keywordFilter);
    };

    const handleDeviceChange = (device: 'desktop' | 'mobile' | 'google_local') => {
        setSelectedDevices(prev => ({
            ...prev,
            [device]: !prev[device]
        }));
    };

    const handleExportExcel = async () => {
        const params = new URLSearchParams();
        if (domainFilter) params.append('domain', domainFilter);
        if (keywordFilter) params.append('keyword', keywordFilter);
        const url = `/api/export-stats-excel${params.toString() ? '?' + params.toString() : ''}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    showToast.error('Error: ' + (errorJson.message || 'Could not generate report.'), {
                        duration: 4000,
                        position: 'top-center',
                        transition: 'topBounce',
                        sound: true,
                    });
                } catch {
                    showToast.error('Error: The server returned an invalid response.', {
                        duration: 4000,
                        position: 'top-center',
                        transition: 'topBounce',
                        sound: true,
                    });
                }
                return;
            }

            const blob = await response.blob();
            if (blob.size === 0) {
                showToast.error('Error: The generated file is empty.', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
                return;
            }

            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `seo_report_${domainFilter || 'all'}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error('Error downloading Excel:', err);
            showToast.error('Network error while generating the report.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
        }
    };

    const handleExportPdf = async () => {
        if (!domainFilter) {
            showToast.error('Select a domain to generate the PDF report.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
            return;
        }

        const devices = [];
        if (selectedDevices.desktop) devices.push('desktop');
        if (selectedDevices.mobile) devices.push('mobile');
        if (selectedDevices.google_local) devices.push('google_local');

        if (devices.length === 0) {
            showToast.error('Select at least one device.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
            return;
        }

        const params = new URLSearchParams();
        if (domainFilter) params.append('domain', domainFilter);
        if (keywordFilter) params.append('keyword', keywordFilter);
        devices.forEach(d => params.append('device', d));

        const url = `/api/generate-report-pdf?${params.toString()}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    showToast.error('Error: ' + (errorJson.message || 'Could not generate the PDF report.'), {
                        duration: 4000,
                        position: 'top-center',
                        transition: 'topBounce',
                        sound: true,
                    });
                } catch {
                    showToast.error('Error: The server returned an invalid response.', {
                        duration: 4000,
                        position: 'top-center',
                        transition: 'topBounce',
                        sound: true,
                    });
                }
                return;
            }

            const blob = await response.blob();
            if (blob.size === 0) {
                showToast.error('Error: The generated PDF file is empty.', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
                return;
            }

            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `seo_report_${domainFilter || 'all'}_${keywordFilter || 'all'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error('Error downloading PDF:', err);
            showToast.error('Network error while generating the PDF report.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
        }
    };

    const getTrendColor = (change: string) => {
        if (change.includes('▲')) return 'green';
        if (change.includes('▼')) return 'red';
        return 'gray';
    };

    if (loading) {
        return <div className={styles.card}>Loading statistics...</div>;
    }

    return (
        <div className={styles.card}>
            <h2>General Statistics</h2>
            <div className={styles.statsContainer} id="generalStatsContainer">
                <div className={styles.statBox}>
                    <div className={styles.statValue} id="totalDomains">{stats?.totalDomains || '-'}</div>
                    <div className={styles.statLabel}>Unique Domains</div>
                </div>
                <div className={styles.statBox}>
                    <div className={styles.statValue} id="totalKeywords">{stats?.totalKeywords || '-'}</div>
                    <div className={styles.statLabel}>Unique Keywords</div>
                </div>
                <div className={styles.statBox}>
                    <div className={styles.statValue} id="improvedPositions">{stats?.improved24h || '-'}</div>
                    <div className={styles.statLabel}>Improved Positions (24h)</div>
                </div>
                <div className={styles.statBox}>
                    <div className={styles.statValue} id="worsenedPositions">{stats?.worsened24h || '-'}</div>
                    <div className={styles.statLabel}>Worsened Positions (24h)</div>
                </div>
            </div>

            <div className={styles.card}>
                <h2>Detailed Filters</h2>
                <div className={styles.formGroup}>
                    <label htmlFor="statsDomainFilter">Filter by Domain:</label>
                    <select
                        id="statsDomainFilter"
                        className={styles.select}
                        value={domainFilter}
                        onChange={(e) => setDomainFilter(e.target.value)}
                    >
                        <option value="">All domains</option>
                        {availableDomains.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="statsKeywordFilter">Filter by Keyword:</label>
                    <select
                        id="statsKeywordFilter"
                        className={styles.select}
                        value={keywordFilter}
                        onChange={(e) => setKeywordFilter(e.target.value)}
                    >
                        <option value="">All keywords</option>
                        {availableKeywords.map(k => (
                            <option key={k} value={k}>{k}</option>
                        ))}
                    </select>
                </div>
                <button className={styles.button} onClick={handleFilterChange}>
                    Load Statistics
                </button>
                <button
                    type="button"
                    className={styles.downloadButton}
                    id="downloadStatsExcelButton"
                    style={{ display: detailedStats.length > 0 ? 'inline-block' : 'none' }}
                    onClick={handleExportExcel}
                >
                    Download Report (Excel)
                </button>
                <button
                    type="button"
                    className={styles.downloadPdfButton}
                    id="downloadStatsPdfButton"
                    style={{ display: detailedStats.length > 0 ? 'inline-block' : 'none' }}
                    onClick={handleExportPdf}
                >
                    Download Report (PDF)
                </button>
                <div id="statsMessage" style={{ marginTop: '15px', color: '#dc3545' }}></div>
            </div>

            <div className={styles.card}>
                <h2>Devices for PDF Report:</h2>
                <div className={styles.deviceCheckboxGroup}>
                    <label>
                        <input
                            type="checkbox"
                            checked={selectedDevices.desktop}
                            onChange={() => handleDeviceChange('desktop')}
                        /> Desktop
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={selectedDevices.mobile}
                            onChange={() => handleDeviceChange('mobile')}
                        /> Mobile
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={selectedDevices.google_local}
                            onChange={() => handleDeviceChange('google_local')}
                        /> Google Local
                    </label>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table id="statsTable" style={{ display: detailedStats.length > 0 ? 'table' : 'none' }}>
                    <thead>
                        <tr>
                            <th>Keyword</th>
                            <th>Domain</th>
                            <th>Current Position</th>
                            <th>24h</th>
                            <th>7d</th>
                            <th>30d</th>
                            <th>Search Engine</th>
                            <th>Device</th>
                            <th>Location</th>
                        </tr>
                    </thead>
                    <tbody id="statsTableBody">
                        {detailedStats.map((row, index) => (
                            <tr key={index}>
                                <td>{row.keyword}</td>
                                <td>{row.domain}</td>
                                <td>{row.position}</td>
                                <td style={{ color: getTrendColor(row.change24h) }}>{row.change24h}</td>
                                <td style={{ color: getTrendColor(row.change7d) }}>{row.change7d}</td>
                                <td style={{ color: getTrendColor(row.change30d) }}>{row.change30d}</td>
                                <td>{row.searchEngine}</td>
                                <td>{row.device}</td>
                                <td>{row.location}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {stats?.topDomains && stats.topDomains.length > 0 && (
                <div className={styles.card}>
                    <h2>Top 3 Domains by Recent Improvement</h2>
                    <div className={styles.statsContainer} id="topDomainsContainer">
                        {stats.topDomains.slice(0, 3).map((d: any) => (
                            <div key={d.dominio} className={styles.statBox}>
                                <div className={styles.statValue}>{d.dominio}</div>
                                <div className={styles.statLabel}>Improvement: {d.mejoraAbsoluta > 0 ? '+' : ''}{d.mejoraAbsoluta} pos.</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}