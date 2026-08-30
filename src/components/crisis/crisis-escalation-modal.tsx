'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  PhoneCall,
  HeartHandshake,
  MapPin,
  Share2,
  Users,
  ExternalLink,
  Hospital,
  Ambulance,
  Pill,
  Store,
  Navigation,
  Home,
  Copy
} from 'lucide-react';
import { HealthRepository, EmergencyContact, PatientDependenceProfile } from '@/lib/db/health-repository';
import { useToast } from '@/hooks/use-toast';

interface NearbyResourceSearch {
  label: string;
  query: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}

const nearbyResourceSearches: NearbyResourceSearch[] = [
  {
    label: 'Medical Stores',
    query: 'medical stores pharmacy near',
    icon: Pill,
    accentClass: 'text-emerald-700 border-emerald-500/40 hover:bg-emerald-600 hover:text-white'
  },
  {
    label: 'Wholesale Stockists',
    query: 'wholesale medical stockist surgical supplier near',
    icon: Store,
    accentClass: 'text-sky-700 border-sky-500/40 hover:bg-sky-600 hover:text-white'
  },
  {
    label: 'Hospitals',
    query: 'hospitals emergency near',
    icon: Hospital,
    accentClass: 'text-rose-700 border-rose-500/40 hover:bg-rose-600 hover:text-white'
  },
  {
    label: 'Ambulance Services',
    query: 'ambulance service near',
    icon: Ambulance,
    accentClass: 'text-red-700 border-red-500/40 hover:bg-red-600 hover:text-white'
  },
  {
    label: 'Diagnostic Labs',
    query: 'diagnostic lab home collection near',
    icon: Navigation,
    accentClass: 'text-violet-700 border-violet-500/40 hover:bg-violet-600 hover:text-white'
  },
  {
    label: 'Home Nursing',
    query: 'home nursing attendant caregiver service near',
    icon: HeartHandshake,
    accentClass: 'text-teal-700 border-teal-500/40 hover:bg-teal-600 hover:text-white'
  }
];

interface CrisisEscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  severityReason?: string;
  isSelfHarmBranch?: boolean;
}

export function CrisisEscalationModal({
  isOpen,
  onClose,
  severityReason = 'Severe Caregiver Burden & Distress Threshold Exceeded',
  isSelfHarmBranch = false,
}: CrisisEscalationModalProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [patientProfile, setPatientProfile] = useState<PatientDependenceProfile | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setContacts(HealthRepository.getEmergencyContacts());
      setPatientProfile(HealthRepository.getPatientProfile());
      fetchLocation();
    }
  }, [isOpen]);

  const fetchLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      }
    );
  };

  const handleBroadcastCareCircle = () => {
    const primaryContacts = contacts.filter((c) => c.notifyOnCrisis);
    const homeAddress = patientProfile?.homeCareAddress?.trim();
    const locationText = homeAddress
      ? `\nPatient Home Nursing Address: ${homeAddress}\nMaps: ${buildMapsUrl('home nursing location', homeAddress)}`
      : coords
      ? `\nCurrent GPS Location: https://www.google.com/maps?q=${coords.lat},${coords.lng}`
      : '';

    const message = `URGENT CARE SUPPORT REQUEST via Sanjeevani App\n\nI am experiencing severe caregiver distress and need immediate support for our patient.\n\nPlease contact me or step in as soon as possible.${locationText}\n\nSent via Sanjeevani Caregiver Decision Support.`;

    if (navigator.share) {
      navigator
        .share({
          title: 'Sanjeevani Caregiver Crisis Alert',
          text: message,
        })
        .catch(() => {});
    } else {
      // Fallback: Open WhatsApp with first primary contact or copy to clipboard
      const primaryPhone = primaryContacts[0]?.phone || '';
      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
      navigator.clipboard?.writeText(message);
      toast({
        title: 'Crisis Alert Prepared',
        description: 'Alert message copied to clipboard and WhatsApp broadcast opened.',
      });
    }
  };

  const locationSetpoint =
    patientProfile?.homeCareAddress?.trim() ||
    (coords ? `${coords.lat},${coords.lng}` : '');

  const locationLabel = patientProfile?.homeCareAddress?.trim()
    ? 'Patient home nursing address'
    : coords
    ? 'Current GPS location'
    : 'No location set';

  const buildMapsUrl = (query: string, location: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query} ${location}`)}`;
  };

  const handleCopyLocation = async () => {
    if (!locationSetpoint) return;
    try {
      await navigator.clipboard?.writeText(locationSetpoint);
      toast({
        title: 'Location Copied',
        description: 'Care location copied for sharing with a pharmacy, ambulance, or hospital.'
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Could Not Copy Location',
        description: 'Please select and copy the address manually.'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-destructive/30 shadow-2xl">
        {/* Header Alert Strip */}
        <div className="bg-destructive/10 border-b border-destructive/20 p-5 flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-destructive text-destructive-foreground shadow-md shrink-0 mt-0.5 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-wider">
                Support Escalation
              </Badge>
              {isSelfHarmBranch && (
                <Badge className="bg-amber-600 text-white text-[10px] font-bold uppercase">
                  Distress Screening Active
                </Badge>
              )}
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold font-headline text-foreground">
              Immediate Caregiver Support Options
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {severityReason}. You do not have to carry this burden alone. Use locally verified emergency, mental-health, senior-care, or family support now.
            </DialogDescription>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Compassionate Clinical Note */}
          <div className="p-3.5 rounded-2xl bg-muted/50 border border-border text-xs text-foreground leading-relaxed flex items-start gap-2.5">
            <HeartHandshake className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <strong>Clinical Compassion Note:</strong> Chronic caregiving frequently causes intense emotional exhaustion, isolation, and acute distress. Reaching out for professional or family help is an act of care for both you and your loved one.
            </div>
          </div>

          {/* 1. Verified Live Helplines */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Locally Verified Emergency & Support Contacts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a href="tel:14416" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-between h-12 rounded-xl border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs"
                >
                  <span className="flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5" /> Tele-MANAS (Mental Health)
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-primary/10 px-2 py-0.5 rounded">14416</span>
                </Button>
              </a>

              <a href="tel:18005990019" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-between h-12 rounded-xl border-border text-foreground hover:bg-muted font-bold text-xs"
                >
                  <span className="flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5" /> KIRAN Helpline
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded">1800-599-0019</span>
                </Button>
              </a>

              <a href="tel:14567" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-between h-12 rounded-xl border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white font-bold text-xs"
                >
                  <span className="flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5" /> Elder Line (Senior Care)
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded">14567</span>
                </Button>
              </a>

              <a href="tel:112" className="block">
                <Button
                  variant="destructive"
                  className="w-full justify-between h-12 rounded-xl font-bold text-xs shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5" /> National Emergency
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded">112</span>
                </Button>
              </a>
            </div>
          </div>

          {/* 2. Nearby Care Resources */}
          <div className="space-y-2.5 pt-2 border-t border-border/70">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                2. Nearby Care Resources
              </h4>
              <Badge variant={locationSetpoint ? 'secondary' : 'outline'} className="text-[10px] font-mono">
                {isLocating ? 'Locating...' : locationLabel}
              </Badge>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Home className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-foreground">Location setpoint</p>
                  <p className="text-[11px] text-muted-foreground break-words">
                    {locationSetpoint || 'Add the patient home nursing address in onboarding or Settings to make local searches more precise.'}
                  </p>
                </div>
                {locationSetpoint && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLocation}
                    className="h-8 w-8 p-0 shrink-0"
                    aria-label="Copy care location"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {nearbyResourceSearches.map((resource) => {
                const Icon = resource.icon;
                const href = buildMapsUrl(resource.query, locationSetpoint || 'near me');
                return (
                  <a key={resource.label} href={href} target="_blank" rel="noreferrer" className="block">
                    <Button
                      variant="outline"
                      className={`w-full justify-between h-11 rounded-xl font-bold text-xs ${resource.accentClass}`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{resource.label}</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </Button>
                  </a>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Google Maps results show public names, hours, directions, and listed phone numbers where available. Use the phone icon in Maps to place a cellular call from the device.
            </p>
          </div>

          {/* 3. Care Circle SOS Broadcast */}
          <div className="space-y-2.5 pt-2 border-t border-border/70">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              3. Notify Configured Care Circle ({contacts.length} Contacts)
            </h4>

            <Button
              onClick={handleBroadcastCareCircle}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs gap-2 shadow-md"
            >
              <Share2 className="w-4 h-4" />
                  <span>Send Urgent WhatsApp / SMS Broadcast to Care Circle</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/30 border-t border-border flex items-center justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl text-xs font-semibold">
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
