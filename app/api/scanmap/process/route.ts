import { NextRequest, NextResponse } from 'next/server';
import LocalVisibilityCampaign from '@/models/LocalVisibilityCampaign';
import LocalVisibilityResult from '@/models/LocalVisibilityResult';
import { connectDB } from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

function normalizeDomain(domain: string): string {
    return domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split(/[\/:]/)[0]
        .toLowerCase();
}

function generateSearchGrid(centerLat: number, centerLng: number, maxRadiusMeters: number, stepMeters: number, pointsPerRing: number) {
    const points = [];
    for (let radius = 0; radius <= maxRadiusMeters; radius += stepMeters) {
        if (radius === 0) {
            points.push({ lat: centerLat, lng: centerLng, radius: 0 });
        } else {
            for (let i = 0; i < pointsPerRing; i++) {
                const angle = (i / pointsPerRing) * 2 * Math.PI;
                const { lat, lng } = calculatePoint(centerLat, centerLng, radius / 1000, angle);
                points.push({ lat, lng, radius });
            }
        }
    }
    return points;
}

function calculatePoint(lat: number, lng: number, distanceKm: number, angle: number) {
    const R = 6371;
    const latRad = lat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;
    const newLatRad = Math.asin(
        Math.sin(latRad) * Math.cos(distanceKm / R) +
        Math.cos(latRad) * Math.sin(distanceKm / R) * Math.cos(angle)
    );
    const newLngRad = lngRad + Math.atan2(
        Math.sin(angle) * Math.sin(distanceKm / R) * Math.cos(latRad),
        Math.cos(distanceKm / R) - Math.sin(latRad) * Math.sin(newLatRad)
    );
    return { lat: newLatRad * 180 / Math.PI, lng: newLngRad * 180 / Math.PI };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function saveScanMapResult(
    campaignId: string,
    point: { lat: number; lng: number; radius: number },
    centerLat: number,
    centerLng: number,
    ranking: number,
    placeName: string,
    placeAddress: string,
    placeWebsite: string
) {
    await LocalVisibilityResult.create({
        campaignId,
        searchLocation: { lat: point.lat, lng: point.lng },
        radius: point.radius,
        distanceFromCenter: calculateDistance(centerLat, centerLng, point.lat, point.lng),
        ranking,
        placeName,
        placeAddress,
        placeWebsite
    });
}

export async function POST(req: NextRequest) {
    await connectDB();
    const { campaignId, keyword, domain, lat, lng, maxRadiusMeters, stepMeters } = await req.json();
    await LocalVisibilityCampaign.findByIdAndUpdate(campaignId, { status: 'processing' });
    const points = generateSearchGrid(lat, lng, maxRadiusMeters, stepMeters, 8);
    const normalizedDomain = normalizeDomain(domain);

    for (const [index, point] of points.entries()) {
        try {
            const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword)}&location=${point.lat},${point.lng}&radius=${maxRadiusMeters}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
            const searchRes = await fetch(searchUrl);
            const searchData: any = await searchRes.json();

            if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
                await saveScanMapResult(campaignId, point, lat, lng, -1, '', '', '');
                continue;
            }

            let foundRanking = -1;
            let foundName = '';
            let foundAddress = '';
            let foundWebsite = '';

            if (Array.isArray(searchData.results)) {
                for (let i = 0; i < searchData.results.length; i++) {
                    const place = searchData.results[i];
                    const nameLower = (place.name || '').toLowerCase();
                    if (nameLower.includes(normalizedDomain)) {
                        foundRanking = i + 1;
                        foundName = place.name || '';
                        foundAddress = place.formatted_address || '';
                        break;
                    }

                    if (place.place_id) {
                        const detailsUrl = `  https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,website,formatted_address&key=${process.env.GOOGLE_PLACES_API_KEY}`;
                        const detailsRes = await fetch(detailsUrl);
                        const detailsData: any = await detailsRes.json();

                        const website = (detailsData.result?.website || '').toLowerCase();
                        if (website.includes(normalizedDomain)) {
                            foundRanking = i + 1;
                            foundName = detailsData.result?.name || place.name || '';
                            foundAddress = detailsData.result?.formatted_address || place.formatted_address || '';
                            foundWebsite = website;
                            break;
                        }
                        await new Promise(r => setTimeout(r, 100));
                    }
                }
            }

            await saveScanMapResult(campaignId, point, lat, lng, foundRanking, foundName, foundAddress, foundWebsite);
        } catch (error) {
            console.error(`❌ Error at point ${point.lat},${point.lng}:`, error);
            await saveScanMapResult(campaignId, point, lat, lng, -1, '', '', '');
        }
        await new Promise(r => setTimeout(r, 250));
    }

    await LocalVisibilityCampaign.findByIdAndUpdate(campaignId, { status: 'completed' });
    console.log(`✅ ScanMap completed. ID: ${campaignId}`);
    return NextResponse.json({ success: true });
}