'use client';

/**
 * The only UI through which identifiable care-plan content leaves the app.
 *
 * Both the clinician matrix and the family Care Circle page mount this component; neither builds
 * export text itself. Every path (copy, WhatsApp deep link, .ics download) goes through
 * `prepareConsentedExport`, which refuses without consent + confirmed recipient + sufficient data,
 * and every successful export is written to the dyad's audit log.
 */

import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Copy, Download, ExternalLink, Share2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CaregiverAttributes, CareGapEvaluationResult, PatientDependenceProfile } from '@/lib/clinical/care-gap-engine';
import {
  buildExportAuditEntry,
  evaluateExportGate,
  prepareConsentedExport,
  whatsAppShareUrl,
  type ExportAuditEntry,
  type ExportChannel,
  type ExportConsentContext
} from '@/lib/sharing/consented-export';
import { recordExportAuditFor } from '@/lib/firebase/clinical-sync';

export interface ConsentedExportDialogsProps {
  patientUid: string;
  caregiver: CaregiverAttributes;
  patient: PatientDependenceProfile;
  evaluation: CareGapEvaluationResult | null | undefined;
  /** From `verifyClinicalAuthorization`; drives the "authorized / draft" header in the export. */
  authorization: { planAuthorized: boolean; emergencyVerified: boolean };
  actor: { uid: string | null; role: ExportAuditEntry['exportedByRole'] };
  whatsAppOpen: boolean;
  onWhatsAppOpenChange: (open: boolean) => void;
  calendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
}

const CONSENT_COPY: Record<'whatsapp' | 'calendar', { consent: string; recipient: string }> = {
  whatsapp: {
    consent:
      'The patient and caregiver have given informed consent for their home-care details to be sent over external messaging.',
    recipient: 'I have checked that the destination is the authorised family care group, not a public or unrelated chat.'
  },
  calendar: {
    consent:
      'The family has consented to shift rotations, respite days and emergency contacts being exported to an external calendar.',
    recipient: 'I have confirmed which calendar account this file will be imported into.'
  }
};

export function ConsentedExportDialogs({
  patientUid,
  caregiver,
  patient,
  evaluation,
  authorization,
  actor,
  whatsAppOpen,
  onWhatsAppOpenChange,
  calendarOpen,
  onCalendarOpenChange
}: ConsentedExportDialogsProps) {
  const { toast } = useToast();

  const [waConsent, setWaConsent] = useState(false);
  const [waRecipientConfirmed, setWaRecipientConfirmed] = useState(false);
  const [waRecipientLabel, setWaRecipientLabel] = useState('');
  const [waRedact, setWaRedact] = useState(true);

  const [calConsent, setCalConsent] = useState(false);
  const [calRecipientConfirmed, setCalRecipientConfirmed] = useState(false);
  const [calRecipientLabel, setCalRecipientLabel] = useState('');
  const [calRedact, setCalRedact] = useState(true);

  const waCtx: ExportConsentContext = {
    consentGiven: waConsent,
    recipientConfirmed: waRecipientConfirmed,
    recipientLabel: waRecipientLabel,
    redactIdentifiers: waRedact
  };
  const calCtx: ExportConsentContext = {
    consentGiven: calConsent,
    recipientConfirmed: calRecipientConfirmed,
    recipientLabel: calRecipientLabel,
    redactIdentifiers: calRedact
  };

  const waGate = evaluateExportGate(waCtx, evaluation);
  const calGate = evaluateExportGate(calCtx, evaluation);

  // Preview is computed with the *current* redaction choice but does not require consent — the
  // exporter needs to read what they are about to send. It is never copied or sent from here.
  const waPreview = useMemo(() => {
    if (!evaluation || evaluation.dataQuality.completeness === 'insufficient') {
      return evaluateExportGate({ ...waCtx, consentGiven: true, recipientConfirmed: true }, evaluation).reason || '';
    }
    try {
      return prepareConsentedExport({
        channel: 'whatsapp_text',
        ctx: { ...waCtx, consentGiven: true, recipientConfirmed: true },
        caregiver,
        patient,
        evaluation,
        authorization
      }).content;
    } catch (err) {
      return err instanceof Error ? err.message : 'Preview unavailable.';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caregiver, patient, evaluation, authorization, waRedact]);

  const runExport = async (channel: ExportChannel, ctx: ExportConsentContext) => {
    let prepared;
    try {
      prepared = prepareConsentedExport({ channel, ctx, caregiver, patient, evaluation, authorization, dyadKey: patientUid });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Export Blocked', description: err instanceof Error ? err.message : 'Export blocked.' });
      return;
    }

    if (channel === 'ics_calendar') {
      const blob = new Blob([prepared.content], { type: prepared.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', prepared.fileName || 'care-roster.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (channel === 'whatsapp_link') {
      window.open(whatsAppShareUrl(prepared.content), '_blank', 'noopener');
    } else {
      try {
        await navigator.clipboard.writeText(prepared.content);
      } catch {
        toast({ variant: 'destructive', title: 'Clipboard Unavailable', description: 'Select the preview text and copy it manually.' });
        return;
      }
    }

    const entry = buildExportAuditEntry(prepared, ctx, actor);
    const audit = await recordExportAuditFor(patientUid, entry);
    toast({
      title:
        channel === 'ics_calendar'
          ? 'Calendar Roster Exported'
          : channel === 'whatsapp_link'
          ? 'Opened in WhatsApp'
          : 'Digest Copied',
      description: `${prepared.redacted ? 'Identifiers redacted. ' : 'Full names included. '}Logged to the export audit trail${audit.cloud ? '' : ' (device only until online)'}.`
    });
    if (channel === 'ics_calendar') onCalendarOpenChange(false);
  };

  const gateCheckbox = (
    id: string,
    checked: boolean,
    onChange: (v: boolean) => void,
    label: string
  ) => (
    <div className="flex items-start gap-2">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300"
      />
      <label htmlFor={id} className="text-[11px] text-muted-foreground leading-tight cursor-pointer">
        {label}
      </label>
    </div>
  );

  return (
    <>
      {/* WhatsApp digest */}
      <Dialog open={whatsAppOpen} onOpenChange={onWhatsAppOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Share2 className="w-5 h-5" />
              WhatsApp Care Circle Digest
            </DialogTitle>
            <DialogDescription className="text-xs">
              Shift allocations, respite days and emergency contacts formatted for the family group.
              {!authorization.planAuthorized && ' The digest is labelled as a draft pending clinician authorization.'}
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-muted/60 rounded-xl border border-border/70 space-y-2.5 text-xs">
            <div className="font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> External sharing safeguards</span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Required</span>
            </div>
            {gateCheckbox('wa-consent', waConsent, setWaConsent, CONSENT_COPY.whatsapp.consent)}
            {gateCheckbox('wa-recipient', waRecipientConfirmed, setWaRecipientConfirmed, CONSENT_COPY.whatsapp.recipient)}
            <div className="space-y-1">
              <Label htmlFor="wa-recipient-label" className="text-[10px] text-muted-foreground font-semibold">
                Recipient (recorded in the audit log)
              </Label>
              <Input
                id="wa-recipient-label"
                value={waRecipientLabel}
                onChange={(e) => setWaRecipientLabel(e.target.value)}
                placeholder="e.g. 'Family care group' or a person's name"
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="wa-redact" checked={waRedact} onChange={(e) => setWaRedact(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <label htmlFor="wa-redact" className="text-[11px] font-medium text-foreground cursor-pointer">
                  Redact patient &amp; caregiver identifiers (initials only)
                </label>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-xl font-mono text-xs whitespace-pre-wrap max-h-[40vh] overflow-y-auto border border-border/60">
            {waPreview}
          </div>
          {!waGate.allowed && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400">{waGate.reason}</p>
          )}
          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!waGate.allowed}
              onClick={() => void runExport('clipboard', waCtx)}
              className="text-xs gap-1.5 font-bold w-full sm:w-auto disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Text
            </Button>
            <Button
              size="sm"
              disabled={!waGate.allowed}
              onClick={() => void runExport('whatsapp_link', waCtx)}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 w-full sm:w-auto disabled:opacity-50"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open in WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar export */}
      <Dialog open={calendarOpen} onOpenChange={onCalendarOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Calendar className="w-5 h-5" />
              Calendar Export (.ics)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Proposed home shifts and respite days as calendar events. Events are marked tentative and
              {authorization.planAuthorized ? ' reflect the clinician-authorized plan.' : ' reflect a draft pending clinician authorization.'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-muted/60 rounded-xl border border-border/70 space-y-2.5 text-xs">
            {gateCheckbox('cal-consent', calConsent, setCalConsent, CONSENT_COPY.calendar.consent)}
            {gateCheckbox('cal-recipient', calRecipientConfirmed, setCalRecipientConfirmed, CONSENT_COPY.calendar.recipient)}
            <div className="space-y-1">
              <Label htmlFor="cal-recipient-label" className="text-[10px] text-muted-foreground font-semibold">
                Destination calendar (recorded in the audit log)
              </Label>
              <Input
                id="cal-recipient-label"
                value={calRecipientLabel}
                onChange={(e) => setCalRecipientLabel(e.target.value)}
                placeholder="e.g. 'Shared family Google Calendar'"
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-border/40">
              <input type="checkbox" id="cal-redact" checked={calRedact} onChange={(e) => setCalRedact(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <label htmlFor="cal-redact" className="text-[11px] font-medium text-foreground cursor-pointer">
                Redact names in event titles and descriptions (initials only)
              </label>
            </div>
          </div>
          {!calGate.allowed && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400">{calGate.reason}</p>
          )}
          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onCalendarOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!calGate.allowed}
              onClick={() => void runExport('ics_calendar', calCtx)}
              className="text-xs font-bold gap-1.5 bg-primary disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Download .ics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
