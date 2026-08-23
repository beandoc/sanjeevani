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
  AlertTriangle,
  Users,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { HealthRepository, EmergencyContact } from '@/lib/db/health-repository';
import { useToast } from '@/hooks/use-toast';

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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setContacts(HealthRepository.getEmergencyContacts());
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
    const locationText = coords
      ? `\nMy Current GPS Location: https://www.google.com/maps?q=${coords.lat},${coords.lng}`
      : '';

    const message = `🚨 *URGENT CARE CRISIS ALERT via Sanjeevani App* 🚨\n\nI am currently experiencing severe caregiver distress and need immediate support for our patient.\n\nPlease contact me or step in as soon as possible.${locationText}\n\nSent via Sanjeevani Caregiver Decision Support.`;

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-destructive/30 shadow-2xl">
        {/* Header Alert Strip */}
        <div className="bg-destructive/10 border-b border-destructive/20 p-5 flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-destructive text-destructive-foreground shadow-md shrink-0 mt-0.5 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-wider">
                Clinical Crisis Protocol
              </Badge>
              {isSelfHarmBranch && (
                <Badge className="bg-amber-600 text-white text-[10px] font-bold uppercase">
                  Distress Screening Active
                </Badge>
              )}
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold font-headline text-foreground">
              Immediate Caregiver Crisis Escalation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {severityReason}. You do not have to carry this burden alone. Connect immediately with 24x7 verified Indian support helplines.
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
              1. 24x7 National Clinical & Mental Health Helplines
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

          {/* 2. Care Circle SOS Broadcast */}
          <div className="space-y-2.5 pt-2 border-t border-border/70">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                2. Notify Configured Care Circle ({contacts.length} Contacts)
              </h4>
              {coords && (
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> GPS Ready
                </span>
              )}
            </div>

            <Button
              onClick={handleBroadcastCareCircle}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs gap-2 shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>Send SOS WhatsApp / SMS Broadcast to Care Circle</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/30 border-t border-border flex items-center justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl text-xs font-semibold">
            Dismiss Protocol
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
