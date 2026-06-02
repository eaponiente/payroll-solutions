import { usePage } from '@inertiajs/react';

export function formatDate(value: string | null, tz: string): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(value));
}

export function formatTime(value: string | null, tz: string): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export function formatDateFull(value: string | null, tz: string): string {
    if (!value) {
        return '';
    }

    return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(value));
}

export function formatDateShort(value: string | null, tz: string): string {
    if (!value) {
        return '';
    }

    return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(new Date(value));
}

export function formatDateYmd(value: string | null, tz: string): string {
    if (!value) {
        return '';
    }

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date(value));
    const y = parts.find((p) => p.type === 'year')?.value ?? '';
    const m = parts.find((p) => p.type === 'month')?.value ?? '';
    const d = parts.find((p) => p.type === 'day')?.value ?? '';

    return `${y}-${m}-${d}`;
}

export function formatDateMd(value: string | null, tz: string): string {
    if (!value) {
        return '';
    }

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date(value));
    const m = parts.find((p) => p.type === 'month')?.value ?? '';
    const d = parts.find((p) => p.type === 'day')?.value ?? '';

    return `${m}/${d}`;
}

export function formatTimeRaw(value: string | null): string {
    if (!value) {
        return '-';
    }

    const match = value.match(/T(\d{2}):(\d{2})/);

    if (!match) {
        return value;
    }

    const h = +match[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;

    return `${h12}:${match[2]} ${ampm}`;
}

export function useDateFormatter() {
    const { timezone } = usePage<{ timezone: string }>().props;
    const tz = timezone ?? 'Asia/Manila';

    return {
        formatDate: (value: string | null) => formatDate(value, tz),
        formatTime: (value: string | null) => formatTime(value, tz),
        formatTimeRaw,
        formatDateFull: (value: string | null) => formatDateFull(value, tz),
        formatDateShort: (value: string | null) => formatDateShort(value, tz),
        formatDateYmd: (value: string | null) => formatDateYmd(value, tz),
        formatDateMd: (value: string | null) => formatDateMd(value, tz),
    };
}
