'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  ArrowRight, 
  UserPlus, 
  Edit2, 
  Clock, 
  Crown, 
  ShieldAlert, 
  Lock, 
  Zap,
  Search,
  Camera,
  Loader2,
  Eye,
  User,
  AlertCircle
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { intelligentMatchmakerSuggestions, IntelligentMatchmakerSuggestionsOutput } from "@/ai/flows/intelligent-matchmaker-suggestions";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, getDocs, doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image-utils";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

function UserAvatar({ userId, className }: { userId: string, className?: string }) {
  const db = useFirestore();
  const userRef = useMemoFirebase(() => userId ? doc(db!, 'users', userId) : null, [db, userId]);
  const { data: profile } = useDoc(userRef);
  
  return (
    <div className={cn("relative overflow-hidden rounded-[2rem] bg-muted shadow-lg", className)}>
      {profile?.photoUrl ? (
        <Image src={profile.photoUrl} alt="Avatar" fill className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
          <User className="h-1/2 w-1/2" />
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
      if (!profile || !db || profile.status !== 'approved' || aiSuggestions) return;
      
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
            age: Number(d.data().age) || 25,
          })) as any[];

        if (availableProfiles.length > 0) {
          const result = await intelligentMatchmakerSuggestions({
            userProfile: {
              sect: profile.sect || 'Other',
              education: profile.education || 'N/A',
              lifestyle: profile.lifestyle || "Moderate",
              city: profile.city || 'N/A',
              maritalStatus: profile.maritalStatus || 'Single',
              age: Number(profile.age) || 25
            },
            availableProfiles
          });
          setAiSuggestions(result);
        } else {
          setAiSuggestions({ suggestions: [] });
        }
      } catch (err: any) {
        console.error("AI Matchmaking Error:", err);
        setAiError("AI suggestions are temporarily unavailable.");
      } finally {
        setLoadingSuggestions(false);
      }
    }
    if (profile && profile.status === 'approved' && !aiSuggestions && !loadingSuggestions) fetchSuggestions();
  }, [profile?.id, profile?.status, db, user, aiSuggestions, loadingSuggestions]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db || !user) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      const compressed = await compressImage(rawBase64);
      
      const userRef = doc(db, 'users', user.uid);
      const updates = { 
        photoUrl: compressed, 
        photos: arrayUnion(compressed),
        updatedAt: serverTimestamp() 
      };

      updateDoc(userRef, updates)
        .then(() => toast({ title: "Photo Updated" }))
        .catch(async (e) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: updates
          }));
        })
        .finally(() => setIsUploadingPhoto(false));
    };
    reader.readAsDataURL(file);
  };

  if (authLoading || profileLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (!user) return null;

  if (profile?.isBanned || profile?.isSuspended) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="h-32 w-32 bg-destructive/10 rounded-[3rem] flex items-center justify-center mb-10">
          <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        <h1 className="text-4xl font-bold mb-4 font-headline text-primary">Account Restricted</h1>
        <p className="text-muted-foreground max-w-sm leading-relaxed font-medium">Your access to the platform has been suspended by administration.</p>
        <Button variant="outline" className="mt-12 h-14 px-12 rounded-[2rem] font-bold" onClick={() => window.location.href = '/'}>Back to Home</Button>
      </div>
    );
  }

  if (!profile || !profile.isProfileComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex items-center justify-center px-6 py-24">
          <Card className="w-full max-w-xl text-center border-none shadow-[0_50px_100px_rgba(0,0,0,0.1)] rounded-[4rem] p-16 bg-white">
            <CardHeader className="space-y-6">
              <div className="h-32 w-32 bg-primary/5 rounded-[3rem] flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-5xl font-headline text-primary">Begin Your Journey</CardTitle>
              <CardDescription className="text-xl text-muted-foreground/70">Complete your profile to be verified by our team.</CardDescription>
            </CardHeader>
            <CardFooter className="pt-12">
              <Link href="/setup-profile" className="w-full">
                <Button className="w-full h-20 text-2xl font-bold rounded-[2.5rem] bg-primary">Complete Profile</Button>
              </Link>
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
      
      <main className="container mx-auto px-6 py-12 lg:px-12 max-w-7xl">
        <section className="mb-16 animate-fade-in">
          <div className="flex flex-col items-start gap-10 md:flex-row md:items-center justify-between">
            <div className="flex items-center gap-10">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="h-40 w-40 overflow-hidden rounded-[3.5rem] bg-white relative shadow-2xl border-4 border-white group-hover:ring-primary/40 transition-all">
                  {profile.photoUrl ? (
                    <Image src={profile.photoUrl} alt="Avatar" fill className="object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/20 bg-muted"><User className="h-16 w-16" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                    <Camera className="h-10 w-10 text-white" />
                  </div>
                  {isUploadingPhoto && <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-md"><Loader2 className="h-10 w-10 text-white animate-spin" /></div>}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary tracking-tight">Salam, {profile.fullName.split(' ')[0]}</h1>
                <div className="flex flex-wrap items-center gap-4">
                   <Badge className={cn("h-9 px-5 gap-2 text-[11px] font-bold border-none shadow-xl tracking-widest", profile.status === 'approved' ? 'bg-green-600' : 'bg-muted text-muted-foreground')}>
                      {profile.status === 'approved' ? <ShieldCheck className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      {profile.status === 'approved' ? 'VERIFIED' : 'PENDING'}
                   </Badge>
                   <Badge className="h-9 px-5 gap-2 bg-white text-primary border-none text-[11px] font-bold shadow-xl">
                      <Crown className="h-4 w-4 text-secondary" /> {planName.toUpperCase()}
                   </Badge>
                </div>
              </div>
            </div>
            <Link href="/setup-profile" className="w-full md:w-auto">
              <Button className="w-full h-16 px-10 gap-3 font-bold shadow-xl rounded-[2rem] bg-white text-primary border-2 border-primary/5 hover:bg-muted transition-all text-lg">
                <Edit2 className="h-5 w-5" /> Edit Profile
              </Button>
            </Link>
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-12">
            <Card className={cn("border-none shadow-[0_40px_80px_rgba(0,0,0,0.08)] overflow-hidden rounded-[4rem] transition-all", profile.status === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-white')}>
              <CardHeader className="p-12 pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-4 text-4xl font-headline">
                    <Sparkles className="h-10 w-10 text-secondary" /> Smart Matches
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-12 pt-0">
                {profile.status !== 'approved' ? (
                  <div className="py-24 text-center">
                    <div className="h-20 w-20 bg-muted/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8"><Lock className="h-10 w-10 text-muted-foreground/30" /></div>
                    <p className="text-xl font-bold opacity-40">Verification pending.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {loadingSuggestions ? (
                      <div className="flex h-64 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin opacity-20" /></div>
                    ) : aiError ? (
                      <div className="text-center py-12 opacity-60 bg-white/5 rounded-[2.5rem]"><AlertCircle className="mx-auto h-12 w-12 mb-4" /><p className="text-lg font-medium">{aiError}</p></div>
                    ) : aiSuggestions?.suggestions.length ? (
                      aiSuggestions.suggestions.map((suggestion) => (
                        <div key={suggestion.profileId} className="group flex flex-col gap-8 rounded-[3rem] bg-white/10 p-10 backdrop-blur-3xl md:flex-row md:items-center hover:bg-white/15 transition-all border border-white/10 shadow-2xl">
                          <UserAvatar userId={suggestion.profileId} className="h-24 w-24 shrink-0 rounded-[2.25rem] bg-white/20 shadow-2xl border-2 border-white/20" />
                          <div className="flex-1 space-y-3">
                             <p className="text-lg font-medium leading-relaxed opacity-95 font-body">"{suggestion.reason}"</p>
                          </div>
                          <Link href={`/profiles/${suggestion.profileId}`}>
                            <Button variant="secondary" size="lg" className="font-bold h-14 px-10 rounded-3xl shadow-2xl bg-white text-primary">View Profile</Button>
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-24 bg-white/5 rounded-[3.5rem]">
                        <Heart className="mx-auto h-16 w-16 mb-6 opacity-20" />
                        <p className="text-2xl font-headline font-bold opacity-40">Looking for matches...</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <section>
               <h2 className="text-3xl font-bold font-headline mb-8 text-primary px-4">Executive Dashboard</h2>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                  {[
                    { href: "/setup-profile", icon: Edit2, label: "My Gallery", color: "bg-primary/5 text-primary" },
                    { href: `/profiles/${user.uid}`, icon: Eye, label: "Live Preview", color: "bg-secondary/5 text-secondary-foreground" },
                    { href: "/membership", icon: Crown, label: "Subscription", color: "bg-orange-50 text-orange-600" },
                    { href: "/discover", icon: Search, label: "Deep Search", color: "bg-blue-50 text-blue-600" }
                  ].map((act, i) => (
                    <Link key={i} href={act.href} className="group h-full">
                      <Card className="hover:bg-white transition-all cursor-pointer border-none shadow-[0_20px_40px_rgba(0,0,0,0.04)] h-full flex flex-col items-center justify-center p-10 text-center gap-6 rounded-[3rem] hover:border-primary/5 hover:-translate-y-2 group">
                         <div className={cn("h-20 w-20 rounded-[2rem] flex items-center justify-center transition-all shadow-lg group-hover:scale-110", act.color)}>
                            <act.icon className="h-10 w-10" />
                         </div>
                         <span className="text-sm font-bold opacity-70 tracking-widest uppercase">{act.label}</span>
                      </Card>
                    </Link>
                  ))}
               </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-12">
            <Card className="border-none shadow-[0_40px_80px_rgba(0,0,0,0.06)] bg-white overflow-hidden rounded-[4rem]">
               <CardHeader className="p-10 pb-6">
                  <div className="flex items-center justify-between mb-6">
                     <CardTitle className="text-2xl font-headline text-primary">Reliability</CardTitle>
                     <Badge className="bg-primary/5 text-primary border-none font-bold text-lg h-12 px-6 rounded-3xl">{completionPercentage}%</Badge>
                  </div>
                  <Progress value={completionPercentage} className="h-4 bg-muted rounded-full" />
               </CardHeader>
               <CardContent className="p-10 pt-4">
                  <p className="text-sm text-muted-foreground/80 leading-relaxed mb-8 font-medium">Complete profiles get 5x more meaningful interest requests.</p>
                  {completionPercentage < 100 && (
                    <Link href="/setup-profile">
                      <Button variant="outline" className="w-full text-base font-bold h-16 gap-3 rounded-[2rem] border-2 border-primary/10">Finalize Details <ArrowRight className="h-5 w-5" /></Button>
                    </Link>
                  )}
               </CardContent>
            </Card>

            <Card className="border-none shadow-[0_40px_80px_rgba(0,0,0,0.06)] rounded-[4rem] overflow-hidden bg-white">
              <CardHeader className="p-10 bg-muted/10 border-b border-muted">
                <CardTitle className="text-2xl font-headline text-primary">Member Status</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="p-8 bg-background rounded-[3rem] flex items-center justify-between border border-primary/5">
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Plan</p>
                        <p className="font-bold text-3xl text-primary font-headline">{planName}</p>
                    </div>
                    {planName === 'Free' ? <Zap className="h-12 w-12 text-orange-400" /> : <Crown className="h-12 w-12 text-primary" />}
                </div>
                <Link href="/membership" className="block">
                    <Button variant={planName === 'Free' ? 'default' : 'outline'} className="w-full font-bold h-20 rounded-[2.5rem] text-xl shadow-2xl bg-primary">
                        {planName === 'Premium' ? "Manage Benefits" : "Unlock Premium"}
                    </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
