
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getMessages, getTranslations } from 'next-intl/server';
import DashboardClient from './dashboard-client';
import { pick } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';

export default async function DashboardPage() {
  const t = await getTranslations('DashboardPage');
  const messages = await getMessages();
  
  return (
    <div className="container mx-auto p-0">
      <div className="grid gap-6">
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">{t('welcome')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{t('intro')}</p>
          </CardContent>
        </Card>
        <NextIntlClientProvider messages={pick(messages, 'DashboardPage')}>
          <DashboardClient />
        </NextIntlClientProvider>
      </div>
    </div>
  );
}
