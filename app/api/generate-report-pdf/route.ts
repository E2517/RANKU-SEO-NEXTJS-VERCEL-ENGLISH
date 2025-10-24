import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongoose';
import SearchResult from '@/models/SearchResult';
import LocalVisibilityCampaign from '@/models/LocalVisibilityCampaign';
import LocalVisibilityResult from '@/models/LocalVisibilityResult';
import { Types } from 'mongoose';
import puppeteer from 'puppeteer';

function generateSEOExplanation(position: number, keyword: string, domain: string): string {
    if (position <= 0) {
        return `⚠️ The domain <strong>${domain}</strong> does not appear in the top 100 results for the keyword <em>"${keyword}"</em>. This indicates very low visibility.`;
    } else if (position <= 3) {
        return `✅ Excellent position. The domain <strong>${domain}</strong> is in the <strong>top 3</strong> for <em>"${keyword}"</em>, suggesting strong topical authority.`;
    } else if (position <= 10) {
        return `👍 Good visibility. Ranking in the <strong>top 10</strong> for <em>"${keyword}"</em> indicates that the domain <strong>${domain}</strong> is relevant.`;
    } else {
        return `🔍 The domain <strong>${domain}</strong> appears at position <strong>#${position}</strong> for <em>"${keyword}"</em>. While indexed, its visibility is limited.`;
    }
}

export async function GET(req: NextRequest) {
    await connectDB();

    const cookieStore = await cookies();
    const userIdStr = cookieStore.get('user_id')?.value;

    if (!userIdStr) {
        return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    }

    let userId;
    try {
        userId = new Types.ObjectId(userIdStr);
    } catch (e) {
        return NextResponse.json({ success: false, message: 'Invalid user ID.' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain') || '';
    const keyword = searchParams.get('keyword') || '';
    const devices = searchParams.getAll('device').map(d => d.trim()).filter(d => d !== '');

    if (!domain && !keyword) {
        return NextResponse.json({ success: false, message: 'Domain or keyword is required.' }, { status: 400 });
    }

    try {
        const query: any = { userId, tipoBusqueda: 'palabraClave' };
        if (domain) query.dominio = domain;
        if (keyword) query.palabraClave = keyword;

        const allSeoResults = await SearchResult.find(query).sort({ createdAt: -1 }).limit(500);

        if (allSeoResults.length === 0) {
            return NextResponse.json({ success: false, message: 'No results found.' }, { status: 404 });
        }

        let filteredSeoResults = [...allSeoResults];
        if (devices.length > 0) {
            filteredSeoResults = allSeoResults.filter(r => r.dispositivo && devices.includes(r.dispositivo));
        }

        const deviceOrder: Record<string, number> = { 'desktop': 1, 'mobile': 2, 'google_local': 3 };
        filteredSeoResults.sort((a, b) => {
            const orderA = deviceOrder[a.dispositivo ?? ''] ?? 99;
            const orderB = deviceOrder[b.dispositivo ?? ''] ?? 99;
            if (orderA !== orderB) return orderA - orderB;
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        const uniqueSeoResults: any[] = [];
        const seenKeys = new Set<string>();
        for (const r of filteredSeoResults) {
            const key = `${r.dispositivo}-${r.buscador}-${r.location || 'null'}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                uniqueSeoResults.push(r);
            }
        }

        const serpResults = uniqueSeoResults.filter(r => (r.dispositivo === 'desktop' || r.dispositivo === 'mobile') && r.buscador !== 'google_ai');
        const aiResults = uniqueSeoResults.filter(r => r.buscador === 'google_ai');
        const googleLocalResults = uniqueSeoResults.filter(r => r.dispositivo === 'google_local' && r.buscador === 'google_local');
        const rankMapResults = uniqueSeoResults.filter(r => r.buscador === 'google_maps');

        let mostRecentGoogleLocal = null;
        if (googleLocalResults.length > 0) {
            mostRecentGoogleLocal = googleLocalResults[0];
        }

        let scanMapResults: any[] = [];
        let latestScanMapCampaign = null;
        if (domain) {
            const campaignQuery: any = { userId, domain };
            if (keyword) campaignQuery.keyword = keyword;
            latestScanMapCampaign = await LocalVisibilityCampaign.findOne(campaignQuery).sort({ createdAt: -1 });
            if (latestScanMapCampaign) {
                scanMapResults = await LocalVisibilityResult.find({ campaignId: latestScanMapCampaign._id });
            }
        }

        let businessAddress = '';
        if (mostRecentGoogleLocal) {
            businessAddress = mostRecentGoogleLocal.location || 'N/A';
        } else if (latestScanMapCampaign) {
            businessAddress = latestScanMapCampaign.centerLocation?.name || 'N/A';
        } else if (rankMapResults.length > 0) {
            businessAddress = rankMapResults[0].location || 'N/A';
        }

        const headerHtml = `
        <div style="padding: 1.5rem; text-align: center; margin-bottom: 2rem;">
            <h1 style="margin: 0; font-size: 2rem;">📄 SEO Report – RANKU</h1>
            <p style="margin: 0.5rem 0 0; font-size: 1.1rem;">Generated on ${new Date().toLocaleDateString('en-US')}</p>
            <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 1rem; font-size: 1.1rem;">
                <span><strong>Domain:</strong> ${domain || 'All'}</span>
                <span><strong>Business Address:</strong> ${businessAddress}</span>
            </div>
        </div>
        `;

        let serpHtml = '';
        for (const r of serpResults) {
            const positions = [r.posicion].filter(p => p > 0);
            const avgPos = positions.length > 0 ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1) : 'N/A';
            const bestPos = positions.length > 0 ? Math.min(...positions) : 'N/A';
            serpHtml += `
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem;">
                <h3 style="color: #6c4ab6; margin-bottom: 0.5rem;">${r.dispositivo} — ${r.location || 'Global'}</h3>
                <p><strong>Keyword:</strong> ${r.palabraClave}</p>
                <p><strong>Domain:</strong> ${r.dominio}</p>
                <p><strong>Best position:</strong> #${bestPos}</p>
                <p><strong>Average position:</strong> #${avgPos}</p>
                <div style="margin-top: 0.5rem; padding: 0.75rem; background: #eef7ff; border-left: 3px solid #6c4ab6;">
                    <strong>Analysis:</strong><br>
                    ${generateSEOExplanation(bestPos === 'N/A' ? 0 : bestPos, r.palabraClave, r.dominio)}
                </div>
            </div>
            `;
        }

        let aiHtml = '';
        for (const r of aiResults) {
            const positions = [r.posicion].filter(p => p > 0);
            const avgPos = positions.length > 0 ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1) : 'N/A';
            const bestPos = positions.length > 0 ? Math.min(...positions) : 'N/A';
            aiHtml += `
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem;">
                <h3 style="color: #6c4ab6; margin-bottom: 0.5rem;">Artificial Intelligence — ${r.location || 'Global'}</h3>
                <p><strong>AI Query:</strong> ${r.palabraClave}</p>
                <p><strong>Domain:</strong> ${r.dominio}</p>
                <p><strong>Position:</strong> #${bestPos}</p>
                <div style="margin-top: 0.5rem; padding: 0.75rem; background: #eef7ff; border-left: 3px solid #6c4ab6;">
                    <strong>Analysis:</strong><br>
                    ${bestPos !== 'N/A'
                    ? `✅ The domain <strong>${r.dominio}</strong> was identified by Google AI at position <strong>#${bestPos}</strong> for the query: <em>"${r.palabraClave}"</em>.`
                    : `⚠️ The domain <strong>${r.dominio}</strong> was not identified by Google AI in the analyzed results.`}
                </div>
            </div>
            `;
        }

        let googleLocalHtml = '';
        if (mostRecentGoogleLocal) {
            const positions = [mostRecentGoogleLocal.posicion].filter(p => p > 0);
            const avgPos = positions.length > 0 ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1) : 'N/A';
            const bestPos = positions.length > 0 ? Math.min(...positions) : 'N/A';
            let ratingDisplay = '';
            if (mostRecentGoogleLocal.rating !== null) {
                ratingDisplay = `<br>⭐ ${mostRecentGoogleLocal.rating} (${mostRecentGoogleLocal.reviews || 'N/A'})`;
            }
            googleLocalHtml = `
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem;">
                <h3 style="color: #6c4ab6; margin-bottom: 0.5rem;">Google Local — ${mostRecentGoogleLocal.location || 'Global'}${ratingDisplay}</h3>
                <p><strong>Keyword:</strong> ${mostRecentGoogleLocal.palabraClave}</p>
                <p><strong>Domain:</strong> ${mostRecentGoogleLocal.dominio}</p>
                <p><strong>Best position:</strong> #${bestPos}</p>
                <p><strong>Average position:</strong> #${avgPos}</p>
                <div style="margin-top: 0.5rem; padding: 0.75rem; background: #eef7ff; border-left: 3px solid #6c4ab6;">
                    <strong>Analysis:</strong><br>
                    ${generateSEOExplanation(bestPos === 'N/A' ? 0 : bestPos, mostRecentGoogleLocal.palabraClave, mostRecentGoogleLocal.dominio)}
                </div>
            </div>
            `;
        }

        let rankMapHtml = '<p>❌ No RankMap (Google Maps) results found for this combination.</p>';
        if (rankMapResults.length > 0) {
            const found = rankMapResults.filter(r => r.posicion > 0);
            if (found.length > 0) {
                const positions = found.map(r => r.posicion);
                const best = Math.min(...positions);
                const worst = Math.max(...positions);
                const avg = (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1);
                rankMapHtml = `
                <p>✅ RankMap (Google Maps) results found across <strong>${rankMapResults.length}</strong> locations.</p>
                <ul>
                    <li><strong>Best position:</strong> #${best}</li>
                    <li><strong>Average position:</strong> #${avg}</li>
                    <li><strong>Worst position:</strong> #${worst}</li>
                    <li><strong>Appears in:</strong> ${found.length} of ${rankMapResults.length} locations</li>
                </ul>
                <p><em>Data from your latest search in the RankMap section.</em></p>
                `;
            } else {
                rankMapHtml = '<p>⚠️ RankMap results were found, but none contain a valid position (>0).</p>';
            }
        }

        let scanMapHtml = '<p>❌ No ScanMap simulation has been run for this combination.</p>';
        if (scanMapResults.length > 0) {
            const found = scanMapResults.filter(r => r.ranking > 0);
            if (found.length > 0) {
                const rankings = found.map(r => r.ranking);
                const best = Math.min(...rankings);
                const worst = Math.max(...rankings);
                const avg = (rankings.reduce((a, b) => a + b, 0) / rankings.length).toFixed(1);
                scanMapHtml = `
                <p>✅ Simulation completed with <strong>${scanMapResults.length}</strong> points.</p>
                <ul>
                    <li><strong>Best position:</strong> #${best}</li>
                    <li><strong>Average position:</strong> #${avg}</li>
                    <li><strong>Worst position:</strong> #${worst}</li>
                    <li><strong>Appears in:</strong> ${found.length} of ${scanMapResults.length} locations</li>
                </ul>
                <p><em>Data from your latest search in the ScanMap section.</em></p>
                `;
            } else {
                scanMapHtml = '<p>⚠️ ScanMap results were found, but none contain a valid ranking (>0).</p>';
            }
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>RANKU Report</title>
                <style>
                    body {
                        font-family: 'Inter', Arial, sans-serif;
                        margin: 2rem;
                        background: white;
                        color: #2d2d2d;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 2rem;
                        border-bottom: 2px solid #6c4ab6;
                        padding-bottom: 1rem;
                    }
                    h1 {
                        color: #6c4ab6;
                    }
                    h2 {
                        color: #6c4ab6;
                        margin: 1.5rem 0 1rem;
                    }
                    h3 {
                        color: #4a30a5;
                    }
                    ul {
                        padding-left: 1.5rem;
                    }
                    .footer {
                        margin-top: 3rem;
                        text-align: center;
                        color: #666;
                        font-size: 0.9rem;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                    @media print {
                        .page-break {
                            page-break-before: always;
                        }
                    }
                </style>
            </head>
            <body>
                ${headerHtml}
                ${serpHtml ? `<h2>🔍 SERP – Google Search</h2>${serpHtml}` : ''}
                <div class="page-break"></div>
                ${googleLocalHtml ? `<h2>📍 Google Local</h2>${googleLocalHtml}` : ''}
                <h2>🗺️ RankMap – Google Maps</h2>
                ${rankMapHtml}
                <h2>🥷 ScanMap – Local Visibility</h2>
                ${scanMapHtml}
                <div class="page-break"></div>
                ${aiHtml ? `<h2>🧠 Artificial Intelligence</h2>${aiHtml}` : ''}
                <div class="footer">
                    <p>Report generated with <strong>RANKU.ES | Local SEO</strong> • Data updated as of ${new Date().toLocaleDateString('en-US')}</p>
                </div>
            </body>
            </html>
        `;

        let browser;
        if (process.env.VERCEL) {
            const chromium = require('@sparticuz/chromium');
            browser = await puppeteer.launch({
                args: [
                    ...chromium.args,
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--no-sandbox',
                    '--disable-web-security',
                ],
                executablePath: await chromium.executablePath(),
                headless: true,
            });
        } else {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--no-sandbox',
                    '--disable-web-security',
                ],
            });
        }

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `attachment; filename=ranku_report_${domain || 'all'}_${keyword || 'all'}.pdf`);

        return new NextResponse(pdfBuffer as any as ArrayBuffer, { headers });
    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json({ success: false, message: 'Internal error while generating the report.' }, { status: 500 });
    }
}