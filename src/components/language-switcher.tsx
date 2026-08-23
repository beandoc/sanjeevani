'use client';

import { useLocale } from 'next-intl';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { setLanguage } from '@/actions/set-language';
import { useRouter } from 'next/navigation';

const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
];

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();

    const handleLanguageChange = async (newLocale: string) => {
        await setLanguage(newLocale);
        router.refresh();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-primary/5 transition-colors">
                    <Languages className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <span className="sr-only">Switch Language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-border/40 shadow-xl">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        className={`font-medium ${locale === lang.code ? 'bg-primary/10 text-primary' : ''}`}
                        onClick={() => handleLanguageChange(lang.code)}
                    >
                        {lang.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
