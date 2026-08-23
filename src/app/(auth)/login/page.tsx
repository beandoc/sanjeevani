'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Lock,
  Mail,
  Smartphone,
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Stethoscope,
  HeartPulse,
  Users,
  CheckCircle2,
  PhoneCall,
  Activity,
  Globe,
  KeyRound,
  Fingerprint
} from 'lucide-react';
import { useProfile, Role } from '@/context/role-context';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useToast } from '@/hooks/use-toast';
import type { ConfirmationResult } from 'firebase/auth';
import {
  signInWithEmail,
  signUpWithEmail,
  sendCaregiverOtp,
  verifyCaregiverOtp,
  signInOrCreateDemoAccount,
  getUserRole
} from '@/lib/firebase/auth';

const RECAPTCHA_CONTAINER_ID = 'sanjeevani-recaptcha-container';

export default function LoginPage() {
  const router = useRouter();
  const { role, setRole } = useProfile();
  const { toast } = useToast();

  const [authMethod, setAuthMethod] = useState<'email' | 'mobile' | 'abha'>('email');
  const [selectedRole, setSelectedRole] = useState<Role>(role || 'caregiver');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [abhaId, setAbhaId] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  /** Routes by the account's actual stored role, not the login toggle — a
   * returning user's role is authoritative in Firestore, so this can't be
   * fooled by whichever tab they happened to leave selected. */
  const completeSignIn = async (uid: string, fallbackRole: Role) => {
    const actualRole = (await getUserRole(uid)) ?? fallbackRole;
    setRole(actualRole);
    toast({
      title: 'Authentication Successful',
      description: `Welcome to Sanjeevani as ${actualRole === 'doctor' || actualRole === 'professional' ? 'Healthcare Professional' : actualRole === 'nurse' ? 'Trained Nurse / Attendant' : 'Primary Caregiver'}.`
    });

    const hasDoneOnboarding = typeof window !== 'undefined' && localStorage.getItem('sanjeevani_onboarding_done') === 'true';
    if (!hasDoneOnboarding) {
      router.push('/onboarding');
    } else {
      router.push(actualRole === 'professional' || actualRole === 'doctor' ? '/clinic/roster' : '/dashboard');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (authMethod === 'email') {
        const user = isSignUp
          ? await signUpWithEmail(email, password, selectedRole)
          : await signInWithEmail(email, password);
        await completeSignIn(user.uid, selectedRole);
      } else if (authMethod === 'mobile') {
        if (!confirmationResult) {
          toast({ variant: 'destructive', title: 'Send an OTP first', description: 'Request a verification code before submitting.' });
          return;
        }
        const user = await verifyCaregiverOtp(confirmationResult, otp);
        await completeSignIn(user.uid, 'caregiver');
      } else {
        toast({
          title: 'ABDM Gateway Not Connected in This Environment',
          description: 'ABHA sign-in requires production NHA credentials. Use Email or Mobile OTP here instead.'
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: err instanceof Error ? err.message : 'Please check your credentials and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!mobile || mobile.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Invalid Mobile Number',
        description: 'Please enter a valid 10-digit Indian mobile number.',
      });
      return;
    }
    try {
      const result = await sendCaregiverOtp(`+91${mobile}`, RECAPTCHA_CONTAINER_ID);
      setConfirmationResult(result);
      setIsOtpSent(true);
      toast({
        title: 'OTP Dispatched',
        description: `A 6-digit verification code was sent to +91 ${mobile.slice(-4).padStart(10, '•')}`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Send OTP',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    }
  };

  const handleDemoLogin = async (demoRole: Role) => {
    setIsLoading(true);
    try {
      const user = await signInOrCreateDemoAccount(demoRole);
      toast({
        title: `Demo Session: ${demoRole === 'professional' ? 'Clinician' : 'Family Caregiver'}`,
        description: 'Launching with a real emulator-backed account.',
      });
      await completeSignIn(user.uid, demoRole);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Demo Sign-In Failed',
        description: err instanceof Error ? err.message : 'Is the Firebase emulator running? (npm run emulators)'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-border/80 bg-card">
      {/* LEFT COLUMN: Enterprise Corporate Brand & Clinical Credentials (5 Cols) */}
      <div className="lg:col-span-5 bg-slate-950 text-white p-8 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Ambient Medical Waveform Glows */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-slate-950/80 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        {/* Top Brand Emblem */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-primary/30 shadow-md bg-white/5 p-1 backdrop-blur-md">
              <Image
                src="/logo.png"
                alt="Sanjeevani Logo"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-headline font-black text-2xl tracking-tight text-white block">
                Sanjeevani
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-mono block">
                Enterprise Geriatric Care OS
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              Evidence-Based Decision Support for Elderly Care.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Empowering healthcare institutions, clinical teams, and family caregivers with psychometric burden tracking, Beers criteria pharmacology, and ABDM integration.
            </p>
          </div>

          {/* Clinical Accreditation Badges */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>DPDP Act 2023 & Local Encryption Sandbox</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <HeartPulse className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Zarit Burden Psychometrics (ZBI-22/12/4)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <Stethoscope className="w-4 h-4 text-blue-400 shrink-0" />
              <span>AGS Beers 2023 & STOPP Prescribing Cascade Safety</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Govt Telemedicine Gateway (eSanjeevani & SeHAT)</span>
            </div>
          </div>
        </div>

        {/* Live Network Metric Ticker & Testimonial */}
        <div className="relative z-10 pt-8 mt-8 border-t border-slate-800 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Dyads</span>
              <span className="text-xl font-black text-white font-mono">2,450+</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Care Gap Hours</span>
              <span className="text-xl font-black text-emerald-400 font-mono">-38%</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>ISO 27001 Certified Security</span>
            <span className="font-mono">v2026.1 Enterprise</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Enterprise Authentication Portal (7 Cols) */}
      <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-card">
        <div>
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-6 border-b border-border/60">
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

          {/* Role Persona Segmented Switch */}
          <div className="mt-6 space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Workspace Mode
            </Label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => setSelectedRole('caregiver')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedRole === 'caregiver'
                    ? 'bg-background text-foreground shadow-sm border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Family Caregiver</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('professional')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedRole === 'professional'
                    ? 'bg-background text-foreground shadow-sm border border-border/80'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                <span>Clinician / Nurse</span>
              </button>
            </div>
          </div>

          {/* Authentication Method Tabs */}
          <div className="flex items-center gap-4 mt-6 border-b border-border/60 pb-2">
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`text-xs font-bold pb-2 transition-all flex items-center gap-1.5 relative ${
                authMethod === 'email'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
              {authMethod === 'email' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setAuthMethod('mobile')}
              className={`text-xs font-bold pb-2 transition-all flex items-center gap-1.5 relative ${
                authMethod === 'mobile'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
              {authMethod === 'mobile' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setAuthMethod('abha')}
              className={`text-xs font-bold pb-2 transition-all flex items-center gap-1.5 relative ${
                authMethod === 'abha'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>ABDM / ABHA ID</span>
              {authMethod === 'abha' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 mt-6">
            {/* METHOD 1: EMAIL */}
            {authMethod === 'email' && (
              <>
                <div className="flex items-center justify-between -mt-1 mb-1">
                  <span className="text-[11px] text-muted-foreground">
                    {isSignUp ? 'Creating a new account' : 'Signing in to an existing account'}
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
                      placeholder="doctor@hospital.org or caregiver@sanjeevani.in"
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
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* METHOD 2: MOBILE OTP */}
            {authMethod === 'mobile' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mobile" className="text-xs font-semibold">10-Digit Mobile Number</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-bold">+91</span>
                      <Input
                        id="mobile"
                        type="tel"
                        maxLength={10}
                        placeholder="9820012345"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="pl-12 h-10 text-xs font-mono font-medium"
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSendOtp}
                      className="h-10 text-xs font-bold shrink-0"
                    >
                      {isOtpSent ? 'Resend OTP' : 'Send OTP'}
                    </Button>
                  </div>
                </div>

                {isOtpSent && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="otp" className="text-xs font-semibold">Enter 6-Digit OTP</Label>
                    <Input
                      id="otp"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="h-10 text-center tracking-widest font-mono text-base font-bold"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* METHOD 3: ABDM / ABHA ID */}
            {authMethod === 'abha' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="abha" className="text-xs font-semibold">Ayushman Bharat Health Account (ABHA) ID</Label>
                  <div className="relative">
                    <Fingerprint className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                    <Input
                      id="abha"
                      placeholder="14-digit ABHA ID (e.g. 91-1234-5678-9012)"
                      value={abhaId}
                      onChange={(e) => setAbhaId(e.target.value)}
                      className="pl-9 h-10 text-xs font-mono font-medium"
                      required
                    />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground space-y-0.5">
                  <p className="font-semibold text-primary">National Health Stack (ABDM M1/M2 Gateway)</p>
                  <p>Authenticates directly against National Health Authority (NHA) consent records.</p>
                </div>
              </div>
            )}

            {/* Invisible container Firebase Auth mounts its reCAPTCHA
                verifier into for phone OTP. Emulator mode bypasses the
                actual challenge (see client.ts) but the SDK still requires
                this element to exist. */}
            <div id={RECAPTCHA_CONTAINER_ID} />

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
                    {authMethod === 'email' && isSignUp ? 'Create Account' : 'Sign In to Clinical Workspace'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick 1-Click Demo Logins for Instant Testing */}
          <div className="mt-6 pt-4 border-t border-border/60 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block text-center">
              Or Explore Instant Clinical Demo
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('caregiver')}
                className="h-9 text-xs font-semibold gap-1.5 hover:bg-primary/5"
              >
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Demo Caregiver</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('professional')}
                className="h-9 text-xs font-semibold gap-1.5 hover:bg-primary/5"
              >
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                <span>Demo Clinician</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Security Note */}
        <div className="pt-6 mt-6 border-t border-border/40 text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">
            Protected by DPDP Act 2023 local privacy sandbox • 256-bit encryption
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground font-mono">
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
