'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/layout/Footer';
import SearchForm from '@/components/dashboard/SearchForm';
import DomainsSection from '@/components/dashboard/DomainsSection';
import RankMapSection from '@/components/dashboard/RankMapSection';
import ScanMapSection from '@/components/dashboard/ScanMapSection';
import AISearchForm from '@/components/dashboard/AISearchForm';
import KeywordCounter from '@/components/dashboard/KeywordCounter';
import StatsSection from '@/components/dashboard/StatsSection';
import ProfileSection from '@/components/dashboard/ProfileSection';
import AdminPanel from '@/components/dashboard/AdminPanel';
import Contact from '@/components/dashboard/Contact';
import './dashboard.css';

function DashboardContent() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('search-section');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
        else setActiveTab('search-section');
    }, [searchParams]);

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
                    setIsAdmin(data.user.role === 'admin');
                    setUsername(data.user.username);
                }
            } catch { }
        };
        fetchUser();
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const renderContent = () => {
        switch (activeTab) {
            case 'search-section':
                return <SearchForm />;
            case 'domains-section':
                return <DomainsSection />;
            case 'rankmap-section':
                return <RankMapSection />;
            case 'scanmap-section':
                return <ScanMapSection />;
            case 'ai-intelligence-section':
                return <AISearchForm />;
            case 'keywords-history-section':
                return <KeywordCounter />;
            case 'stats-section':
                return <StatsSection />;
            case 'profile-section':
                return <ProfileSection />;
            case 'contact-section':
                return <Contact />;
            case 'admin-panel':
                return isAdmin ? <AdminPanel /> : <div>You don’t have permission to view this section.</div>;
            default:
                return <SearchForm />;
        }
    };

    return (
        <div className="app-container">
            <header className="top-bar">
                <button className="mobile-menu-toggle" onClick={toggleSidebar}>
                    <i className="fas fa-bars"></i>
                </button>
                <Link href="/dashboard" className="logo">
                    RANKU
                    <Image
                        src="/assets/ninja.png"
                        alt="Ninja Ranku.es"
                        className="logo-icon"
                        width={35}
                        height={24}
                        style={{ height: 'auto' }}
                    />
                </Link>

                <div className="auth-buttons-mobile">
                    <button
                        type="button"
                        className="logout-button"
                        onClick={async () => {
                            try {
                                await fetch('/api/auth/logout', { method: 'POST' });
                                window.location.href = '/';
                            } catch {
                                console.error('Error logging out');
                            }
                        }}
                    >
                        Log Out
                    </button>
                    <button
                        type="button"
                        className="logout-icon"
                        onClick={async () => {
                            try {
                                await fetch('/api/auth/logout', { method: 'POST' });
                                window.location.href = '/';
                            } catch {
                                console.error('Error logging out');
                            }
                        }}
                    ></button>
                </div>
            </header>

            <div className="main-layout">
                <aside className={`sidebar ${isSidebarOpen ? 'active' : ''}`} id="sidebar">
                    <div className="sidebar-header">
                        <div className="user-profile">
                            <div className="avatar">{username.charAt(0)}</div>
                            <span className="username-text">{username}</span>
                        </div>
                    </div>
                    <nav className="sidebar-nav">
                        <ul>
                            <li>
                                <button
                                    className={`sidebar-link ${activeTab === 'search-section' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('search-section');
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <i className="fas fa-search"></i> SEO Search
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`sidebar-link ${activeTab === 'domains-section' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('domains-section');
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <i className="fas fa-globe"></i> Domains
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`sidebar-link ${activeTab === 'rankmap-section' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('rankmap-section');
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <i className="fas fa-map-marker-alt"></i> RankMap
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`sidebar-link ${activeTab === 'scanmap-section' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('scanmap-section');
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <i className="fas fa-map-marked-alt"></i> ScanMap
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`sidebar-link ${activeTab === 'ai-intelligence-section' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('ai-intelligence-section');
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <i className="fas fa-brain"></i> AI Intelligence
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`sidebar-link ${activeTab === 'keywords-history-section' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('keywords-history-section');
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <i className="fas fa-keyboard"></i> Keyword Counter
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`sidebar-link ${activeTab === 'stats-section' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('stats-section');
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <i className="fas fa-chart-line"></i> Statistics
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`sidebar-link ${activeTab === 'profile-section' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab('profile-section');
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <i className="fas fa-user"></i> Profile & Subscription
                                </button>
                            </li>
                            <li>
                                <button
                                    className="sidebar-link"
                                    onClick={() => {
                                        setActiveTab('contact-section');
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <i className="fas fa-envelope"></i> Contact
                                </button>
                            </li>
                            {isAdmin && (
                                <li>
                                    <button
                                        className="sidebar-link"
                                        onClick={() => {
                                            setActiveTab('admin-panel');
                                            setIsSidebarOpen(false);
                                        }}
                                    >
                                        <i className="fas fa-cog"></i> Admin Panel
                                    </button>
                                </li>
                            )}
                        </ul>
                    </nav>
                </aside>

                <main className="main-content">
                    <div className="container">{renderContent()}</div>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardContent />
        </Suspense>
    );
}