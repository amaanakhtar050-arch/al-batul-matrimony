'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  Heart, 
  ArrowRight, 
  UserPlus, 
  Edit2, 
  Clock, 
  Crown, 
  ShieldAlert, 
  Lock, 
  UserCheck, 
  XCircle, 
  AlertCircle, 
  Zap,
  Search,
  MessageSquare,
  Camera,
  Loader2,
  Eye,
  User,
  Settings
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { intelligentMatchmakerSuggestions, IntelligentMatchmakerSuggestionsOutput } from "@/ai/flows/intelligent-matchmaker-suggestions";
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, where, limit, getDocs, doc, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";

/**
 * A helper component to display a user's avatar fetching the latest photo from Firestore.
 */
function UserAvatar({ userId, className }: { userId: string, className?: string }) {
  const db = useFirestore();
  const userRef = useMemoFirebase(() => userId ? doc(db!, 'users', userId) : null, [db, userId]);
  const { data: profile } = useDoc(userRef);
  
  return (
    <div className={cn("relative overflow-hidden rounded-full bg-muted", className)}>
      {profile?.photoUrl ? (
        <Image src={profile.photoUrl} alt="Avatar" fill className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
          <User className="h-2/3 w-2/3" />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);
  
  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'notifications'), limit(1));
  }, [db, user]);

  const { data: notifications, loading: loadingNotifications } = useCollection(notificationsQuery);

  const [aiSuggestions, setAiSuggestions] = useState<IntelligentMatchmakerSuggestionsOutput | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const completionPercentage = useMemo(() => {
    if (!profile) return 0;
    const fields = [
      'fullName', 'age', 'gender', 'sect', 'city', 'country', 
      'mobileNumber', 'about', 'photoUrl', 'idPhotoUrl', 'selfiePhotoUrl'
    ];
    const filledFields = fields.filter(field => !!profile[field]);
    return Math.round((filledFields.length / fields.length) * 100);
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchSuggestions() {
      if (!profile || !db || profile.status !== 'approved') return;
      setLoadingSuggestions(true);
      setAiError(null);
      try {
        const q = query(collection(db, 'users'), where('status', '==', 'approved'), limit(10));
        const snapshot = await getDocs(q);
        const availableProfiles = snapshot.docs
          .filter(d => d.id !== user?.uid && !d.data().isSuspended && !d.data().isBanned)
          .map(d => ({
            profileId: d.id,
            sect: d.data().sect || '',
            education: d.data().education || '',
            lifestyle: d.data().lifestyle || 'Moderate',
            city: d.data().city || '',
            maritalStatus: d.data().maritalStatus || '',
            age: d.data().age || 25,
          })) as any[];

        if (availableProfiles.length > 0) {
          const result = await intelligentMatchmakerSuggestions({
            userProfile: {
              sect: profile.sect,
              education: profile.education,
              lifestyle: profile.lifestyle || "Moderate",
              city: profile.city,
              maritalStatus: profile.maritalStatus,
              age: profile.age
            },
            availableProfiles
          });
          setAiSuggestions(result);
        }
      } catch (err) {
        console.error("AI Error:", err);
        setAiError("AI suggestions are temporarily unavailable. Please try again later.");
      } finally {
        setLoadingSuggestions(false);
      }
    }
    if (profile && profile.status === 'approved') fetchSuggestions();
  }, [profile, db, user]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Please upload an image smaller than 2MB." });
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, { photoUrl: base64String, updatedAt: serverTimestamp() })
        .then(() => toast({ title: "Photo Updated", description: "Your profile picture has been updated instantly." }))
        .finally(() => setIsUploadingPhoto(false));
    };
    reader.readAsDataURL(file);
  };

  if (authLoading || profileLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (!user) return null;

  if (profile?.isBanned || profile?.isSuspended) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2 font-headline">{profile.isBanned ? "Account Banned" : "Account Suspended"}</h1>
        <p className="text-muted-foreground max-w-md">Access has been revoked by the administration.</p>
        <Button variant="outline" className="mt-8" onClick={() => window.location.href = '/'}>Back to Home</Button>
      </div>
    );
  }

  if (!profile || !profile.isProfileComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex items-center justify-center px-4 py-20">
          <Card className="w-full max-w-md text-center border-none shadow-2xl rounded-[3rem] p-12 overflow-hidden bg-white">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>
            <CardHeader>
              <UserPlus className="mx-auto h-20 w-20 text-primary/20 mb-6" />
              <CardTitle className="text-4xl font-headline text-primary">Complete Your Profile</CardTitle>
              <CardDescription className="text-lg mt-4 leading-relaxed">Join our verified community and begin your journey towards completing your deen.</CardDescription>
            </CardHeader>
            <CardFooter className="pt-8">
              <Link href="/setup-profile" className="w-full"><Button className="w-full h-16 text-xl font-bold shadow-xl rounded-3xl">Start Setup Now</Button></Link>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  const planName = profile.membership?.plan || 'Free';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <div className="mb-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-32 w-32 overflow-hidden rounded-[2.5rem] border-4 border-primary/10 bg-muted relative shadow-2xl group-hover:border-primary/30 transition-all">
                {profile.photoUrl ? (
                  <Image src={profile.photoUrl} alt="Avatar" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/30"><UserPlus className="h-12 w-12" /></div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera className="h-8 w-8 text-white" /></div>
                {isUploadingPhoto && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="h-8 w-8 text-white animate-spin" /></div>}
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl"><Camera className="h-5 w-5" /></div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Salam, {profile.fullName}!</h1>
              <div className="flex items-center gap-3 mt-3">
                 <Badge variant="outline" className={`h-7 px-4 gap-2 text-[10px] font-bold tracking-widest ${profile.status === 'approved' ? 'bg-green-600 text-white border-none shadow-md' : 'bg-muted'}`}>
                    {profile.status === 'approved' ? <ShieldCheck className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    {profile.status === 'approved' ? 'VERIFIED MEMBER' : 'VERIFICATION PENDING'}
                 </Badge>
                 {planName !== 'Free' && (
                   <Badge className="h-7 px-4 gap-2 bg-gradient-to-r from-primary to-primary/80 border-none text-white text-[10px] font-bold shadow-md">
                      <Crown className="h-4 w-4 text-secondary" /> {planName.toUpperCase()}
                   </Badge>
                 )}
              </div>
            </div>
          </div>
          
          <Link href="/setup-profile"><Button className="h-14 px-8 gap-3 font-bold shadow-xl rounded-2xl bg-white text-primary hover:bg-muted border border-border"><Edit2 className="h-5 w-5" /> Edit Profile</Button></Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            {/* AI Matches */}
            <Card className={`border-none shadow-2xl overflow-hidden rounded-[3rem] ${profile.status === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
              <CardHeader className="p-8 pb-4">
                <CardTitle className="flex items-center gap-3 text-3xl font-headline">
                  <Sparkles className="h-8 w-8 text-secondary" /> Intelligent Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                {profile.status !== 'approved' ? (
                  <div className="py-20 text-center opacity-40">
                    <Lock className="mx-auto mb-6 h-16 w-16" />
                    <p className="text-xl font-bold">Unlock after verification</p>
                    <p className="text-sm mt-2">AI matching requires an approved profile.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {loadingSuggestions ? (
                      <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin opacity-20" /></div>
                    ) : aiError ? (
                      <div className="text-center py-10 opacity-60"><AlertCircle className="mx-auto h-10 w-10 mb-4" /><p className="text-sm">{aiError}</p></div>
                    ) : aiSuggestions?.suggestions.length ? (
                      aiSuggestions.suggestions.map((suggestion) => (
                        <div key={suggestion.profileId} className="group flex flex-col gap-6 rounded-[2.5rem] bg-white/10 p-8 backdrop-blur-xl md:flex-row md:items-center hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                          <UserAvatar userId={suggestion.profileId} className="h-20 w-20 shrink-0 rounded-[1.5rem] bg-white/20 shadow-xl" />
                          <div className="flex-1 space-y-2">
                             <p className="text-base font-medium leading-relaxed opacity-90 italic">"{suggestion.reason}"</p>
                          </div>
                          <Link href={`/profiles/${suggestion.profileId}`}><Button variant="secondary" size="lg" className="font-bold h-12 px-6 rounded-2xl shadow-xl">View Profile</Button></Link>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 opacity-40"><Heart className="mx-auto h-12 w-12 mb-4" /><p className="text-xl font-bold">Discovering compatibility...</p></div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <section>
               <h2 className="text-2xl font-bold font-headline mb-6 text-primary px-2">Essential Actions</h2>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {[
                    { href: "/setup-profile", icon: Edit2, label: "Edit Details", color: "bg-primary/10 text-primary" },
                    { href: `/profiles/${user.uid}`, icon: Eye, label: "View Profile", color: "bg-secondary/10 text-secondary-foreground" },
                    { href: "/membership", icon: Crown, label: "Membership", color: "bg-orange-100 text-orange-600" },
                    { href: "/discover", icon: Search, label: "Find Matches", color: "bg-blue-100 text-blue-600" }
                  ].map((act, i) => (
                    <Link key={i} href={act.href} className="block">
                      <Card className="hover:bg-accent/50 transition-all cursor-pointer border-none shadow-xl h-full flex flex-col items-center justify-center p-8 text-center gap-4 rounded-[2rem] group">
                         <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg", act.color)}>
                            <act.icon className="h-8 w-8" />
                         </div>
                         <span className="text-sm font-bold opacity-80">{act.label}</span>
                      </Card>
                    </Link>
                  ))}
               </div>
            </section>
          </div>

          <div className="space-y-10">
            {/* Profile Score */}
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[3rem]">
               <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between mb-4">
                     <CardTitle className="text-2xl font-headline text-primary">Profile Score</CardTitle>
                     <Badge className="bg-primary/10 text-primary border-none font-bold text-lg h-10 px-4 rounded-2xl">{completionPercentage}%</Badge>
                  </div>
                  <Progress value={completionPercentage} className="h-3 bg-muted rounded-full" />
               </CardHeader>
               <CardContent className="p-8 pt-4">
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {completionPercentage < 100 
                      ? "Completing your profile increases your chances of finding a compatible partner by up to 80%." 
                      : "Mashallah! Your profile is fully complete and looking great."}
                  </p>
                  {completionPercentage < 100 && (
                    <Link href="/setup-profile">
                      <Button variant="outline" className="w-full text-sm font-bold h-12 gap-2 rounded-2xl border-2">
                         Complete Now <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
               </CardContent>
            </Card>

            {/* Membership */}
            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden">
              <CardHeader className="p-8 bg-muted/30 border-b">
                <CardTitle className="text-2xl font-headline text-primary">Your Status</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="p-6 bg-primary/5 rounded-[2rem] flex items-center justify-between border border-primary/10">
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Plan</p>
                        <p className="font-bold text-2xl text-primary">{planName}</p>
                    </div>
                    {planName === 'Free' ? <Zap className="h-10 w-10 text-orange-400" /> : <Crown className="h-10 w-10 text-primary" />}
                </div>
                <Link href="/membership" className="block">
                    <Button variant={planName === 'Free' ? 'default' : 'outline'} className="w-full font-bold h-14 rounded-2xl text-lg shadow-xl">
                        {planName === 'Premium' ? "Manage Benefits" : "Upgrade Plan"}
                    </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Interactions */}
            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden">
                <CardHeader className="p-8 border-b"><CardTitle className="text-2xl font-headline text-primary">Recent Interactions</CardTitle></CardHeader>
                <CardContent className="p-8 space-y-4">
                    <Link href="/interests" className="flex items-center justify-between p-5 hover:bg-muted/50 rounded-[1.5rem] transition-all border border-transparent hover:border-border">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 bg-accent rounded-2xl flex items-center justify-center shadow-md"><Heart className="h-6 w-6 text-primary" /></div>
                           <span className="font-bold">Interests</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <Link href="/messages" className="flex items-center justify-between p-5 hover:bg-muted/50 rounded-[1.5rem] transition-all border border-transparent hover:border-border">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 bg-accent rounded-2xl flex items-center justify-center shadow-md"><MessageSquare className="h-6 w-6 text-primary" /></div>
                           <span className="font-bold">Chat Messages</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}