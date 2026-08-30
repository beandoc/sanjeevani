import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
    // Provide a static locale, fetch a user setting,
    // read from `cookies()`, `headers()`, etc.

    const SUPPORTED_LOCALES = ['en', 'hi', 'bn', 'mr', 'ta'];
    const DEFAULT_LOCALE = 'en';

    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
    const locale = cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default
    };
});
