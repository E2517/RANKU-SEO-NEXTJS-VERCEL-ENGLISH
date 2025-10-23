import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import User from '@/models/User';
import SearchResult from '@/models/SearchResult';
import { connectDB } from '@/lib/mongoose';
import axios from 'axios';

const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;

interface TextBlock {
    type: string;
    snippet: string;
    list?: TextBlock[];
}

interface SerpApiGoogleAiResponse {
    search_metadata?: { status?: string };
    error?: string;
    text_blocks?: TextBlock[];
}

function extractAllText(blocks: TextBlock[]): string[] {
    const snippets: string[] = [];

    function walk(block: TextBlock) {
        if (block.snippet) {
            snippets.push(block.snippet);
        }
        if (block.list) {
            for (const child of block.list) {
                walk(child);
            }
        }
    }

    for (const block of blocks) {
        walk(block);
    }

    return snippets;
}

function extractDomainsInOrder(blocks: TextBlock[]): string[] {
    const domains: string[] = [];
    const domainRegex = /(?:^|\s|`|["'()[\]])(([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(?=\s|`|["'()[\]]|$)/g;

    function walk(block: TextBlock) {
        if (Array.isArray((block as any).snippet_links)) {
            for (const linkObj of (block as any).snippet_links) {
                if (typeof linkObj.link === 'string') {
                    const clean = linkObj.link.trim();
                    if (clean.startsWith('http')) {
                        const domain = clean
                            .replace(/^https?:\/\//, '')
                            .split('/')[0]
                            .toLowerCase()
                            .replace(/^www\./, '');
                        if (domain && !domains.includes(domain)) {
                            domains.push(domain);
                        }
                    }
                }
            }
        }

        if (block.snippet) {
            let match;
            while ((match = domainRegex.exec(block.snippet)) !== null) {
                const fullDomain = match[1].toLowerCase().replace(/^www\./, '');
                if (fullDomain && !domains.includes(fullDomain)) {
                    domains.push(fullDomain);
                }
            }
        }

        if (block.list) {
            for (const child of block.list) {
                walk(child);
            }
        }
    }

    for (const block of blocks) {
        walk(block);
    }

    return domains;
}

function findBusinessPosition(blocks: TextBlock[], normalizedBusiness: string): number | null {
    const allText = extractAllText(blocks).join(' ').toLowerCase();
    return allText.includes(normalizedBusiness) ? 1 : null;
}

export async function POST(req: Request) {
    await connectDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    const body = await req.json();
    const { keywords, business, domain } = body;

    if (!keywords?.trim() || !business?.trim() || !domain?.trim()) {
        return NextResponse.json({ success: false, message: 'Required fields are missing.' }, { status: 400 });
    }

    if (!userId) {
        return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    if (user.limitKeywords <= 0) {
        return NextResponse.json({
            success: false,
            message: 'You have reached the search limit allowed by your current plan.',
            actionText: 'Go to Profile and Subscription',
            redirectTo: '/dashboard?tab=profile-section'
        }, { status: 403 });
    }

    const normalizedDomain = domain.trim().toLowerCase().replace(/^www\./, '');
    const normalizedBusiness = business.trim().toLowerCase();

    if (!SERPAPI_API_KEY) {
        return NextResponse.json({ success: false, message: 'SerpAPI is not configured.' }, { status: 500 });
    }

    try {
        const searchQuery = encodeURIComponent(keywords.trim());
        const url = `https://serpapi.com/search?engine=google_ai_mode&q=${searchQuery}&api_key=${SERPAPI_API_KEY}`;

        const serpRes = await axios.get<SerpApiGoogleAiResponse>(url);
        const serpData = serpRes.data;

        if (serpData.error || serpData.search_metadata?.status !== 'Success') {
            return NextResponse.json({ success: false, message: 'Error fetching AI results.' }, { status: 500 });
        }

        const textBlocks = serpData.text_blocks || [];
        const domainsInOrder = extractDomainsInOrder(textBlocks);

        let domainPosition: number | null = null;
        const domainIndex = domainsInOrder.indexOf(normalizedDomain);
        if (domainIndex !== -1) domainPosition = domainIndex + 1;

        const businessPosition = findBusinessPosition(textBlocks, normalizedBusiness);

        let finalPosition: number | null = null;
        if (domainPosition !== null) {
            finalPosition = domainPosition;
        } else if (businessPosition !== null) {
            finalPosition = businessPosition;
        }

        const now = new Date();
        const filter = {
            userId: user._id,
            tipoBusqueda: 'palabraClave',
            palabraClave: keywords.trim(),
            dominio: normalizedDomain,
        };

        if (finalPosition !== null) {
            user.limitKeywords = Math.max(0, user.limitKeywords - 1);
            await user.save();

            const existing = await SearchResult.findOne(filter);
            const updateData: any = {
                userId: user._id,
                tipoBusqueda: 'palabraClave',
                palabraClave: keywords.trim(),
                dominio: normalizedDomain,
                buscador: 'google_ai',
                dispositivo: 'mobile',
                posicion: finalPosition,
                updatedAt: now,
            };

            if (existing && existing.posicion !== undefined) {
                updateData.posicionAnterior = existing.posicion;
                updateData.fechaPosicionAnterior = existing.updatedAt || existing.createdAt;
            }

            await SearchResult.findOneAndUpdate(filter, { $set: updateData }, { upsert: true, new: true });

            return NextResponse.json({
                success: true,
                message: 'Search completed and saved. You can view results in Domains or Statistics.',
                results: {
                    keywords: keywords.trim(),
                    domain: normalizedDomain,
                    business: normalizedBusiness,
                    domainPosition,
                    businessPosition,
                    rawTextBlocks: textBlocks,
                },
            });
        } else {
            return NextResponse.json({
                success: true,
                message: 'Search completed. The business or domain was not mentioned in the AI response.',
                results: {
                    keywords: keywords.trim(),
                    domain: normalizedDomain,
                    business: normalizedBusiness,
                    domainPosition,
                    businessPosition,
                    rawTextBlocks: textBlocks,
                },
            });
        }
    } catch (error: any) {
        console.error('Error in /api/ai-intelligence:', error.response?.data || error.message);
        return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
    }
}