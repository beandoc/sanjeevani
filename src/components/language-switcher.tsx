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

export function LanguageSwitcher({ className }: { className?: string } = {}) {
    const locale = useLocale();
    const router = useRouter();

    const handleLanguageChange = async (newLocale: string) => {
        await setLanguage(newLocale);
        router.refresh();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-xl h-8 w-8 sm:h-9 sm:w-9 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors ${className || ''}`}
                    title="Switch Language"
                >
                    <Languages className="h-4 w-4" />
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
