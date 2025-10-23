'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from 'nextjs-toast-notify';

export default function SearchForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        keywords: '',
        domain: '',
        location: '',
        searchEngine: 'google',
        devices: ['desktop'] as ('desktop' | 'mobile' | 'google_local')[],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'devices') {
            const currentDevices = formData.devices;
            const device = value as 'desktop' | 'mobile' | 'google_local';
            if (currentDevices.includes(device)) {
                setFormData({
                    ...formData,
                    devices: currentDevices.filter(d => d !== device),
                });
            } else {
                setFormData({
                    ...formData,
                    devices: [...currentDevices, device],
                });
            }
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/historial-busquedas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keywords: formData.keywords,
                    domain: formData.domain,
                    location: formData.location,
                    searchEngine: formData.searchEngine,
                    device: formData.devices,
                }),
            });
            const data = await res.json();

            if (data.success) {
                console.log('1.- API Response:', data);
                showToast.success(`${data.message} You can go to the 'Domains' or 'Statistics' tab to view results.`, {
                    duration: 5000,
                    position: 'bottom-center',
                    transition: 'topBounce',
                    progress: true,
                    sound: true,
                });
            } else if (data.redirectTo) {
                console.log('2.- API Response:', data);
                showToast.warning(data.message, {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    progress: true,
                    sound: true,
                });
                setTimeout(() => {
                    router.push(data.redirectTo);
                }, 4000);
            } else {
                console.log('3.- API Response:', data);
                showToast.error(data.message, {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            }
        } catch (error) {
            console.error('Error submitting search:', error);
            showToast.error('Connection error with the server.', {
                duration: 4000,
                position: 'top-right',
                transition: 'topBounce',
                sound: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '1.5rem', border: '1px solid #e5e7eb' }}>
            <h2 style={{ color: '#6c4ab6', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Run Search</h2>
            <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    🌎 Discover the keywords that boost your domain in every location.
                    Analyze where you shine the brightest (and where you need a little extra focus) with real positioning data. Local SEO has never been this clear… or this fun.
                </label>
            </div>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                        Keywords (one per line or comma-separated):
                    </label>
                    <textarea
                        rows={5}
                        placeholder="E.g.: marketing agency, best SEO software"
                        value={formData.keywords}
                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                    />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Domain:</label>
                    <input
                        type="text"
                        placeholder="E.g.: mywebsite.com"
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                    />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Location:</label>
                    <input
                        type="text"
                        placeholder="E.g.: New York"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                    />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Search Engine:</label>
                    <select
                        value={formData.searchEngine}
                        onChange={(e) => setFormData({ ...formData, searchEngine: e.target.value })}
                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem' }}
                    >
                        <option value="google">Google</option>
                    </select>
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Devices:</label><br />
                    <label style={{ marginRight: '15px', cursor: 'pointer', fontWeight: '500', color: '#374151' }}>
                        <input
                            type="checkbox"
                            name="devices"
                            value="desktop"
                            checked={formData.devices.includes('desktop')}
                            onChange={handleInputChange}
                            style={{ marginRight: '8px', transform: 'scale(1.3)', accentColor: '#6c4ab6' }}
                        /> Desktop
                    </label>
                    <label style={{ marginRight: '15px', cursor: 'pointer', fontWeight: '500', color: '#374151' }}>
                        <input
                            type="checkbox"
                            name="devices"
                            value="mobile"
                            checked={formData.devices.includes('mobile')}
                            onChange={handleInputChange}
                            style={{ marginRight: '8px', transform: 'scale(1.3)', accentColor: '#6c4ab6' }}
                        /> Mobile
                    </label>
                    <label style={{ cursor: 'pointer', fontWeight: '500', color: '#374151' }}>
                        <input
                            type="checkbox"
                            name="devices"
                            value="google_local"
                            checked={formData.devices.includes('google_local')}
                            onChange={handleInputChange}
                            style={{ marginRight: '8px', transform: 'scale(1.3)', accentColor: '#6c4ab6' }}
                        /> Google Local
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                        padding: '10px 18px',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        background: isSubmitting ? '#94a3b8' : 'linear-gradient(to right, #d64a6c, #c53a5d)',
                        color: '#fff',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        marginRight: '8px'
                    }}
                >
                    {isSubmitting ? 'Searching...' : 'Add'}
                </button>
            </form>
        </div>
    );
}