
'use client';

import * as React from 'react';
import { Moon, Sun, Siren } from 'lucide-react';
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
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"


export function HeaderControls() {
  const { setTheme } = useTheme();
  const { role, setRole } = useProfile();
  const { toast } = useToast();

  const handleRoleChange = (checked: boolean) => {
    setRole(checked ? 'professional' : 'caregiver');
  };

  const handleSosConfirm = () => {
    if (!navigator.geolocation) {
        toast({
            variant: "destructive",
            title: "Geolocation Not Supported",
            description: "Your browser does not support this feature.",
        })
        return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const recipient = 'nephrochsc@gmail.com';
        const subject = 'Emergency SOS Alert';
        const body = `Hello Doctor,

This is an emergency message. Pl find my precise location and help me come to your clinic/ my home whichever is closer.

My location: https://www.google.com/maps?q=${latitude},${longitude}

Thanks.`;

        const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = mailtoLink;

        toast({
          title: "✅ Opening Email Client",
          description: `Your email app is opening with a pre-filled message for your caregiver. Please press send.`,
        });
      },
      (error) => {
         toast({
            variant: "destructive",
            title: "Could Not Get Location",
            description: "Please ensure location services are enabled for your browser and try again.",
        })
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
       <AlertDialog>
        <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" className="rounded-full h-9 w-9">
                <Siren className="h-5 w-5" />
                <span className="sr-only">SOS Alert</span>
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Send Emergency Alert?</AlertDialogTitle>
            <AlertDialogDescription>
                This action will get your current location and open your default email app to send an emergency alert to your primary caregiver, Babulal Jadhav. Are you sure you want to proceed?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSosConfirm}>Yes, Prepare Email</AlertDialogAction>
            </AlertDialogFooter>
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
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme('light')}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
