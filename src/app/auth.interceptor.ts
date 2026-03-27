import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { retry, timer } from 'rxjs';

// Helper to get cookies
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// In-memory device ID (not persisted in cookies or localStorage)
let memoryDeviceId: string | null = null;

function getOrCreateDeviceId(): string {
    if (!memoryDeviceId) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            memoryDeviceId = crypto.randomUUID();
        } else {
            memoryDeviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
    }
    return memoryDeviceId;
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    // Only intercept if we're in the browser
    if (!isBrowser) {
        return next(req);
    }

    const token = getCookie('customer_session');
    const deviceId = getOrCreateDeviceId();

    let headers: { [name: string]: string } = {};

    // 1. Add Device ID for specific endpoints if needed by backend
    if (req.url.includes('/auth/session/start') || req.url.includes('/menu/items')) {
        headers['X-Device-Id'] = deviceId;
    }

    // 2. Add Authorization header for everything EXCEPT session start
    //    The Gateway will extract userId, restaurantId, tableNo from the JWT
    //    and inject them as X-User-Id, X-Restaurant-Id, X-Table-No headers automatically
    if (token && !req.url.includes('/auth/session/start')) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const outgoing = Object.keys(headers).length > 0
        ? req.clone({ setHeaders: headers })
        : req;

    // 3. Retry on 429 (Render free-tier hibernate rate-limiting)
    //    Exponential backoff: 2s, 4s, 8s — up to 3 retries
    return next(outgoing).pipe(
        retry({
            count: 3,
            delay: (error, retryCount) => {
                if (error.status === 429) {
                    const delayMs = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
                    console.warn(`[Retry ${retryCount}/3] Server returned 429. Retrying in ${delayMs / 1000}s...`);
                    return timer(delayMs);
                }
                // Don't retry non-429 errors
                throw error;
            }
        })
    );
};
