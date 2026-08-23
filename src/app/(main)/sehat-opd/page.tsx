'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Smartphone,
  UserPlus,
  Video,
  ExternalLink,
  ShieldCheck,
  Clock,
  FileText,
  Building2,
  CheckCircle2,
  PhoneCall,
  Activity,
  HeartPulse,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

export default function TeleconsultationPage() {
  const [activeTab, setActiveTab] = useState<'esanjeevani' | 'sehat'>('esanjeevani');

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
          <HeartPulse className="w-4 h-4" />
          <span>Government Telemedicine Services</span>
        </div>
        <h1 className="text-3xl font-bold font-headline">National Teleconsultation Hub</h1>
        <p className="text-muted-foreground text-sm">
          Access free, official government doctor consultations from home via <strong>eSanjeevani (MoHFW)</strong> and <strong>SeHAT OPD (MoD / ECHS)</strong>.
        </p>
      </div>

      {/* Service Selector Tabs */}
      <div className="flex p-1.5 bg-muted/60 rounded-2xl border border-border/60 gap-2 max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab('esanjeevani')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'esanjeevani'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>eSanjeevani (All Citizens)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sehat')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'sehat'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>SeHAT OPD (Defence & ECHS)</span>
        </button>
      </div>

      {/* TAB 1: eSanjeevani (MoHFW - All Citizens) */}
      {activeTab === 'esanjeevani' && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 shadow-xs overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default" className="text-[10px] uppercase font-bold tracking-wider">
                      Ministry of Health & Family Welfare (MoHFW)
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">Free 100% Digital</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold font-headline">
                    eSanjeevani — National Telemedicine Service
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Developed by C-DAC Mohali for the Government of India. Provides free doctor teleconsultations (General OPD, Geriatric Care, Non-Communicable Diseases, and Specialist OPDs) for any Indian citizen.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild className="gap-2 font-bold text-xs shadow-md">
                <Link
                  href="https://esanjeevani.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch eSanjeevani Web Portal</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 text-xs font-semibold bg-background">
                <Link
                  href="https://play.google.com/store/apps/details?id=in.gov.esanjeevaniopd.app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4 text-primary" />
                  <span>Download eSanjeevani App (Google Play)</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* eSanjeevani Step-by-Step Workflow */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                How to Consult a Doctor on eSanjeevani
              </CardTitle>
              <CardDescription className="text-xs">
                Follow these 4 simple steps to connect with a government medical officer or specialist.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    1
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground">Registration & Mobile OTP</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Enter your mobile number on the app/portal to receive an OTP. Select your state, enter patient details, and link your 14-digit ABHA (Ayushman Bharat Health Account) ID if available.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    2
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground">Select OPD & Generate Token</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Choose your State General OPD or Specialist clinic (e.g. Geriatric, Cardiology, Medicine). Upload past prescriptions or vital logs and receive your instant digital token.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    3
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground">Virtual Queue & Video Call</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Wait in the live virtual queue until a doctor accepts the token. When notified, join the high-definition video/audio consultation directly in your browser or app.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    4
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground">Digital E-Prescription</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Upon completing the call, download the digitally signed e-Prescription (eRx). It is legally recognized across India and valid at all Jan Aushadhi Kendras and retail pharmacies.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: SeHAT OPD (MoD - Defence & ECHS) */}
      {activeTab === 'sehat' && (
        <div className="space-y-6">
          <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-xs overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default" className="bg-emerald-700 hover:bg-emerald-800 text-[10px] uppercase font-bold tracking-wider">
                      Ministry of Defence (MoD)
                    </Badge>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-[10px]">
                      Tri-Services & ECHS
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold font-headline">
                    SeHAT OPD — Services e-Health Assistance & Teleconsultation
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Tri-Services teleconsultation platform for serving defence personnel, veterans, and Ex-Servicemen Contributory Health Scheme (ECHS) beneficiaries and their dependents.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild className="gap-2 font-bold text-xs bg-emerald-700 hover:bg-emerald-800 shadow-md">
                <Link
                  href="https://sehatopd.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch SeHAT Web Portal</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 text-xs font-semibold bg-background">
                <Link
                  href="https://play.google.com/store/apps/details?id=com.cdac.sehatopd"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download SeHAT App (Google Play)</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* SeHAT OPD Steps */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                How to Use SeHAT OPD for Defence & ECHS Families
              </CardTitle>
              <CardDescription className="text-xs">
                Armed Forces Medical Services (AFMS) teleconsultation and ECHS medicine delivery workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 font-bold text-sm">
                    A
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground">Service No. / ECHS Verification</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Register with your mobile OTP. Verify your beneficiary identity using your Service Number, ECHS Smart Card, or Aadhaar credentials.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 font-bold text-sm">
                    B
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground">Family Member Mapping</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Add and manage elderly parents, spouses, and dependent children under your verified primary service profile for teleconsultation booking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 font-bold text-sm">
                    C
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground">AFMS Doctor Video Call</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Connect live with military doctors and specialists from Armed Forces Medical Services for structured medical evaluation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 font-bold text-sm">
                    D
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground">ECHS Medicine Home Delivery</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Prescriptions generated on SeHAT can be seamlessly fulfilled with doorstep medicine delivery via linked ECHS polyclinics and authorised local chemists.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Consultation Prep Checklist */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Checklist Before Your Teleconsultation
          </CardTitle>
          <CardDescription className="text-xs">
            Prepare these 4 items to make the doctor&apos;s evaluation fast and clinically accurate.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>1. Vitals Log</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Have today&apos;s Blood Pressure, Pulse, and Blood Sugar ready from your Vital Logs.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>2. Current Medicines</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Keep all active medicine strips or your printable Clinical Brief within reach.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>3. Key Symptoms</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Note exact onset time, changes in sleep/appetite, or recent falls.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>4. Good Lighting</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Position camera in a quiet, well-lit room for clear physical inspection.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
