'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Heart, 
  Crown, 
  HelpCircle, 
  Layout, 
  LogOut, 
  Trash2, 
  ChevronRight, 
  Camera, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Globe, 
  Moon, 
  Zap,
  Loader2,
  FileText,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Flag,
  CheckCircle2
} from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { signOut, deleteUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(profileRef);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const handleUpdateToggle = async (path: string, value: boolean) => {
    if (!db || !user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [path]: value,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Preference Updated" });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (!auth || !user || !db) return;
    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      // 2. Delete from Auth
      await deleteUser(user);
      toast({ title: "Account Deleted", description: "Your data has been removed from our systems." });
      router.push('/');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Please re-authenticate and try again." });
    }
  };

  if (authLoading || profileLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const SettingRow = ({ icon: Icon, label, description, children, className }: any) => (
    <div className={cn("flex items-center justify-between p-4 md:p-6 transition-all hover:bg-muted/30 rounded-2xl", className)}>
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-sm md:text-base leading-none">{label}</p>
          {description && <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  const SectionHeader = ({ icon: Icon, title }: any) => (
    <div className="flex items-center gap-3 px-2 mb-4">
      <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">{title}</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 md:py-12 lg:px-8 max-w-5xl">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">Settings</h1>
          <p className="text-muted-foreground font-medium mt-1">Manage your account, privacy, and preferences.</p>
        </header>

        <div className="space-y-12">
          {/* Account Section */}
          <section>
            <SectionHeader icon={User} title="Account" />
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
              <div className="divide-y">
                <Link href="/setup-profile">
                  <SettingRow icon={Settings} label="Edit Profile" description="Update your personal details and narrative.">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </SettingRow>
                </Link>
                <Link href="/setup-profile">
                  <SettingRow icon={Camera} label="Change Profile Photos" description="Manage your gallery and primary photo.">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </SettingRow>
                </Link>
                <SettingRow icon={Mail} label="Email Address" description={user?.email}>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">Verified</Badge>
                </SettingRow>
                <SettingRow icon={Lock} label="Password Security" description="Update your login credentials.">
                  <Button variant="ghost" size="sm" className="font-bold text-primary">Change</Button>
                </SettingRow>
              </div>
            </Card>
          </section>

          {/* Privacy & Safety Section */}
          <section>
            <SectionHeader icon={Shield} title="Privacy & Safety" />
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
              <div className="divide-y">
                <Link href="/settings/blocked-users">
                  <SettingRow icon={EyeOff} label="Blocked Users" description="Manage restricted member accounts.">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </SettingRow>
                </Link>
                <SettingRow icon={Globe} label="Hide Profile from Search" description="Prevent others from finding you in discovery.">
                  <Switch 
                    checked={profile?.settings?.hideProfileFromSearch || false} 
                    onCheckedChange={(v) => handleUpdateToggle('settings.hideProfileFromSearch', v)} 
                  />
                </SettingRow>
                <SettingRow icon={Zap} label="Hide Online Status" description="Go invisible while browsing the platform.">
                   <Switch 
                    checked={profile?.settings?.hideOnlineStatus || false} 
                    onCheckedChange={(v) => handleUpdateToggle('settings.hideOnlineStatus', v)} 
                  />
                </SettingRow>
                <SettingRow icon={Eye} label="Hide Last Active" description="Keep your activity timestamps private.">
                   <Switch 
                    checked={profile?.settings?.hideLastActive || false} 
                    onCheckedChange={(v) => handleUpdateToggle('settings.hideLastActive', v)} 
                  />
                </SettingRow>
                <SettingRow icon={Crown} label="Premium Photo Lock" description="Only show photos to Premium members.">
                   <Switch 
                    checked={profile?.settings?.hidePhotosFromNonPremium || false} 
                    onCheckedChange={(v) => handleUpdateToggle('settings.hidePhotosFromNonPremium', v)} 
                  />
                </SettingRow>
              </div>
            </Card>
          </section>

          {/* Notifications Section */}
          <section>
            <SectionHeader icon={Bell} title="Notifications" />
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
              <div className="divide-y">
                <SettingRow icon={MessageSquare} label="New Messages">
                  <Switch 
                    checked={profile?.settings?.notifications?.messages !== false} 
                    onCheckedChange={(v) => handleUpdateToggle('settings.notifications.messages', v)} 
                  />
                </SettingRow>
                <SettingRow icon={Heart} label="New Interests">
                   <Switch 
                    checked={profile?.settings?.notifications?.interests !== false} 
                    onCheckedChange={(v) => handleUpdateToggle('settings.notifications.interests', v)} 
                  />
                </SettingRow>
                <SettingRow icon={CheckCircle2} label="Interest Accepted">
                   <Switch 
                    checked={profile?.settings?.notifications?.interestAccepted !== false} 
                    onCheckedChange={(v) => handleUpdateToggle('settings.notifications.interestAccepted', v)} 
                  />
                </SettingRow>
                <SettingRow icon={ShieldCheck} label="New Matches">
                   <Switch 
                    checked={profile?.settings?.notifications?.matches !== false} 
                    onCheckedChange={(v) => handleUpdateToggle('settings.notifications.matches', v)} 
                  />
                </SettingRow>
                <SettingRow icon={CreditCard} label="Membership Updates">
                   <Switch 
                    checked={profile?.settings?.notifications?.membership !== false} 
                    onCheckedChange={(v) => handleUpdateToggle('settings.notifications.membership', v)} 
                  />
                </SettingRow>
              </div>
            </Card>
          </section>

          {/* Match Preferences Section */}
          <section>
            <SectionHeader icon={Heart} title="Match Preferences" />
            <Card className="border-none shadow-xl rounded-[2rem] p-8 md:p-10 bg-white space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preferred Age Range</Label>
                   <div className="flex items-center gap-4">
                     <Input type="number" placeholder="Min" className="h-12 rounded-xl" defaultValue={profile?.partnerPreferences?.minAge || 18} />
                     <span className="text-muted-foreground font-bold">to</span>
                     <Input type="number" placeholder="Max" className="h-12 rounded-xl" defaultValue={profile?.partnerPreferences?.maxAge || 40} />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preferred Sect</Label>
                   <Select defaultValue={profile?.partnerPreferences?.sect || profile?.sect}>
                     <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Sunni">Sunni</SelectItem>
                       <SelectItem value="Shia">Shia</SelectItem>
                       <SelectItem value="Other">Other</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preferred Education</Label>
                   <Input placeholder="e.g. Master's Degree" className="h-12 rounded-xl" defaultValue={profile?.partnerPreferences?.education} />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preferred Marital Status</Label>
                    <Select defaultValue={profile?.partnerPreferences?.maritalStatus || "Single"}>
                     <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Single">Single</SelectItem>
                       <SelectItem value="Divorced">Divorced</SelectItem>
                       <SelectItem value="Widowed">Widowed</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
              </div>
              <Button className="w-full h-14 rounded-2xl font-bold shadow-lg" onClick={() => toast({ title: "Preferences Saved" })}>Save Preferences</Button>
            </Card>
          </section>

          {/* Membership Section */}
          <section>
            <SectionHeader icon={Crown} title="Membership" />
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
              <div className="divide-y">
                <SettingRow icon={Zap} label="Current Plan" description={profile?.membership?.plan || 'Free'}>
                  <Link href="/membership"><Button size="sm" variant="outline" className="rounded-xl font-bold">Upgrade</Button></Link>
                </SettingRow>
                <SettingRow icon={FileText} label="Payment History" description="View your manual verification logs.">
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </SettingRow>
              </div>
            </Card>
          </section>

          {/* Support Section */}
          <section>
            <SectionHeader icon={HelpCircle} title="Support" />
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
              <div className="divide-y">
                <Link href="/support">
                  <SettingRow icon={HelpCircle} label="Help & Support" description="Get assistance from our sincere team.">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </SettingRow>
                </Link>
                <SettingRow icon={FileText} label="Terms & Conditions">
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </SettingRow>
                <Link href="/privacy">
                  <SettingRow icon={Shield} label="Privacy Policy" description="Read our commitment to your data.">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </SettingRow>
                </Link>
              </div>
            </Card>
          </section>

          {/* App Settings Section */}
          <section>
            <SectionHeader icon={Layout} title="App Settings" />
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
              <div className="divide-y">
                <SettingRow icon={Moon} label="Dark Mode" description="Coming soon in Al Batul 2.0.">
                  <Switch disabled />
                </SettingRow>
                <SettingRow icon={Globe} label="Language Selection" description="Current: English (International)">
                   <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </SettingRow>
                <SettingRow icon={Trash2} label="Clear Cache" description="Remove temporary media files.">
                   <Button variant="ghost" size="sm" className="font-bold text-destructive" onClick={() => toast({ title: "Cache Cleared" })}>Clear</Button>
                </SettingRow>
              </div>
            </Card>
          </section>

          {/* Account Actions Section */}
          <section className="pt-8 space-y-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full h-16 rounded-[1.5rem] border-2 font-bold gap-3 text-destructive shadow-sm hover:bg-destructive/5 transition-all">
                  <LogOut className="h-5 w-5" /> Logout from Session
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2.5rem] p-10 max-w-sm">
                <AlertDialogHeader className="space-y-4">
                  <AlertDialogTitle className="text-2xl font-headline text-center">Log Out</AlertDialogTitle>
                  <AlertDialogDescription className="text-center font-medium leading-relaxed">
                    Are you sure you want to end your session? You will need to sign in again to browse profiles.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8 flex flex-col gap-3">
                  <AlertDialogCancel className="w-full h-14 rounded-2xl border-2 font-bold m-0">Stay Logged In</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="w-full h-14 rounded-2xl bg-destructive text-white font-bold m-0 shadow-xl">End Session</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="w-full h-12 rounded-xl text-muted-foreground text-xs font-bold uppercase tracking-widest hover:text-destructive">
                  Delete Account Permanently
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2.5rem] p-10 max-w-md">
                <AlertDialogHeader className="space-y-4 text-center">
                  <div className="h-16 w-16 bg-destructive/5 rounded-full flex items-center justify-center mx-auto"><Trash2 className="h-8 w-8 text-destructive" /></div>
                  <AlertDialogTitle className="text-2xl font-headline text-destructive">Severe Action: Delete Account</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground font-medium leading-relaxed">
                    This action is irreversible. All your profile data, messages, photos, and match history will be permanently erased from Al Batul.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8 flex flex-col gap-3">
                   <AlertDialogCancel className="w-full h-14 rounded-2xl border-2 font-bold m-0">Cancel Deletion</AlertDialogCancel>
                   <AlertDialogAction onClick={handleDeleteAccount} className="w-full h-14 rounded-2xl bg-destructive text-white font-bold m-0 shadow-xl">Delete Everything</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </div>
      </main>
    </div>
  );
}