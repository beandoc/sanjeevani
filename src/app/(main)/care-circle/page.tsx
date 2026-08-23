'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  Share2,
  Copy,
  CalendarCheck,
  Plus,
  ShieldCheck,
  PhoneCall,
  Activity,
  HeartHandshake
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HealthRepository, CareCircleMember, CareCircleTask } from '@/lib/db/health-repository';
import { useToast } from '@/hooks/use-toast';

export default function CareCirclePage() {
  const [members, setMembers] = useState<CareCircleMember[]>([]);
  const [tasks, setTasks] = useState<CareCircleTask[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const { toast } = useToast();

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [taskTime, setTaskTime] = useState('09:00 AM');
  const [taskCategory, setTaskCategory] = useState<'meds' | 'physio' | 'hygiene' | 'appointment' | 'general'>('general');

  // Invite Form State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'Family Member' | 'Home Nurse' | 'Visiting Doctor'>('Family Member');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  const circleInviteCode = 'SANJEEVANI-CIRCLE-789';

  useEffect(() => {
    const loadedMembers = HealthRepository.getCareCircleMembers();
    const loadedTasks = HealthRepository.getCareCircleTasks();
    setMembers(loadedMembers);
    setTasks(loadedTasks);
    if (loadedMembers.length > 0 && !assignedTo) {
      setAssignedTo(loadedMembers[0].name);
    }
  }, [assignedTo]);

  const handleToggleTask = (taskId: string) => {
    const updated = HealthRepository.toggleCareCircleTask(taskId);
    setTasks(updated);
    const task = updated.find((t) => t.id === taskId);
    if (task?.isCompleted) {
      toast({
        title: 'Task Completed',
        description: `"${task.title}" has been marked complete.`,
      });
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast({
        variant: 'destructive',
        title: 'Task title required',
        description: 'Please enter a description for this task.',
      });
      return;
    }

    const newTask: CareCircleTask = {
      id: `task_${Date.now()}`,
      title: taskTitle.trim(),
      assignedToName: assignedTo || members[0]?.name || 'Primary Caregiver',
      category: taskCategory,
      time: taskTime,
      isCompleted: false,
      dueDate: new Date().toISOString().slice(0, 10),
    };

    const updated = [...tasks, newTask];
    HealthRepository.saveCareCircleTasks(updated);
    setTasks(updated);

    setTaskTitle('');
    setIsAddTaskOpen(false);

    toast({
      title: 'Care Task Assigned',
      description: `Task assigned to ${newTask.assignedToName}.`,
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberPhone.trim()) {
      toast({
        variant: 'destructive',
        title: 'Details missing',
        description: 'Please enter the name and phone number.',
      });
      return;
    }

    const colors = ['bg-blue-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600', 'bg-indigo-600'];
    const newMember: CareCircleMember = {
      id: `mem_${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole,
      phone: newMemberPhone.trim(),
      isSelf: false,
      avatarColor: colors[members.length % colors.length],
    };

    const updated = [...members, newMember];
    HealthRepository.saveCareCircleMembers(updated);
    setMembers(updated);

    setNewMemberName('');
    setNewMemberPhone('');
    setIsInviteOpen(false);

    toast({
      title: 'Member Added to Circle',
      description: `${newMember.name} is now part of the collaborative care circle.`,
    });
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/care-circle?join=${circleInviteCode}`;
    navigator.clipboard?.writeText(inviteUrl);
    toast({
      title: 'Invite Link Copied',
      description: 'Care Circle invitation link copied to clipboard.',
    });
  };

  const shareViaWhatsApp = () => {
    const inviteUrl = `${window.location.origin}/care-circle?join=${circleInviteCode}`;
    const text = `Join our family Care Circle on Sanjeevani to share vitals and caregiving tasks for our loved one:\n${inviteUrl}\nInvite Code: *${circleInviteCode}*`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Family & Clinical Collaboration</span>
          </div>
          <h1 className="text-3xl font-bold font-headline">Care Circle Sharing & Tasks</h1>
          <p className="text-muted-foreground text-sm">
            Coordinate tasks with family members, home nurses, and doctors to prevent caregiver overload.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 font-bold text-xs">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Invite Member</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-3xl">
              <form onSubmit={handleAddMember}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-headline">Invite Care Circle Member</DialogTitle>
                  <DialogDescription className="text-xs">
                    Add family members or healthcare assistants to coordinate vitals and tasks.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="m-name" className="text-xs font-semibold">Full Name</Label>
                    <Input
                      id="m-name"
                      placeholder="e.g. Ramesh Kumar"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Role in Care Ecosystem</Label>
                    <Select value={newMemberRole} onValueChange={(v: any) => setNewMemberRole(v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Family Member" className="text-xs">Family Member (Secondary Caregiver)</SelectItem>
                        <SelectItem value="Home Nurse" className="text-xs">Home Attendant / Nurse</SelectItem>
                        <SelectItem value="Visiting Doctor" className="text-xs">Visiting Doctor / Physio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="m-phone" className="text-xs font-semibold">Phone Number</Label>
                    <Input
                      id="m-phone"
                      placeholder="e.g. 9820012345"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  {/* Shareable Invite Code Box */}
                  <div className="p-3.5 rounded-2xl bg-muted border border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Circle Invite Code</span>
                      <p className="font-mono font-bold text-sm text-foreground">{circleInviteCode}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={copyInviteLink} className="h-8 text-xs gap-1">
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </Button>
                      <Button type="button" size="sm" onClick={shareViaWhatsApp} className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Share2 className="w-3.5 h-3.5" /> WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-bold">
                    Add Member
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-bold text-xs shadow-md">
                <Plus className="w-4 h-4" />
                <span>Assign Task</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-3xl">
              <form onSubmit={handleAddTask}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-headline">Assign Collaborative Care Task</DialogTitle>
                  <DialogDescription className="text-xs">
                    Delegate physical nursing, medication purchase, or appointment transport.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="t-title" className="text-xs font-semibold">Task Title</Label>
                    <Input
                      id="t-title"
                      placeholder="e.g. 2-Hourly bed turning, Evening BP check..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Assign To</Label>
                      <Select value={assignedTo} onValueChange={setAssignedTo}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((m) => (
                            <SelectItem key={m.id} value={m.name} className="text-xs">
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="t-time" className="text-xs font-semibold">Target Time</Label>
                      <Input
                        id="t-time"
                        placeholder="e.g. 10:00 AM"
                        value={taskTime}
                        onChange={(e) => setTaskTime(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Category</Label>
                    <Select value={taskCategory} onValueChange={(v: any) => setTaskCategory(v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meds" className="text-xs">Medication & Refills</SelectItem>
                        <SelectItem value="physio" className="text-xs">Physiotherapy & Mobility</SelectItem>
                        <SelectItem value="hygiene" className="text-xs">Hygiene & Positioning</SelectItem>
                        <SelectItem value="appointment" className="text-xs">Clinic Visit / Tele-OPD</SelectItem>
                        <SelectItem value="general" className="text-xs">General Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddTaskOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-bold">
                    Assign Task
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid: Members & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Circle Members List */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="border-border bg-card/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Circle Members</span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {members.length} Active
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Authorized caregivers in this patient circle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-3 rounded-2xl bg-background border border-border/80 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl ${member.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        {member.name}
                        {member.isSelf && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono">
                            You
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">{member.role}</p>
                    </div>
                  </div>

                  <a href={`tel:${member.phone}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg">
                      <PhoneCall className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Delegated Daily Care Tasks */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                  Today&apos;s Delegated Care Schedule
                </CardTitle>
                <CardDescription className="text-xs">
                  {completedCount} of {tasks.length} tasks completed today.
                </CardDescription>
              </div>
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {Math.round((completedCount / (tasks.length || 1)) * 100)}% Done
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      task.isCompleted
                        ? 'bg-muted/40 border-border opacity-70'
                        : 'bg-background border-border/90 hover:border-primary/40 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          task.isCompleted
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/40 bg-background'
                        }`}
                      >
                        {task.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div className="space-y-1">
                        <h4
                          className={`font-bold text-sm leading-tight ${
                            task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-primary" /> {task.time}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-foreground/80">Assigned: {task.assignedToName}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-[10px] capitalize py-0 px-1.5">
                            {task.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl">
                  <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-sm font-medium">No tasks assigned yet</p>
                  <p className="text-xs">Click &quot;Assign Task&quot; above to delegate care responsibilities.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
