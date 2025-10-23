import { NextResponse } from 'next/server';
import SearchResult from '@/models/SearchResult';
import User from '@/models/User';
import { connectDB } from '@/lib/mongoose';
import { normalizeDomain } from '@/lib/utils';
import axios from 'axios';
import { cookies } from 'next/headers';

const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;

interface SerpApiResponse {
    organic_results?: {
        link?: string;
        position?: number;
    }[];
    local_results?: Array<{
        position?: number;
        website?: string;
        links?: { website?: string };
        title?: string;
        rating?: number;
        reviews?: number;
    }>;
    ads_results?: Array<{
        position?: number;
        website?: string;
        links?: { website?: string };
        title?: string;
        rating?: number;
        reviews?: number;
    }>;
}

interface AggregatedKeyword {
    _id: {
        palabraClave: string;
        dominioFiltrado: string;
        dispositivo: string;
        location: string | null;
    };
    userIds: string[];
}

interface SearchResultDocument {
    userId: string;
    palabraClave: string;
    dominioFiltrado: string;
    dispositivo: string;
    location: string | null;
    posicion: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface UpdateData {
    userId: string;
    buscador: string;
    dispositivo: string;
    posicion: number;
    palabraClave: string;
    dominio: string;
    tipoBusqueda: string;
    dominioFiltrado: string;
    location: string | null;
    rating?: number | null;
    reviews?: number | null;
    updatedAt: Date;
    posicionAnterior?: number;
    fechaPosicionAnterior?: Date;
}

export async function GET() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
        return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
    }

    if (!SERPAPI_API_KEY) {
        return NextResponse.json({ success: false, message: 'SerpAPI is not configured.' }, { status: 500 });
    }

    try {
        const allKeywords = await SearchResult.aggregate<AggregatedKeyword>([
            {
                $group: {
                    _id: {
                        palabraClave: "$palabraClave",
                        dominioFiltrado: "$dominioFiltrado",
                        dispositivo: "$dispositivo",
                        location: "$location",
                    },
                    userIds: { $addToSet: "$userId" },
                }
            }
        ]);

        if (allKeywords.length === 0) {
            return NextResponse.json({ success: true, message: 'No keywords to update.', updated: 0 });
        }

        let updatedCount = 0;

        for (const entry of allKeywords) {
            const { palabraClave, dominioFiltrado, dispositivo, location } = entry._id;

            if (dispositivo === 'google_local') {
                let position = 0;
                let rating: number | null = null;
                let reviews: number | null = null;
                let foundDomain: string | null = null;

                for (let start = 0; start < 100; start += 20) {
                    const params = {
                        api_key: SERPAPI_API_KEY,
                        q: location ? `${palabraClave} ${location}` : palabraClave,
                        engine: 'google_local',
                        location: location,
                        google_domain: 'google.com',
                        // gl: 'us',
                        hl: 'en',
                        num: 20,
                        start: start,
                        device: 'mobile'
                    };

                    const response = await axios.get<SerpApiResponse>('https://serpapi.com/search  ', { params });
                    const pageResults = response.data.local_results || response.data.ads_results || [];
                    if (pageResults.length === 0) break;

                    let foundInPage = false;
                    for (const result of pageResults) {
                        if (result.position !== undefined) {
                            let resultDomain: string | null = null;

                            if (result.website) {
                                resultDomain = normalizeDomain(result.website);
                            } else if (result.links?.website) {
                                resultDomain = normalizeDomain(result.links.website);
                            }

                            if (!resultDomain && result.title) {
                                const cleanTitle = result.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                                const domainBase = dominioFiltrado
                                    .replace(/^(www\.)?/, '')
                                    .replace(/\.(es|com|net|org|eu|io|co)$/, '')
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/g, '');

                                if (cleanTitle.includes(domainBase) || domainBase.includes(cleanTitle)) {
                                    resultDomain = dominioFiltrado;
                                }
                            }

                            if (resultDomain === dominioFiltrado) {
                                position = start + result.position;
                                rating = result.rating || null;
                                reviews = result.reviews || null;
                                foundDomain = resultDomain;
                                foundInPage = true;
                                break;
                            }
                        }
                    }

                    if (foundInPage) break;
                }

                if (position > 0) {
                    for (const userId of entry.userIds) {
                        const updateFilter = {
                            userId: userId,
                            palabraClave: palabraClave,
                            dominioFiltrado: dominioFiltrado,
                            dispositivo: 'google_local',
                            ...(location ? { location } : {})
                        };

                        const existing = await SearchResult.findOne<SearchResultDocument>(updateFilter);

                        const now = new Date();
                        const newSetData: UpdateData = {
                            userId: userId,
                            buscador: 'google_local',
                            dispositivo: 'google_local',
                            posicion: position,
                            palabraClave: palabraClave,
                            dominio: foundDomain || dominioFiltrado,
                            tipoBusqueda: 'palabraClave',
                            dominioFiltrado: dominioFiltrado,
                            location: location || null,
                            rating,
                            reviews,
                            updatedAt: now
                        };

                        if (existing && existing.posicion !== undefined) {
                            newSetData.posicionAnterior = existing.posicion;
                            newSetData.fechaPosicionAnterior = existing.updatedAt || existing.createdAt;
                        }

                        await SearchResult.findOneAndUpdate(
                            updateFilter,
                            { $set: newSetData },
                            { upsert: true, new: true }
                        );
                    }
                    updatedCount++;
                }
            } else {
                let position = 0;
                let foundDomain: string | null = null;

                for (let start = 0; start < 100; start += 10) {
                    const params = {
                        api_key: SERPAPI_API_KEY,
                        q: location ? `${palabraClave} ${location}` : palabraClave,
                        engine: 'google',
                        location: location,
                        google_domain: 'google.com',
                        // gl: 'us',
                        hl: 'en',
                        num: 10,
                        start: start,
                        device: dispositivo
                    };

                    const response = await axios.get<SerpApiResponse>('https://serpapi.com/search  ', { params });
                    const organic = response.data.organic_results || [];
                    if (organic.length === 0) break;

                    let foundInPage = false;
                    for (let i = 0; i < organic.length; i++) {
                        const result = organic[i];
                        if (result.link) {
                            const resultDomain = normalizeDomain(result.link);
                            if (resultDomain === dominioFiltrado) {
                                position = start + (result.position || i + 1);
                                foundDomain = resultDomain;
                                foundInPage = true;
                                break;
                            }
                        }
                    }

                    if (foundInPage) break;
                }

                if (position > 0) {
                    for (const userId of entry.userIds) {
                        const updateFilter = {
                            userId: userId,
                            palabraClave: palabraClave,
                            dominioFiltrado: dominioFiltrado,
                            dispositivo: dispositivo,
                            ...(location ? { location } : {})
                        };

                        const existing = await SearchResult.findOne<SearchResultDocument>(updateFilter);

                        const now = new Date();
                        const newSetData: UpdateData = {
                            userId: userId,
                            buscador: 'google',
                            dispositivo: dispositivo,
                            posicion: position,
                            palabraClave: palabraClave,
                            dominio: foundDomain || dominioFiltrado,
                            tipoBusqueda: 'palabraClave',
                            dominioFiltrado: dominioFiltrado,
                            location: location || null,
                            updatedAt: now
                        };

                        if (existing && existing.posicion !== undefined) {
                            newSetData.posicionAnterior = existing.posicion;
                            newSetData.fechaPosicionAnterior = existing.updatedAt || existing.createdAt;
                        }

                        await SearchResult.findOneAndUpdate(
                            updateFilter,
                            { $set: newSetData },
                            { upsert: true, new: true }
                        );
                    }
                    updatedCount++;
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Keywords updated.', updated: updatedCount });
    } catch (error: any) {
        console.error('Error updating keywords:', error.response?.data || error.message || error);
        return NextResponse.json({ success: false, message: 'Error updating keywords.' }, { status: 500 });
    }
}