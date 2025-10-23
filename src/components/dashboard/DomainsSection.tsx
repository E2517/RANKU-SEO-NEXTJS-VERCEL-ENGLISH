'use client';
import { useState, useEffect } from 'react';
import { showToast } from 'nextjs-toast-notify';

export default function DomainsSection() {
    const [domain, setDomain] = useState('');
    const [keywordFilter, setKeywordFilter] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [domainOptions, setDomainOptions] = useState<string[]>([]);

    useEffect(() => {
        const fetchDomains = async () => {
            console.log('Iniciando fetch de dominios desde cliente');
            try {
                const res = await fetch('/api/historial-options-domains');
                console.log('Respuesta de /api/historial-options-domains:', res.status, res.ok);
                const data = await res.json();
                console.log('Datos recibidos de la API de dominios:', data);
                if (data.success) {
                    setDomainOptions(data.domains);
                    console.log('Opciones de dominio establecidas:', data.domains);
                } else {
                    console.warn('API devolvió éxito: false al cargar dominios:', data.message);
                }
            } catch (error) {
                console.error('Error al cargar dominios:', error);
            }
        };
        fetchDomains();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Formulario enviado. Dominio:', domain, 'Keyword:', keywordFilter);
        setResults([]);
        setIsSubmitting(true);
        try {
            const url = `/api/dominios?dominio=${encodeURIComponent(domain)}${keywordFilter ? `&keywordFilter=${encodeURIComponent(keywordFilter)}` : ''}`;
            console.log('Realizando fetch a:', url);
            const res = await fetch(url);
            console.log('Respuesta de historial-busquedas:', res.status, res.ok);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            console.log('Datos recibidos de historial-busquedas:', data);
            if (data.success) {
                setResults(data.historial || []);
                showToast.success('Results loaded.', {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
                console.log('Resultados establecidos:', data.historial?.length || 0, 'registros');
            } else {
                showToast.error(data.message, {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
                console.warn('API devolvió éxito: false en historial-busquedas:', data.message);
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
            showToast.error('Connection error with the server.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
        } finally {
            setIsSubmitting(false);
            console.log('Finalizada solicitud de historial');
        }
    };

    const renderTrend = (trend: any) => {
        if (!trend || trend.diferencia === null) {
            return '—';
        }
        const { diferencia, simbolo, color } = trend;
        return (
            <span style={{ color, fontWeight: 'bold' }}>
                {diferencia > 0 ? '+' : ''}{diferencia} {simbolo}
            </span>
        );
    };

    return (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
            <h2 style={{ color: '#6c4ab6', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Domains by Keyword</h2>
            <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    📊 Check the performance of your Domains and Keywords.
                </label>
            </div>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Select Domain:</label>
                    <select
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                        required
                    >
                        <option value="">Select a domain</option>
                        {domainOptions.map((d, i) => (
                            <option key={i} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Filter by Keyword (optional):</label>
                    <input
                        type="text"
                        placeholder="E.g.: criminal lawyer"
                        value={keywordFilter}
                        onChange={(e) => setKeywordFilter(e.target.value)}
                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting || !domain}
                    style={{
                        padding: '10px 18px',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: isSubmitting || !domain ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        background: isSubmitting || !domain ? '#94a3b8' : 'linear-gradient(to right, #d64a6c, #c53a5d)',
                        color: '#fff',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        marginRight: '8px'
                    }}
                >
                    {isSubmitting ? 'Loading...' : 'Load'}
                </button>
            </form>
            {results.length > 0 && (
                <div style={{ marginTop: '1.5rem', overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid #e5e7eb', padding: '12px', textAlign: 'left', background: '#f9fafb', fontWeight: '700', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase' }}>Keyword</th>
                                <th style={{ border: '1px solid #e5e7eb', padding: '12px', textAlign: 'left', background: '#f9fafb', fontWeight: '700', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase' }}>Domain</th>
                                <th style={{ border: '1px solid #e5e7eb', padding: '12px', textAlign: 'left', background: '#f9fafb', fontWeight: '700', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase' }}>Position</th>
                                <th style={{ border: '1px solid #e5e7eb', padding: '12px', textAlign: 'left', background: '#f9fafb', fontWeight: '700', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase' }}>24h</th>
                                <th style={{ border: '1px solid #e5e7eb', padding: '12px', textAlign: 'left', background: '#f9fafb', fontWeight: '700', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase' }}>7 days</th>
                                <th style={{ border: '1px solid #e5e7eb', padding: '12px', textAlign: 'left', background: '#f9fafb', fontWeight: '700', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase' }}>Search Engine</th>
                                <th style={{ border: '1px solid #e5e7eb', padding: '12px', textAlign: 'left', background: '#f9fafb', fontWeight: '700', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase' }}>Device</th>
                                <th style={{ border: '1px solid #e5e7eb', padding: '12px', textAlign: 'left', background: '#f9fafb', fontWeight: '700', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase' }}>Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                                    <td style={{ border: '1px solid #e5e7eb', padding: '12px' }}>{r.palabraClave || 'N/A'}</td>
                                    <td style={{ border: '1px solid #e5e7eb', padding: '12px' }}>{r.dominio || 'N/A'}</td>
                                    <td style={{ border: '1px solid #e5e7eb', padding: '12px' }}>{r.posicion || '—'}</td>
                                    <td style={{ border: '1px solid #e5e7eb', padding: '12px' }}>
                                        {renderTrend(r.tendencia24h)}
                                    </td>
                                    <td style={{ border: '1px solid #e5e7eb', padding: '12px' }}>
                                        {renderTrend(r.tendencia7d)}
                                    </td>
                                    <td style={{ border: '1px solid #e5e7eb', padding: '12px' }}>{r.buscador || 'N/A'}</td>
                                    <td style={{ border: '1px solid #e5e7eb', padding: '12px' }}>
                                        {r.dispositivo === 'google_local' ? (
                                            <div>
                                                Google Local
                                                {r.rating !== null && r.rating !== undefined && (
                                                    <div style={{ marginTop: '4px' }}>
                                                        ⭐ {r.rating} ({r.reviews || 'N/A'})
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            r.dispositivo
                                        )}
                                    </td>
                                    <td style={{ border: '1px solid #e5e7eb', padding: '12px' }}>{r.location || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}