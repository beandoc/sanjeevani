'use client';

import React, { useState } from 'react';
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
  Smartphone,
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  Stethoscope,
  HeartPulse,
  Users,
  Fingerprint,
  Bed
} from 'lucide-react';
import { useProfile, Role } from '@/context/role-context';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useToast } from '@/hooks/use-toast';
import {
  signInWithEmail,
  signUpWithEmail,
  sendCaregiverOtp,
  verifyCaregiverOtp,
  getUserRole,
  type ConfirmationResult
} from '@/lib/firebase/auth';
import { createSession } from '@/lib/firebase/session';
import { provisionDemoPersonaAccess } from '@/lib/firebase/clinical-sync';

const RECAPTCHA_CONTAINER_ID = 'sanjeevani-recaptcha-container';

export default function LoginPage() {
  const router = useRouter();
  const { role, setRole } = useProfile();
  const { toast } = useToast();

  const [authMethod, setAuthMethod] = useState<'email' | 'mobile' | 'abha'>('email');
  const [selectedRole, setSelectedRole] = useState<Role>(role || 'professional');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [abhaId, setAbhaId] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

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

    // Provision demo persona in background so network latency never blocks login
    void provisionDemoPersonaAccess(user.email).catch(() => {});

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
      if (authMethod === 'email') {
        const user = isSignUp
          ? await signUpWithEmail(cleanEmail, cleanPassword, selectedRole)
          : await signInWithEmail(cleanEmail, cleanPassword);

        const effectiveRole: Role =
          cleanEmail.toLowerCase().includes('doctor') || cleanEmail.toLowerCase().includes('clinic')
            ? 'professional'
            : cleanEmail.toLowerCase().includes('nurse') || cleanEmail.toLowerCase().includes('vidya')
              ? 'nurse'
              : selectedRole;

        await completeSignIn(user, effectiveRole);
      } else if (authMethod === 'mobile') {
        if (!confirmationResult) {
          toast({ variant: 'destructive', title: 'Send an OTP first', description: 'Request a verification code before submitting.' });
          return;
        }
        const { user, linkedInvite } = await verifyCaregiverOtp(confirmationResult, otp);
        if (linkedInvite) {
          toast({
            title: 'Linked to Your Doctor',
            description: `${linkedInvite.patientName}'s details are ready — no invite code needed.`
          });
        }
        await completeSignIn(user, 'caregiver');
      } else {
        toast({
          title: 'ABDM Gateway Not Connected in This Environment',
          description: 'ABHA sign-in requires production NHA credentials. Use Email or Mobile OTP here instead.'
        });
      }
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
    } catch (err: unknown) {
      const errCode = (err as { code?: string })?.code;
      toast({
        variant: 'destructive',
        title: 'Could Not Send OTP',
        description:
          errCode === 'auth/configuration-not-found'
            ? 'Phone Authentication is not enabled in Firebase Console (kutumbh-45485).'
            : err instanceof Error
              ? err.message
              : 'Please try again.'
      });
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
          <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select Active Persona / Portal
              </Label>
              <span className="text-[10px] text-primary font-bold">Kutumbh = Family (कुटुम्ब)</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => setSelectedRole('caregiver')}
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
                onClick={() => setSelectedRole('nurse')}
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
                onClick={() => setSelectedRole('professional')}
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
          </div>

          {/* Authentication Method Tabs */}
          <div className="flex items-center gap-4 mt-5 border-b border-border/60 pb-2">
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              aria-pressed={authMethod === 'email'}
              className={`text-xs font-bold pb-2 transition-all flex items-center gap-1.5 relative ${authMethod === 'email'
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
              aria-pressed={authMethod === 'mobile'}
              className={`text-xs font-bold pb-2 transition-all flex items-center gap-1.5 relative ${authMethod === 'mobile'
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
              aria-pressed={authMethod === 'abha'}
              className={`text-xs font-bold pb-2 transition-all flex items-center gap-1.5 relative ${authMethod === 'abha'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>ABDM / ABHA</span>
              {authMethod === 'abha' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 mt-5">
            {/* METHOD 1: EMAIL */}
            {authMethod === 'email' && (
              <>
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
                        inputMode="tel"
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
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
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
