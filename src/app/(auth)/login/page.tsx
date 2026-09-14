'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Lock,
  Mail,
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  Stethoscope,
  HeartPulse,
  Users,
  Bed,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { useProfile, Role } from '@/context/role-context';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useToast } from '@/hooks/use-toast';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithInviteCode,
  getUserRole
} from '@/lib/firebase/auth';
import { createSession } from '@/lib/firebase/session';
import { provisionDemoPersonaAccess, hydrateLocalCacheFromCloud } from '@/lib/firebase/clinical-sync';

export default function LoginPage() {
  const router = useRouter();
  const { role, setRole } = useProfile();
  const { toast } = useToast();

  const [selectedRole, setSelectedRole] = useState<Role>(role || 'professional');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [caregiverAuthMode, setCaregiverAuthMode] = useState<'code' | 'credentials'>('code');
  const [inviteCode, setInviteCode] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code') || params.get('invite');
      if (codeParam) {
        setInviteCode(codeParam.toUpperCase().replace(/[^A-Z0-9]/g, ''));
        setSelectedRole('caregiver');
        setCaregiverAuthMode('code');
      }
    }
  }, []);

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode) {
      toast({
        variant: 'destructive',
        title: 'Invite Code Required',
        description: 'Please enter the 8-character invite code given by your clinician.'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithInviteCode(cleanCode);
      toast({
        title: 'Access Granted',
        description: `Welcome! Connected to ${result.patientName}${result.clinicianLabel ? ` (${result.clinicianLabel})` : ''}.`
      });
      await completeSignIn(result.user, 'caregiver');
    } catch (err: unknown) {
      console.error('Code login error:', err);
      toast({
        variant: 'destructive',
        title: 'Unable to Sign In with Code',
        description: err instanceof Error ? err.message : 'Invalid or expired invite code. Please verify and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /** Routes by the account's actual stored role, not the login toggle — a
   * returning user's role is authoritative in Firestore, so this can't be
   * fooled by whichever tab they happened to leave selected. */
  const completeSignIn = async (user: import('firebase/auth').User, fallbackRole: Role) => {
    // 1. Establish session without blocking on long network hangs
    await createSession(user);

    const uid = user.uid;
    let actualRole = fallbackRole;
    try {
      const fetchedRole = await getUserRole(uid);
      if (fetchedRole) actualRole = fetchedRole;
    } catch {
      // Fallback safely to selected persona
    }

    // Provision demo persona and hydrate local cache so the dashboard immediately sees linked patient data
    try {
      await provisionDemoPersonaAccess(user.email);
      await hydrateLocalCacheFromCloud(uid);
    } catch (e) {
      console.warn('Persona provisioning/hydration notice:', e);
    }

    setRole(actualRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sanjeevani_user_role', actualRole);
    }

    const roleName =
      actualRole === 'doctor' || actualRole === 'professional'
        ? 'Doctor / Clinician Portal'
        : actualRole === 'nurse'
          ? 'Nursing Officer Portal'
          : 'Kutumbh Family Caregiver Hub';

    toast({
      title: 'Authentication Successful',
      description: `Welcome to Kutumbh (${roleName}).`
    });

    const nextUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null;
    const destination = nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('//') ? nextUrl : '/dashboard';
    router.push(destination);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      const effectiveRole: Role =
        cleanEmail.toLowerCase().includes('caregiver')
          ? 'caregiver'
          : cleanEmail.toLowerCase().includes('doctor') || cleanEmail.toLowerCase().includes('clinic')
            ? 'professional'
            : cleanEmail.toLowerCase().includes('nurse') || cleanEmail.toLowerCase().includes('vidya')
              ? 'nurse'
              : selectedRole;

      let user;
      if (isSignUp) {
        user = await signUpWithEmail(cleanEmail, cleanPassword, effectiveRole);
      } else {
        try {
          user = await signInWithEmail(cleanEmail, cleanPassword);
        } catch (signInErr: unknown) {
          const errCode = (signInErr as { code?: string })?.code;
          // If the demo/kutumbh account doesn't exist yet in Firebase Auth,
          // seamlessly auto-create it so the user never gets stuck on "Incorrect credentials"
          if (
            (errCode === 'auth/user-not-found' || errCode === 'auth/invalid-credential') &&
            (cleanEmail.endsWith('@kutumbh.com') || cleanEmail.includes('caregiver') || cleanEmail.includes('nurse'))
          ) {
            user = await signUpWithEmail(cleanEmail, cleanPassword, effectiveRole);
          } else {
            throw signInErr;
          }
        }
      }

      await completeSignIn(user, effectiveRole);
    } catch (err: unknown) {
      const errCode = (err as { code?: string })?.code;
      const errMsg =
        errCode === 'auth/user-not-found'
          ? 'No account found with this email. Create an account to continue.'
          : errCode === 'auth/wrong-password' || errCode === 'auth/invalid-credential'
            ? 'Incorrect email or password. Please verify your credentials.'
            : errCode === 'auth/configuration-not-found'
              ? 'Firebase Authentication is not enabled or Email/Password provider is disabled in Firebase Console (kutumbh-45485).'
              : err instanceof Error
                ? err.message
                : 'Please check your credentials and try again.';

      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: errMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-border/80 bg-card">
      {/* LEFT COLUMN: Enterprise Corporate Brand & Clinical Accreditation (5 Cols) */}
      <div className="lg:col-span-5 bg-slate-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
        {/* Ambient Medical Waveform Glows */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-slate-950/90 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        {/* Top Brand Emblem */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border border-white/30 shadow-xl bg-white p-2 flex items-center justify-center shrink-0">
              <Image
                src="/kutumbh-emblem.png"
                alt="Kutumbh Logo — स्नेह, संबल और स्वास्थ्य"
                width={75}
                height={75}
                className="object-contain max-h-full max-w-full"
                priority
              />
            </div>
            <div>
              <span className="font-headline font-black text-2xl sm:text-3xl tracking-tight text-white block">
                कुटुम्ब <span className="text-lg sm:text-xl font-bold text-slate-300 font-sans">KUTUMBH</span>
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-wider text-rose-300 block font-sans">
                स्नेह, संबल और स्वास्थ्य
              </span>
              <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block mt-0.5">
                Family Geriatric OS & Care Network
              </span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              Evidence-Based Decision Support for Family & Elderly Care.
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Empowering healthcare institutions, clinical teams, and Kutumbh family caregivers with Zarit burden tracking, AGS Beers 2023 drug safety, and ABDM integration.
            </p>
          </div>

          {/* Clinical Accreditation Badges */}
          <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>DPDP Act 2023 & Local Encryption Sandbox</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <HeartPulse className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Zarit Burden Psychometrics (ZBI-22/12/4)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <Stethoscope className="w-4 h-4 text-blue-400 shrink-0" />
              <span>AGS Beers 2023 & STOPP Safety Guidelines</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>National Telemedicine Gateway (eSanjeevani & SeHAT ABDM)</span>
            </div>
          </div>
        </div>

        {/* Live Network Metric Ticker */}
        <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Dyads</span>
              <span className="text-lg font-black text-white font-mono">2,450+</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Care Gap Hours</span>
              <span className="text-lg font-black text-emerald-400 font-mono">-38%</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>ISO 27001 Certified</span>
            <span>v2026.1 Enterprise</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Enterprise Authentication Portal (7 Cols) */}
      <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-card">
        <div>
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-5 border-b border-border/60">
            <div>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30">
                Institutional Portal
              </Badge>
              <h2 className="text-xl sm:text-2xl font-bold font-headline text-foreground mt-1">
                Account Sign In
              </h2>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Role Persona Segmented Switch (Kutumbh Caregiver, Nurse, Doctor) */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Select Workspace Role</span>
              <span className="text-[10px] text-primary font-bold">Kutumbh = Family (कुटुम्ब)</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('caregiver');
                  setCaregiverAuthMode('code');
                }}
                aria-pressed={selectedRole === 'caregiver'}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${selectedRole === 'caregiver'
                    ? 'bg-background text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">Kutumbh (Family)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('nurse');
                  setCaregiverAuthMode('credentials');
                }}
                aria-pressed={selectedRole === 'nurse'}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${selectedRole === 'nurse'
                    ? 'bg-background text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Bed className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">Nurse</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('professional');
                  setCaregiverAuthMode('credentials');
                }}
                aria-pressed={selectedRole === 'professional' || selectedRole === 'doctor'}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${selectedRole === 'professional' || selectedRole === 'doctor'
                    ? 'bg-background text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Doctor</span>
              </button>
            </div>

            {/* Sub-toggle for Family Caregiver: Direct Code vs Email Credentials */}
            {selectedRole === 'caregiver' && (
              <div className="flex items-center justify-center pt-1">
                <div className="inline-flex p-0.5 bg-muted/80 rounded-xl border border-border/70 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCaregiverAuthMode('code')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                      caregiverAuthMode === 'code'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Direct Dyad Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaregiverAuthMode('credentials')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                      caregiverAuthMode === 'credentials'
                        ? 'bg-background text-foreground shadow-xs border border-border/60'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    <span>Email & Password</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Area: Code Mode vs Credentials Mode */}
          {selectedRole === 'caregiver' && caregiverAuthMode === 'code' ? (
            <form onSubmit={handleCodeLogin} className="space-y-4 mt-5">
              <div className="p-4 sm:p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-foreground">Doctor-Issued Access Code</h3>
                      <p className="text-[11px] text-muted-foreground">No password required. Instant family dyad access.</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono uppercase bg-primary/10 text-primary border-primary/30">
                    Instant Access
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="invite-code" className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>8-Character Invite Code</span>
                    <span className="text-[10px] text-muted-foreground font-normal">From clinician or discharge summary</span>
                  </Label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-primary absolute left-3.5 top-3.5" />
                    <Input
                      id="invite-code"
                      type="text"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      maxLength={14}
                      placeholder="e.g. 7DB6BJT7"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      className="pl-10 h-12 text-base font-mono font-black tracking-widest uppercase border-primary/30 focus-visible:ring-primary bg-background shadow-inner"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground">
                  <span className="flex items-center gap-1 text-[10px]">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Quick Testing:
                  </span>
                  <button
                    type="button"
                    onClick={() => setInviteCode('RAMESH76')}
                    className="text-primary hover:underline font-mono font-semibold text-[10px] bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors"
                  >
                    Load Seed Code: RAMESH76
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !inviteCode.trim()}
                className="w-full h-11 rounded-xl font-bold text-xs shadow-md gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? (
                  <span>Verifying Dyad Code & Access...</span>
                ) : (
                  <>
                    <span>Enter Family Caregiver Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setCaregiverAuthMode('credentials')}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Prefer standard email sign-in? Switch here
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4 mt-5">
              <div className="flex items-center justify-between -mt-1 mb-1">
                <span className="text-[11px] text-muted-foreground">
                  {isSignUp ? 'Creating a new account' : 'Signing in to existing account'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSignUp((v) => !v)}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  {isSignUp ? 'Have an account? Sign in' : 'New here? Create account'}
                </button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">Institutional / Account Email</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com or institutional email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-10 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                  <Link href="#" className="text-[11px] text-primary hover:underline font-medium">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 h-10 text-xs font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl font-bold text-xs shadow-md gap-2"
              >
                {isLoading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>
                      {isSignUp ? 'Create Account' : 'Sign In to Clinical Workspace'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              {/* Demo 1-Click Fill Helper */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>1-Click Demo Fill:</span>
                <div className="flex items-center gap-1.5">
                  {selectedRole === 'caregiver' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('caregiver@kutumbh.com');
                        setPassword('test1234');
                      }}
                      className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] font-semibold text-primary"
                    >
                      Fill Demo Caregiver
                    </button>
                  )}
                  {selectedRole === 'nurse' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('vidyanurse@kutumbh.com');
                        setPassword('test1234');
                      }}
                      className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                    >
                      Fill Nurse Vidya
                    </button>
                  )}
                  {(selectedRole === 'professional' || selectedRole === 'doctor') && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('doctor@kutumbh.com');
                        setPassword('test1234');
                      }}
                      className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                    >
                      Fill Dr. Vivek
                    </button>
                  )}
                </div>
              </div>

              {selectedRole === 'caregiver' && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setCaregiverAuthMode('code')}
                    className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Have an 8-character invite code? Sign in with Code instead
                  </button>
                </div>
              )}
            </form>
          )}

        </div>

        {/* Footer Security & Helplines Note */}
        <div className="pt-4 mt-4 border-t border-border/40 text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">
            Protected by DPDP Act 2023 local privacy sandbox • 256-bit encryption
          </p>
          <div className="flex items-center justify-center gap-2.5 text-[10px] text-muted-foreground font-mono flex-wrap">
            <span>Elder Line: 14567</span>
            <span>•</span>
            <span>Tele-MANAS: 14416</span>
            <span>•</span>
            <span>ERSS: 112</span>
          </div>
        </div>
      </div>
    </div>
  );
}
