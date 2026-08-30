'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Hospital,
  Pill,
  Store,
  Ambulance,
  ExternalLink,
  Save,
  Navigation,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { HealthRepository, PatientDependenceProfile } from '@/lib/db/health-repository';
import { syncPatientProfile } from '@/lib/firebase/clinical-sync';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function HomeCareAddressCard() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<PatientDependenceProfile | null>(null);
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const p = HealthRepository.getPatientProfile();
    setProfile(p);
    setAddress(p.homeCareAddress || '');
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const updatedProfile: PatientDependenceProfile = {
        ...profile,
        homeCareAddress: address.trim()
      };
      HealthRepository.savePatientProfile(updatedProfile);
      setProfile(updatedProfile);
      await syncPatientProfile(updatedProfile);

      toast({
        title: 'Home Nursing Location Saved',
        description: 'Nearby hospital, pharmacy, and ambulance searches in Google Maps will now use this address.'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could Not Save',
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support automatic GPS location.'
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGpsCoords(coords);
        setIsLocating(false);
        // If address is currently empty, pre-fill with coordinate reference
        if (!address.trim()) {
          setAddress(`GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
        }
        toast({
          title: 'GPS Coordinates Acquired',
          description: `Location calibrated (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}). Type full street/city for higher precision.`
        });
      },
      (err) => {
        setIsLocating(false);
        toast({
          variant: 'destructive',
          title: 'Location Permission Denied',
          description: 'Please enable location permissions or manually enter your full street address.'
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const activeLocationQuery = address.trim() || (gpsCoords ? `${gpsCoords.lat},${gpsCoords.lng}` : '');

  const openGoogleSearch = (query: string) => {
    if (!activeLocationQuery) {
      toast({
        title: 'Address Needed',
        description: 'Please type an address or click "Detect GPS" before searching.'
      });
      return;
    }
    const fullQuery = `${query} ${activeLocationQuery}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullQuery)}`;
    window.open(url, '_blank');
  };

  return (
    <Card className="border-border/80 shadow-xs bg-card rounded-2xl sm:rounded-3xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Patient Home Care Address & Nearby Services
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Set the patient&apos;s physical residence to power one-click Google Maps searches for nearby hospitals, pharmacies, stockists, and emergency routes.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] self-start sm:self-center font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200">
            Emergency Geolocation
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Address Input & GPS Button */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-foreground">
              Home Nursing Physical Address
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDetectGps}
              disabled={isLocating}
              className="h-7 px-2 text-[11px] font-semibold text-primary hover:bg-primary/10 gap-1"
            >
              <Navigation className={cn('w-3 h-3', isLocating && 'animate-spin')} />
              {isLocating ? 'Detecting GPS…' : 'Detect GPS Location'}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. H-402, Green Park Society, Indirapuram, Ghaziabad, UP 201014"
              className="h-10 text-xs rounded-xl flex-1 bg-background"
            />
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 text-xs font-bold gap-1.5 px-4 rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving…' : 'Save Address'}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {address.trim() ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active setpoint: {address}
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> No physical address saved. Enter street, locality & city for accurate Google Maps directions.
              </span>
            )}
          </p>
        </div>

        {/* Live Search Quick Buttons */}
        <div className="pt-3 border-t border-border/60 space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Test Live Google Search For Nearby Services:
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Hospitals */}
            <button
              type="button"
              onClick={() => openGoogleSearch('hospitals emergency near')}
              className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Hospital className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">Nearby Hospitals</p>
                  <p className="text-[10px] text-muted-foreground truncate">Emergency & ICU</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </button>

            {/* Pharmacies */}
            <button
              type="button"
              onClick={() => openGoogleSearch('medical stores pharmacy near')}
              className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Pill className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">24x7 Pharmacies</p>
                  <p className="text-[10px] text-muted-foreground truncate">Medical Stores</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </button>

            {/* Wholesale Stockists */}
            <button
              type="button"
              onClick={() => openGoogleSearch('wholesale medical surgical stockist near')}
              className="p-2.5 rounded-xl border border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10 text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">Surgical Stockists</p>
                  <p className="text-[10px] text-muted-foreground truncate">Beds, Suction & Adult Diapers</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </button>

            {/* Ambulances */}
            <button
              type="button"
              onClick={() => openGoogleSearch('ambulance service near')}
              className="p-2.5 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                  <Ambulance className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">Ambulance Services</p>
                  <p className="text-[10px] text-muted-foreground truncate">ICU & Basic Transport</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
