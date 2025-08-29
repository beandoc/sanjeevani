
import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './src/i18n';
 
export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(hi|mr|en)/:path*']
};
