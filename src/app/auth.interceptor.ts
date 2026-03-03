import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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

    // 1. Add X-Device-Id for /auth/session/start AND /menu/items
    if (req.url.includes('/auth/session/start') || req.url.includes('/menu/items')) {
        headers['X-Device-Id'] = deviceId;
    }

    // 2. Add Authorization header for everything EXCEPT session start
    if (token && !req.url.includes('/auth/session/start')) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (Object.keys(headers).length > 0) {
        const cloned = req.clone({ setHeaders: headers });
        return next(cloned);
    }

    return next(req);
};
