import { NextResponse } from 'next/server';
import SearchResult from '@/models/SearchResult';
import User from '@/models/User';
import { connectDB } from '@/lib/mongoose';
import { normalizeDomain } from '@/lib/utils';
import axios from 'axios';
import { cookies } from 'next/headers';

const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

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
    posicionAnterior24h: number | null;
    posicionAnterior7d: number | null;
    posicionAnterior30d: number | null;
    last7dUpdate: Date | null;
    last30dUpdate: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const cookieStore = await cookies();
    const userIdFromCookie = cookieStore.get('user_id')?.value;
    const tokenFromQuery = url.searchParams.get('token');

    let isAuthorized = false;

    if (!userIdFromCookie && CRON_SECRET && tokenFromQuery === CRON_SECRET) {
        isAuthorized = true;
    } else if (userIdFromCookie) {
        await connectDB();
        const user = await User.findById(userIdFromCookie);
        if (user && user.role === 'admin') {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 401 });
    }

    const mongooseGlobal: any = global;
    if (!userIdFromCookie || !mongooseGlobal.mongoose) {
        await connectDB();
    }

    if (!SERPAPI_API_KEY) {
        return NextResponse.json({ success: false, message: 'SerpAPI no configurada.' }, { status: 500 });
    }

    try {
        const allKeywords = await SearchResult.aggregate<AggregatedKeyword>([
            {
                $match: {
                    buscador: { $in: ['google', 'google_local'] },
                    tipoBusqueda: 'palabraClave'
                }
            },
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
            return NextResponse.json({ success: true, message: 'No hay keywords para actualizar.', updated: 0 });
        }

        let updatedCount = 0;
        const now = new Date();

        for (const entry of allKeywords) {
            const { palabraClave, dominioFiltrado, dispositivo, location } = entry._id;

            let position = 0;
            let rating: number | null = null;
            let reviews: number | null = null;
            let foundDomain: string | null = null;

            if (dispositivo === 'google_local') {
                for (let start = 0; start < 100; start += 20) {
                    const params = {
                        api_key: SERPAPI_API_KEY,
                        q: location ? `${palabraClave} ${location}` : palabraClave,
                        engine: 'google_local',
                        location: location,
                        google_domain: 'google.com',
                        gl: 'es',
                        hl: 'es',
                        num: 20,
                        start: start,
                        device: 'mobile'
                    };

                    try {
                        const response = await axios.get<SerpApiResponse>('https://serpapi.com/search', { params });
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
                    } catch (error: any) {
                        if (error.response?.status === 400 && typeof error.response.data?.error === 'string' && error.response.data.error.includes('location')) {
                            console.warn(`Saltando keyword por error de localización: ${palabraClave} - ${location}`);
                            break;
                        }
                        throw error;
                    }
                }
            } else {
                for (let start = 0; start < 100; start += 10) {
                    const params = {
                        api_key: SERPAPI_API_KEY,
                        q: location ? `${palabraClave} ${location}` : palabraClave,
                        engine: 'google',
                        location: location,
                        google_domain: 'google.es',
                        gl: 'es',
                        hl: 'es',
                        num: 10,
                        start: start,
                        device: dispositivo
                    };

                    try {
                        const response = await axios.get<SerpApiResponse>('https://serpapi.com/search', { params });
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
                    } catch (error: any) {
                        if (error.response?.status === 400 && typeof error.response.data?.error === 'string' && error.response.data.error.includes('location')) {
                            console.warn(`Saltando keyword por error de localización: ${palabraClave} - ${location}`);
                            break;
                        }
                        throw error;
                    }
                }
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

                    const updateData: any = {
                        userId: userId,
                        buscador: dispositivo === 'google_local' ? 'google_local' : 'google',
                        dispositivo: dispositivo,
                        posicion: position,
                        palabraClave: palabraClave,
                        dominio: foundDomain || dominioFiltrado,
                        tipoBusqueda: 'palabraClave',
                        dominioFiltrado: dominioFiltrado,
                        location: location || null,
                        rating: dispositivo === 'google_local' ? rating : undefined,
                        reviews: dispositivo === 'google_local' ? reviews : undefined,
                        updatedAt: now
                    };

                    if (existing && existing.posicion !== undefined) {
                        updateData.posicionAnterior24h = existing.posicion;

                        const last7d = existing.last7dUpdate;
                        const daysSince7d = last7d ? Math.floor((now.getTime() - last7d.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
                        if (daysSince7d >= 7) {
                            updateData.posicionAnterior7d = existing.posicion;
                            updateData.last7dUpdate = now;
                        }

                        const last30d = existing.last30dUpdate;
                        const daysSince30d = last30d ? Math.floor((now.getTime() - last30d.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
                        if (daysSince30d >= 30) {
                            updateData.posicionAnterior30d = existing.posicion;
                            updateData.last30dUpdate = now;
                        }
                    } else {
                        updateData.posicionAnterior24h = null;
                        updateData.posicionAnterior7d = null;
                        updateData.posicionAnterior30d = null;
                        updateData.last7dUpdate = now;
                        updateData.last30dUpdate = now;
                    }

                    await SearchResult.findOneAndUpdate(
                        updateFilter,
                        { $set: updateData },
                        { upsert: true, new: true }
                    );
                }
                updatedCount++;
            }
        }

        return NextResponse.json({ success: true, message: 'Keywords udapted.', updated: updatedCount });
    } catch (error: any) {
        console.error('Error actualizando keywords:', error.response?.data || error.message || error);
        return NextResponse.json({ success: false, message: 'Error al actualizar las keywords.' }, { status: 500 });
    }
}