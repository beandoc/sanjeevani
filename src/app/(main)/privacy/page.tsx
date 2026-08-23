import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Lock, EyeOff, Database, FileText, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Privacy Policy — Sanjeevani',
  description: 'Data privacy principles, local-first storage architecture, and patient data confidentiality standards in Sanjeevani.'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Patient & Caregiver Data Governance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-headline">
          Privacy Policy & Data Principles
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Last Updated: August 2026 • Effective for all Sanjeevani educational & clinical decision-support modules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-card/60">
          <CardContent className="p-5 space-y-2">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Local-First Storage</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Assessment logs, vital records, and settings are stored locally within your browser sandbox (`localStorage`).
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60">
          <CardContent className="p-5 space-y-2">
            <EyeOff className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">No Third-Party Tracking</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We do not sell, rent, or trade caregiver responses, psychometric scores, or health logs with third-party brokers.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60">
          <CardContent className="p-5 space-y-2">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">User Data Autonomy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You retain total control over your assessment histories with full capability to wipe local records at any time.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section className="space-y-2 bg-card border border-border p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            1. Information Collection and Handling
          </h2>
          <p>
            Sanjeevani operates primarily as an educational hub and client-side decision-support tool. When utilizing standardized assessments such as the Zarit Caregiver Burden Scale or logging blood pressure and glucose readings:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
            <li><strong>Assessment Responses:</strong> Raw questionnaire entries and calculated scores are processed client-side.</li>
            <li><strong>No Unsolicited Telemetry:</strong> No personally identifiable health data (PHI) or Aadhaar numbers are collected or stored on remote cloud servers without explicit user consent.</li>
          </ul>
        </section>

        <section className="space-y-2 bg-card border border-border p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            2. Emergency Features & Geolocation Permissions
          </h2>
          <p>
            The Emergency SOS and National Helpline features utilize the browser Geolocation API strictly on user demand to assist the caregiver in identifying nearby clinics or sharing coordinates during an acute medical crisis. Location coordinates are never persisted on remote servers.
          </p>
        </section>

        <section className="space-y-2 bg-card border border-border p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            3. Regulatory Compliance
          </h2>
          <p>
            Sanjeevani adheres to the principles outlined in India's Digital Personal Data Protection Act (DPDPA 2023), ensuring purpose limitation, minimal data retention, and patient dignity.
          </p>
        </section>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-border/60">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Return to Dashboard
          </Button>
        </Link>
        <Link href="/resources">
          <Button size="sm" className="font-bold">
            View National Helplines
          </Button>
        </Link>
      </div>
    </div>
  );
}
