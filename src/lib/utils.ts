export function normalizeDomain(url: string): string | null {
    if (!url) return null;
    try {
        let fullUrl = url;
        if (url.startsWith('//')) {
            fullUrl = 'https:' + url;
        } else if (!url.startsWith('http')) {
            fullUrl = 'https://' + url;
        }
        const domain = new URL(fullUrl).hostname;
        return domain.replace(/^www\./, '').toLowerCase();
    } catch {
        console.warn('⚠️ URL inválida:', url);
        return null;
    }
}

export function getKeywordLimit(plan: string): number {
    const limits: Record<string, number> = {
        Gratuito: 0,
        Basico: 250,
        Pro: 500,
        Ultra: 1000,
    };
    return limits[plan] || 0;
}

export function getScanMapBaseLimit(plan: string): number {
    const limits: Record<string, number> = {
        Gratuito: 0,
        Basico: 5,
        Pro: 10,
        Ultra: 15,
    };
    return limits[plan] || 0;
}