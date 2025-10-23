'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from 'nextjs-toast-notify';
import styles from './AISearchForm.module.css';

export default function AISearchForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        keywords: '',
        business: '',
        domain: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        setResults(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.keywords.trim()) {
            showToast.error('The query is required.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
            return;
        }
        if (!formData.business.trim()) {
            showToast.error('Business name is required.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
            return;
        }
        if (!formData.domain.trim()) {
            showToast.error('Domain is required.', {
                duration: 4000,
                position: 'top-center',
                transition: 'topBounce',
                sound: true,
            });
            return;
        }

        setIsSubmitting(true);
        setResults(null);

        try {
            const res = await fetch('/api/ai-intelligence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keywords: formData.keywords.trim(),
                    business: formData.business.trim(),
                    domain: formData.domain.trim(),
                }),
            });
            const data = await res.json();

            if (data.success) {
                setResults(data.results);
                showToast.success(data.message, {
                    duration: 5000,
                    position: 'bottom-center',
                    transition: 'topBounce',
                    progress: true,
                    sound: true,
                });
            } else if (data.redirectTo) {
                showToast.warning(data.message, {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    progress: true,
                    sound: true,
                });
                setTimeout(() => router.push(data.redirectTo), 4000);
            } else {
                showToast.error(data.message, {
                    duration: 4000,
                    position: 'top-center',
                    transition: 'topBounce',
                    sound: true,
                });
            }
        } catch (error) {
            console.error('Error submitting AI search:', error);
            showToast.error('Server connection error.', {
                duration: 4000,
                position: 'top-right',
                transition: 'topBounce',
                sound: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const highlightBusiness = (text: string, business: string): string => {
        if (!business) return text;
        const escapedBusiness = business.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedBusiness})`, 'gi');
        return text.replace(regex, '<span class="' + styles.highlight + '">$1</span>');
    };

    const renderHighlightedBlocks = (blocks: any[], business: string) => {
        return blocks.map((block, i) => {
            if (block.type === 'paragraph') {
                const highlighted = highlightBusiness(block.snippet || '', business);
                return <p key={i} dangerouslySetInnerHTML={{ __html: highlighted }} />;
            } else if (block.type === 'list') {
                return (
                    <ul key={i} className={styles.nestedList}>
                        {block.list?.map((item: any, j: number) => {
                            const itemHighlighted = highlightBusiness(item.snippet || '', business);
                            return (
                                <li key={j}>
                                    <span dangerouslySetInnerHTML={{ __html: itemHighlighted }} />
                                    {item.list && renderHighlightedBlocks(item.list, business)}
                                </li>
                            );
                        })}
                    </ul>
                );
            }
            return null;
        });
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.sectionTitle}>AI-Powered Search</h2>
            <div className={styles.formGroup}>
                <label>
                    🤖 Enter a natural-language query. Provide the business name and domain to see if they appear in the AI’s response.
                </label>
            </div>
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label>AI Query (keywords):</label>
                    <textarea
                        rows={4}
                        placeholder="E.g., Top 5 web design companies in Murcia"
                        name="keywords"
                        value={formData.keywords}
                        onChange={handleInputChange}
                        className={styles.input}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Business Name (required):</label>
                    <input
                        type="text"
                        placeholder="E.g., Your Business"
                        name="business"
                        value={formData.business}
                        onChange={handleInputChange}
                        className={styles.input}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Domain (required):</label>
                    <input
                        type="text"
                        placeholder="E.g., website.com"
                        name="domain"
                        value={formData.domain}
                        onChange={handleInputChange}
                        className={styles.input}
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.button}
                >
                    {isSubmitting ? 'Analyzing with AI...' : 'Search with AI'}
                </button>
            </form>

            {results && (
                <div className={styles.results}>
                    <h3 className={styles.resultsTitle}>AI Results</h3>
                    <div className={styles.positionBox}>
                        <div><strong>Business:</strong> {results.business}</div>
                        <div><strong>Domain:</strong> {results.domain}</div>
                        {results.businessPosition !== null && (
                            <div><strong>Found:</strong> ✓</div>
                        )}
                        {results.domainPosition !== null && (
                            <div><strong>Domain Position:</strong> #{results.domainPosition}</div>
                        )}
                        {results.businessPosition === null && results.domainPosition === null && (
                            <div><strong>Found:</strong> ✗</div>
                        )}
                    </div>

                    <div className={styles.fullResponse}>
                        <strong>Full AI Response:</strong>
                        <div className={styles.aiContent}>
                            {renderHighlightedBlocks(results.rawTextBlocks, results.business)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}