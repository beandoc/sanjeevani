'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { PhoneCall, Plus, Pencil, Trash2, ShieldAlert, Star } from 'lucide-react';
import { HealthRepository, EmergencyContact } from '@/lib/db/health-repository';
import { syncEmergencyContacts, getEmergencyContactsFor } from '@/lib/firebase/clinical-sync';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useToast } from '@/hooks/use-toast';

const EMPTY_FORM = { name: '', relation: '', phone: '', isPrimary: false, notifyOnCrisis: true };

/**
 * The only editor anywhere in the app for the personal emergency contact
 * list (distinct from the hardcoded national helplines card on the
 * dashboard) — previously this data had a getter/setter in HealthRepository
 * and, since this session's cloud-sync pass, a Firestore mirror, but no form
 * ever called the setter, so every caregiver silently saw the two seeded
 * defaults forever. Read by the crisis escalation modal
 * (notifyOnCrisis filters who gets broadcast to).
 */
export function EmergencyContactsManager() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuthUser();
  const { toast } = useToast();

  // Local copy first (instant), then adopt the cloud copy if signed in and
  // present — same "cloud is authoritative once signed in" pattern used
  // throughout the app.
  useEffect(() => {
    setContacts(HealthRepository.getEmergencyContacts());
    if (!user?.uid) return;
    void getEmergencyContactsFor(user.uid).then((cloudContacts) => {
      if (cloudContacts && cloudContacts.length > 0) {
        HealthRepository.saveEmergencyContacts(cloudContacts);
        setContacts(cloudContacts);
      }
    });
  }, [user]);

  const persist = async (updated: EmergencyContact[]) => {
    setContacts(updated);
    const { queued } = await syncEmergencyContacts(updated);
    return queued;
  };

  const openAddDialog = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEditDialog = (contact: EmergencyContact) => {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      relation: contact.relation,
      phone: contact.phone,
      isPrimary: contact.isPrimary,
      notifyOnCrisis: contact.notifyOnCrisis
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Details',
        description: 'Enter at least a name and phone number.'
      });
      return;
    }

    setIsSaving(true);
    try {
      let updated: EmergencyContact[];
      if (editingId) {
        updated = contacts.map((c) =>
          c.id === editingId
            ? { ...c, name: form.name.trim(), relation: form.relation.trim() || 'Family', phone: form.phone.trim(), isPrimary: form.isPrimary, notifyOnCrisis: form.notifyOnCrisis }
            : form.isPrimary
              ? { ...c, isPrimary: false } // only one primary contact at a time
              : c
        );
      } else {
        const newContact: EmergencyContact = {
          id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: form.name.trim(),
          relation: form.relation.trim() || 'Family',
          phone: form.phone.trim(),
          isPrimary: form.isPrimary,
          notifyOnCrisis: form.notifyOnCrisis
        };
        updated = [...(form.isPrimary ? contacts.map((c) => ({ ...c, isPrimary: false })) : contacts), newContact];
      }

      const queued = await persist(updated);
      setIsDialogOpen(false);
      toast({
        title: queued ? '☁️ Contact Saved — Backed Up to Cloud' : 'Contact Saved',
        description: queued
          ? 'Visible to any clinician granted access to this dyad.'
          : 'Saved on this device. Sign in to back it up to the cloud.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const removed = contacts.find((c) => c.id === id);
    if (!removed) return;
    const updated = contacts.filter((c) => c.id !== id);
    await persist(updated);
    toast({
      title: 'Contact Removed',
      description: `${removed.name} was removed from your emergency contacts.`,
      action: (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs font-bold border-primary/50 text-primary hover:bg-primary/10"
          onClick={async () => {
            await persist([...contacts.filter((c) => c.id !== id), removed]);
            toast({ title: 'Contact Restored', description: `${removed.name} is back on the list.` });
          }}
        >
          Undo
        </Button>
      )
    });
  };

  return (
    <Card className="border-border shadow-sm bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              Emergency Contacts
            </CardTitle>
            <CardDescription className="text-xs">
              Who gets called and notified during a crisis escalation.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold shrink-0" onClick={openAddDialog}>
                <Plus className="w-3.5 h-3.5" /> Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}</DialogTitle>
                <DialogDescription>
                  Saved to your account and, once signed in, backed up to the cloud so it's visible to any clinician granted access to this dyad.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ec-name" className="text-xs font-semibold">Name</Label>
                  <Input
                    id="ec-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Dr. Arvind Sharma"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ec-relation" className="text-xs font-semibold">Relation</Label>
                  <Input
                    id="ec-relation"
                    value={form.relation}
                    onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
                    placeholder="e.g. Primary Physician, Son, Neighbor"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ec-phone" className="text-xs font-semibold">Phone Number</Label>
                  <Input
                    id="ec-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. 9820012345"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div>
                    <Label htmlFor="ec-primary" className="text-xs font-semibold">Primary Contact</Label>
                    <p className="text-[10px] text-muted-foreground">Shown first during a crisis. Only one contact can be primary.</p>
                  </div>
                  <Switch id="ec-primary" checked={form.isPrimary} onCheckedChange={(checked) => setForm((f) => ({ ...f, isPrimary: checked }))} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div>
                    <Label htmlFor="ec-notify" className="text-xs font-semibold">Notify on Crisis</Label>
                    <p className="text-[10px] text-muted-foreground">Included in the crisis broadcast (SMS/WhatsApp) to the care circle.</p>
                  </div>
                  <Switch id="ec-notify" checked={form.notifyOnCrisis} onCheckedChange={(checked) => setForm((f) => ({ ...f, notifyOnCrisis: checked }))} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSaving} className="w-full font-bold">
                    {isSaving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Contact'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {contacts.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No emergency contacts added yet.</p>
        )}
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-background/60"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-bold truncate">{contact.name}</p>
                  {contact.isPrimary && (
                    <Badge variant="outline" className="text-[9px] font-bold gap-0.5 border-amber-500/40 text-amber-600">
                      <Star className="w-2.5 h-2.5" /> Primary
                    </Badge>
                  )}
                  {contact.notifyOnCrisis && (
                    <Badge variant="outline" className="text-[9px] font-bold border-emerald-500/40 text-emerald-600">
                      Crisis Alert
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{contact.relation} · {contact.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(contact)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(contact.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
