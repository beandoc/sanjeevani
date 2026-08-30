'use server';

import { cookies } from 'next/headers';

const SUPPORTED_LOCALES = ['en', 'hi', 'bn', 'mr', 'ta'] as const;

export async function setLanguage(locale: string) {
    if (!SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) {
        return;
    }
    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', locale);
}
