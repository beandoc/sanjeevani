import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}
