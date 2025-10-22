'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ScanMapSection.module.css';
import 'leaflet/dist/leaflet.css';
import { showToast } from 'nextjs-toast-notify';

export default function ScanMapSection() {
    const [keyword, setKeyword] = useState('');
    const [domain, setDomain] = useState('');
    const [address, setAddress] = useState('');
    const [radius, setRadius] = useState('1000');
    const [step, setStep] = useState('500');
    const [isProcessing, setIsProcessing] = useState(false);
    const [campaignId, setCampaignId] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isProcessing) return;
        if (!keyword.trim() || !domain.trim() || !address.trim()) {
            showToast.error('Please fill in all fields.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
            return;
        }
        setIsProcessing(true);
        try {
            const res = await fetch('/api/scanmap/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword: keyword.trim(),
                    domain: domain.trim(),
                    address: address.trim(),
                    maxRadiusMeters: parseInt(radius),
                    stepMeters: parseInt(step)
                })
            });
            const data = await res.json();
            if (!data.success) {
                showToast.error(data.message || 'Error starting simulation.', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
                return;
            }
            setCampaignId(data.campaignId);
            setShowResults(true);
        } catch (err) {
            console.error(err);
            showToast.error('Connection error.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (!campaignId) return;
        let initialRenderDone = false;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/scanmap/${campaignId}`);
                const data = await res.json();
                if (!data.success) return;

                const infoEl = document.getElementById('scanmapCampaignInfo');
                if (infoEl) {
                    infoEl.innerHTML = `
                        <strong>Search ${data.campaign.status === 'completed' ? 'completed' : 'in progress'}:</strong> "${data.campaign.keyword}" in "${data.campaign.centerLocation.name}"<br>
                        <strong>Domain:</strong> ${data.campaign.domain}<br>
                        <strong>Radius:</strong> ${data.campaign.maxRadiusMeters} meters | <strong>Step:</strong> ${data.campaign.stepMeters} meters
                    `;
                }

                if (!initialRenderDone && data.campaign) {
                    renderMap(data.campaign, []);
                    initialRenderDone = true;
                }

                if (data.results.length > 0) {
                    renderMap(data.campaign, data.results);
                    renderTable(data.results);
                }

                if (data.campaign.status === 'completed') {
                    clearInterval(interval);
                }
            } catch (error) {
                console.error('Error polling ScanMap:', error);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [campaignId]);

    const renderMap = async (campaign: any, results: any[]) => {
        if (!mapRef.current || !showResults) return;

        if (!leafletMap.current) {
            const L = (await import('leaflet')).default;
            leafletMap.current = L.map(mapRef.current).setView(
                [campaign.centerLocation.lat, campaign.centerLocation.lng],
                13
            );
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(leafletMap.current);

            const centerIcon = L.divIcon({
                className: 'scanmap-center-marker',
                html: '<div style="background:#e74c3c;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;line-height:1;">📍</div>',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const centerMarker = L.marker([campaign.centerLocation.lat, campaign.centerLocation.lng], {
                icon: centerIcon,
                title: 'Central Location'
            }).addTo(leafletMap.current);

            centerMarker.bindPopup(`
                <div style="font-family:sans-serif;padding:8px;max-width:250px;">
                    <strong>📍 Central Location</strong><br>
                    <span style="font-size:0.9em;color:#555;">${campaign.centerLocation.name}</span><br>
                    <strong>🌐 Business:</strong> ${campaign.domain}
                </div>
            `);
        }

        const L = (await import('leaflet')).default;
        leafletMap.current.eachLayer((layer: any) => {
            if (layer instanceof L.Marker) {
                const popup = layer.getPopup();
                if (popup) {
                    const content = popup.getContent();
                    let contentStr = '';
                    if (typeof content === 'string') {
                        contentStr = content;
                    } else if (content instanceof HTMLElement) {
                        contentStr = content.innerText || content.innerHTML || '';
                    }
                    if (!contentStr.includes('Central Location')) {
                        leafletMap.current.removeLayer(layer);
                    }
                } else {
                    leafletMap.current.removeLayer(layer);
                }
            }
        });

        results.forEach((result: any) => {
            const rankingText = result.ranking > 0 ? result.ranking : '?';
            const iconDiv = L.divIcon({
                className: styles.scanmapMarker,
                html: `<div class="${styles.scanmapMarkerInner} ${result.ranking > 0 ? styles.scanmapMarkerGreen : styles.scanmapMarkerRed}">${rankingText}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            const marker = L.marker([result.searchLocation.lat, result.searchLocation.lng], { icon: iconDiv })
                .addTo(leafletMap.current);
            const label = result.placeName ? `Found: ${result.placeName}` : 'Not found';
            const rankingInfo = result.ranking > 0 ? `<b>Ranking:</b> ${result.ranking}` : 'Not found';
            marker.bindPopup(`
                <b>Search point</b><br>
                ${label}<br>
                Distance: ${Math.round(result.distanceFromCenter)} m<br>
                ${rankingInfo}
            `);
        });

        setTimeout(() => {
            if (leafletMap.current) leafletMap.current.invalidateSize();
        }, 0);
    };

    const renderTable = (results: any[]) => {
        const tableContainer = document.querySelector(`.${styles.rankingTable}`) as HTMLElement;
        if (!tableContainer) return;
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Step (m)</th>
                        <th>Lat</th>
                        <th>Lng</th>
                        <th>Ranking</th>
                        <th>Business</th>
                    </tr>
                </thead>
                <tbody>`;
        results.forEach(result => {
            tableHTML += `
                <tr>
                    <td>${result.radius}</td>
                    <td>${result.searchLocation.lat.toFixed(5)}</td>
                    <td>${result.searchLocation.lng.toFixed(5)}</td>
                    <td>${result.ranking > 0 ? result.ranking : '-'}</td>
                    <td>${result.placeName || '-'}</td>
                </tr>`;
        });
        tableHTML += '</tbody></table>';
        tableContainer.innerHTML = tableHTML;
        tableContainer.style.display = 'block';
    };

    return (
        <div className={styles.card}>
            <h2>ScanMap – Local Visibility</h2>
            <div className={styles.formGroup}>
                <label>🥷 A domain’s visibility in search engines varies by location...</label>
            </div>
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label>Keyword:</label>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="car repair"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Domain:</label>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="myrepairshop.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Business Address:</label>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Calle Traperia, 40, Murcia, 30001"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Max Radius (meters):</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={radius}
                        min="0"
                        max="5000"
                        step="500"
                        onChange={(e) => setRadius(e.target.value)}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Step (meters):</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={step}
                        min="0"
                        max="5000"
                        step="500"
                        onChange={(e) => setStep(e.target.value)}
                    />
                </div>
                <button className={styles.button} type="submit" disabled={isProcessing}>
                    {isProcessing ? 'Starting...' : 'Start Simulation'}
                </button>
            </form>
            {showResults && (
                <div id="scanmapResultsContainer">
                    <div className={styles.usageInfo} id="scanmapCampaignInfo"></div>
                    <div id="scanmapContainer" style={{ height: '500px' }}>
                        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
                    </div>
                    <div className={styles.rankingTable}></div>
                </div>
            )}
        </div>
    );
}