'use client';

import * as React from 'react';
import { Moon, Sun, Siren, PhoneCall, ShieldAlert, Copy, MapPin } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/context/role-context';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function HeaderControls() {
  const { setTheme } = useTheme();
  const { role, setRole } = useProfile();
  const { toast } = useToast();
  const [currentCoords, setCurrentCoords] = React.useState<{ lat: number; lng: number } | null>(null);

  const handleRoleChange = (checked: boolean) => {
    setRole(checked ? 'professional' : 'caregiver');
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation Not Supported",
        description: "Your browser does not support automatic location detection.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        navigator.clipboard?.writeText(mapsUrl);
        toast({
          title: "Location Copied",
          description: `Current GPS coordinates copied to clipboard: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
      },
      () => {
        toast({
          variant: "destructive",
          title: "Location Access Denied",
          description: "Please enable location services to share your coordinates.",
        });
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="icon" className="rounded-full h-9 w-9 shadow-md shadow-destructive/20 animate-pulse">
            <Siren className="h-5 w-5" />
            <span className="sr-only">Emergency SOS</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive font-bold text-base">
              <ShieldAlert className="h-5 w-5" />
              <span>National Emergency Response</span>
            </div>
            <AlertDialogTitle className="text-xl">Immediate Crisis Assistance</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              If you or your care-recipient are experiencing an acute medical emergency, connect immediately to verified National Helplines:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2.5 my-2">
            <a href="tel:112" className="block">
              <Button variant="destructive" className="w-full justify-between h-12 rounded-xl text-sm font-bold shadow-sm">
                <span className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" /> 112 — National Emergency (ERSS)
                </span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md">Call 112</span>
              </Button>
            </a>

            <a href="tel:14567" className="block">
              <Button variant="outline" className="w-full justify-between h-12 rounded-xl text-sm font-bold border-primary/40 text-primary hover:bg-primary/5">
                <span className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" /> 14567 — Elder Line (Senior Care)
                </span>
                <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-md">Toll-Free</span>
              </Button>
            </a>

            <a href="tel:108" className="block">
              <Button variant="outline" className="w-full justify-between h-12 rounded-xl text-sm font-bold border-border hover:bg-muted">
                <span className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" /> 108 — National Ambulance Service
                </span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-md">Medical</span>
              </Button>
            </a>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFetchLocation}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>{currentCoords ? 'Location Copied' : 'Share GPS Location'}</span>
            </Button>
            <AlertDialogCancel className="rounded-xl text-xs font-semibold">Close</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="hidden sm:flex items-center space-x-2">
        <Label htmlFor="role-switch" className="text-sm font-medium">
          {role === 'caregiver' ? 'Caregiver' : 'Professional'}
        </Label>
        <Switch
          id="role-switch"
          checked={role === 'professional'}
          onCheckedChange={handleRoleChange}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
