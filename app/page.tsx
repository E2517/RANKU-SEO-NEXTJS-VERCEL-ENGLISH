'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TopBar from '@/components/layout/TopBar';
import Footer from '@/components/layout/Footer';

export default function Home() {
  const [trialInfo, setTrialInfo] = useState<{ show: boolean; days: number }>({ show: false, days: 0 });

  useEffect(() => {
    const fetchTrialStatus = async () => {
      try {
        const res = await fetch('/api/trial-status');
        if (res.ok) {
          const data = await res.json();
          setTrialInfo({
            show: data.show === true,
            days: typeof data.days === 'number' ? data.days : 0,
          });
        }
      } catch (err) {
        console.log(err)
      }
    };

    fetchTrialStatus();
  }, []);

  return (
    <>
      <TopBar />
      <div className="container">
        <header className="header">
          <h1>The Future of SEO and Keyword Research</h1>
          <p>
            A cutting-edge tool to analyze and visualize organic search results, helping you
            master SEO and outperform your competition.
          </p>
        </header>

        <div className="contenedor">
          <Image
            src="/assets/mapa.webp"
            alt="Dashboard"
            width={1200}
            height={600}
            className="imagen-responsive"
          />
        </div>

        <section className="how-it-works-section">
          <h2>
            How does <strong>Ranku</strong> work?
          </h2>
          <p>
            Forget tracking only URLs like in the Stone Age of SEO. At Ranku, we think about <strong>real businesses</strong>, not loose links.
          </p>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>🧠 Business ≠ URL</h3>
              <p>
                We track your <strong>Google Business profile</strong> + all your <strong>website URLs</strong> as a single intelligent entity.
              </p>
              <div className="example">
                Your business “Café Luna” has a website, an online menu, and a Google listing. Ranku unifies them into one SEO profile.
              </div>
            </div>
            <div className="benefit-card">
              <h3>📱 3 Universes, 1 Business</h3>
              <p>
                We measure your ranking separately on <strong>Desktop</strong>, <strong>Mobile</strong>, and <strong>Google Maps</strong>. Because yes, Google sees you differently in each.
              </p>
              <div className="example">
                You rank in the top 3 on mobile, but on desktop you’re on page 2. Without Ranku, you’d never know!
              </div>
            </div>
            <div className="benefit-card">
              <h3>🗺️ RankMap: Geolocated SEO</h3>
              <p>
                Do you know where your listing appears in the <em>Map Pack</em> when searched from your competitor’s neighborhood? With <strong>RankMap</strong>, you do. Geolocated searches with surgical precision.
              </p>
              <div className="example">
                “plumber in New York Centro” → Are you in the top 3 on the map… or lost in oblivion?
              </div>
            </div>
            <div className="benefit-card">
              <h3>📊 Data That Speaks</h3>
              <p>
                We don’t just tell you <em>where you are</em>, but <em>how you’re moving</em> against your competition in real time. SEO with brains, not luck.
              </p>
              <div className="example">
                Your competitor jumped 5 positions for “car insurance in Barcelona.” Ranku shows you the result before you lose traffic. You notice a law firm in Bilbao gaining visibility for “labor lawyer Bilbao.” You weren’t optimizing for that keyword. Ranku flags it before you lose ground to competitors.
              </div>
            </div>
            <div className="benefit-card">
              <h3>🕵️‍♂️ Competitors Under the Microscope</h3>
              <p>
                We analyze not only your performance but also that of direct competitors. Because winning at SEO is relative… and you want to win!
              </p>
              <div className="example">
                You see that “Panadería Sol” uses a keyword you’d overlooked: “gluten-free bread near me.” Now you can act. You discover “Café Aroma” ranks highly for “healthy breakfast downtown.” You hadn’t considered that keyword. Now you can include it in your content, ads, or local SEO.
              </div>
            </div>
            <div className="benefit-card">
              <h3>⚡ Downloadable Excel or PDF Reports</h3>
              <p>
                Did your listing disappear from the Map Pack? Did your website drop 10 positions? Download Excel reports with results or PDFs to hand directly to your client.
              </p>
              <div className="example">
                Google updates its algorithm on a Friday night and your ranking drops. Ranku lets you download Excel reports for analysis in Looker Studio or PDFs so you don’t have to write summaries for your client.
              </div>
            </div>
          </div>
        </section>

        <section className="scanmap-hero-section">
          <div className="container">
            <div className="scanmap-content">
              <h2>
                🥷 <strong>ScanMap</strong>: The Revolution in Geolocated Local SEO
              </h2>
              <p>
                Do you know how Google sees you <em>from your competitor’s neighborhood</em>? With <strong>ScanMap</strong>, you uncover the true visibility of any domain based on the user’s exact location. It’s not magic… it’s <strong>geographic intelligence applied to SEO</strong>.
              </p>
              <div className="scanmap-preview">
                <Image
                  src="/assets/scanmap.webp"
                  alt="ScanMap - Geolocated SEO visualization"
                  width={900}
                  height={500}
                  className="imagen-responsive"
                />
              </div>
              <p>
                Simulate searches from any point in the city, define action radii and precision zones, and watch in real time how your presence on Google Maps changes. <strong>Because local SEO is no longer “more or less nearby”… it’s “exactly here.”</strong>
              </p>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <h2>🧠 Smart Statistics: Your GPS in Google’s Chaos</h2>
          <p>
            At RANKU, we don’t just collect data—we <strong>turn it into decisions</strong>. Our statistics cut through the noise and deliver only what matters: <strong>unique keywords by context</strong>, without fake duplicates that distract you.
          </p>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>🔍 One Keyword, One Context</h3>
              <p>
                Each combination of keyword + location + device + search engine is counted only once. This prevents the illusion of “thousands of keywords” when they’re just empty repetitions.
              </p>
            </div>
            <div className="stat-card">
              <h3>📈 Real Trends, Not Noise</h3>
              <p>
                We compare your latest position with the previous one to show whether you’re improving or declining. No outdated data or misleading averages.
              </p>
            </div>
            <div className="stat-card">
              <h3>🏆 Top Domains with Purpose</h3>
              <p>
                We identify which domains show the greatest absolute improvement across their keywords. That way, you know who’s gaining ground—and who’s falling behind.
              </p>
            </div>
            <div className="stat-card">
              <h3>📥 Clean Excel, Immediate Action</h3>
              <p>
                When you export, you get only unique rows. Each line is a real opportunity. Perfect for client presentations or feeding your own dashboards.
              </p>
            </div>
            <div className="stat-card">
              <h3>⚡ SEO with Smart Memory</h3>
              <p>
                RANKU never forgets: it automatically compares your current position with the previous one to show if you’re gaining or losing ground. You focus on acting—not calculating.
              </p>
            </div>
            <div className="stat-card">
              <h3>🎯 PDF, Ready for Your Client</h3>
              <p>
                Download a professional SEO report in PDF format to deliver to your client with all key visibility insights.
              </p>
            </div>
          </div>
        </section>

        <section className="pricing-section">
          <h2>Our Subscription Plans</h2>
          <p>
            <strong>Monthly</strong> subscription, no fine print.
            <br />
            <strong>Join anytime, cancel anytime.</strong> No lock-in. No drama. Just pure SEO.
          </p>
          <div className="pricing-cards">
            <div className="card">
              <div className="card-header">
                <h3>Basic</h3>
                <div className="card-price">
                  <span className="currency">$</span>50<span className="period">/month</span>
                </div>
              </div>
              <ul className="card-features">
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
              <Link href="/auth" className="login-button">
                Subscribe
              </Link>
            </div>
            <div className="card">
              <div className="card-header">
                <h3>Pro</h3>
                <div className="card-price">
                  <span className="currency">$</span>100<span className="period">/month</span>
                </div>
              </div>
              <ul className="card-features">
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
              <Link href="/auth" className="login-button">
                Subscribe
              </Link>
            </div>
            <div className="card">
              <div className="card-header">
                <h3>Ultra</h3>
                <div className="card-price">
                  <span className="currency">$</span>250<span className="period">/month</span>
                </div>
              </div>
              <ul className="card-features">
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
              <Link href="/auth" className="login-button">
                Subscribe
              </Link>
            </div>
          </div>
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
        </section>

        <section className="seo-importance-section">
          <h2>Why is SEO <strong>Critical</strong>?</h2>
          <p className="subtitle">Mastering SEO isn’t optional—it’s the growth engine of the digital age.</p>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>Maximum Visibility</h3>
              <p>
                Being on the <strong>first page</strong> means 90% of users will find you—not your competitors.
              </p>
              <div className="example">Position #1 on Google ≈ 30% of clicks.</div>
            </div>
            <div className="benefit-card">
              <h3>High-Quality Traffic</h3>
              <p>
                You attract users who are searching for <strong>exactly what you offer</strong>. It’s not advertising—it’s relevance.
              </p>
              <div className="example">
                Imagine: Someone searches for &quot;Best SEO Tool&quot; and finds <em>your</em> website.
              </div>
            </div>
            <div className="benefit-card">
              <h3>Trust and Authority</h3>
              <p>
                Google sees you as a <strong>trusted</strong> source. High rankings = greater brand credibility.
              </p>
              <div className="example">A top-ranking site conveys professionalism and reliability.</div>
            </div>
            <div className="benefit-card">
              <h3>Sustainable Growth</h3>
              <p>
                Once ranked, organic traffic is <strong>free and consistent</strong>, unlike paid ads.
              </p>
              <div className="example">Upfront investment vs. ongoing returns. SEO wins long-term.</div>
            </div>
            <div className="benefit-card">
              <h3>Artificial Intelligence</h3>
              <p>
                AI tools like ChatGPT analyze internet data—including SEO. If you’re not in SEO results, you won’t appear in AI responses. It’s that simple.
              </p>
              <div className="example">
                Your organic SEO ranking directly impacts visibility in AI searches like ChatGPT, Perplexity, Gemini, etc.
              </div>
            </div>
            <div className="benefit-card">
              <h3>Mobile-Ready</h3>
              <p>
                70% of searches happen on mobile. Good SEO ensures your site looks and works perfectly on any device.
              </p>
              <div className="example">
                If your site isn’t <em>mobile-friendly</em>, Google ignores your content in 7 out of 10 searches.
              </div>
            </div>
          </div>

          <div className="testimonials-section">
            <div className="testimonial-card">
              <div className="testimonial-logo">
                <Image src="/assets/ewheel.webp" alt="Local SEO Logo" width={48} height={48} />
              </div>
              <div className="testimonial-quote">
                “For <Link href="https://ewheel.es/en" target="_blank" rel="nofollow" className="text-primary">eWheel</Link>, SEO was key to pivoting toward a distributor model. We quickly ranked thanks to Ranku and analyzed our competition to boost our business.”
              </div>
              <div className="testimonial-author">
                <Image src="/assets/ewheel.webp" alt="eWheel" width={50} height={50} className="rounded-full" />
                <div className="testimonial-author-info">
                  <div className="testimonial-author-name">eWheel</div>
                  <div className="testimonial-author-title">Ecommerce: Scooters, eBikes</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-logo">
                <Image src="/assets/cr.webp" alt="Organic SEO Logo" width={48} height={48} />
              </div>
              <div className="testimonial-quote">
                “RANKU was the clear choice for us. The powerful organic analysis capabilities and the team at <Link href="https://www.found.co.uk" target="_blank" rel="nofollow" className="text-primary">Marketing Agency</Link> who helped position us across countless keywords and Google Local… nothing but the best.”
              </div>
              <div className="testimonial-author">
                <Image src="/assets/cr.webp" alt="CR" width={50} height={50} className="rounded-full" />
                <div className="testimonial-author-info">
                  <div className="testimonial-author-name">CR</div>
                  <div className="testimonial-author-title">Lawyer & Software Engineer</div>
                </div>
              </div>
            </div>
          </div>

          <div className="how-it-works-section">
            <p>
              With Ranku (real data, no smoke 🥇): Using Google Local and RankMap, we discovered that his Google Business profile lacked recent reviews in those areas, while competitors used local keywords in their descriptions (“cybercrime lawyer”). After updating his profile with geolocated content and requesting targeted reviews, he reached #1 within 3 weeks. <strong>Real result: +37% calls from Google Maps in one month.</strong> No magic—just data.
            </p>
            <Image
              src="/assets/seomap.webp"
              alt="seo-consultant"
              width={1200}
              height={600}
              className="imagen-responsive"
            />
          </div>

          <div className="cta-banner">
            <p className="main-message">Ready to <strong>outperform</strong> your competition?</p>
            <p className="subtitle-message">Stop guessing and start dominating search today!</p>
            <Link href="/auth" className="login-button cta-button">
              Subscribe to a Plan
            </Link>
          </div>

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

        </section>
      </div>
      <Footer />
    </>
  );
}