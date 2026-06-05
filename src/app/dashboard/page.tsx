
'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Activity, ShieldCheck, Heart, ArrowRight, UserPlus, Edit2, Clock, Crown, ShieldAlert, Lock, UserCheck, XCircle, AlertCircle, Zap } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { intelligentMatchmakerSuggestions, IntelligentMatchmakerSuggestionsOutput } from "@/ai/flows/intelligent-matchmaker-suggestions";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, getDocs, doc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);
  
  const [aiSuggestions, setAiSuggestions] = useState<IntelligentMatchmakerSuggestionsOutput | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchSuggestions() {
      if (!profile || !db || profile.status !== 'approved') return;
      setLoadingSuggestions(true);
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
      } finally {
        setLoadingSuggestions(false);
      }
    }
    if (profile && profile.status === 'approved') fetchSuggestions();
  }, [profile, db, user]);

  if (authLoading || profileLoading) return <div className="flex h-screen items-center justify-center animate-pulse" />;

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
          <Card className="w-full max-w-md text-center border-none shadow-xl">
            <CardHeader>
              <UserPlus className="mx-auto h-12 w-12 text-primary opacity-50 mb-4" />
              <CardTitle className="text-3xl font-headline text-primary">Complete Your Profile</CardTitle>
              <CardDescription>Join our verified community today.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/setup-profile" className="w-full"><Button className="w-full h-14 text-lg font-bold">Start Setup</Button></Link>
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
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-bold font-headline text-primary">Salam, {profile.fullName}!</h1>
            <p className="text-muted-foreground">Plan: <span className="font-bold text-primary uppercase">{planName}</span></p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className={`h-10 px-4 gap-2 ${profile.status === 'approved' ? 'bg-green-600 text-white border-none' : ''}`}>
              {profile.status === 'approved' ? <ShieldCheck className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              {profile.status === 'approved' ? 'VERIFIED' : 'PENDING APPROVAL'}
            </Badge>
            {planName !== 'Free' && (
               <Badge className="h-10 px-4 gap-2 bg-primary border-none text-white">
                  <Crown className="h-4 w-4 text-secondary" />
                  {planName} MEMBER
               </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <Card className={`lg:col-span-2 border-none shadow-lg overflow-hidden ${profile.status === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Sparkles className="h-6 w-6 text-secondary" /> Intelligent Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.status !== 'approved' ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Lock className="mx-auto mb-4 h-12 w-12 opacity-20" />
                  <p className="text-sm font-bold">Locked until verification is complete.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loadingSuggestions ? (
                    <div className="flex h-40 items-center justify-center animate-pulse" />
                  ) : aiSuggestions?.suggestions.length ? (
                    aiSuggestions.suggestions.map((suggestion) => (
                      <div key={suggestion.profileId} className="group flex flex-col gap-5 rounded-2xl bg-white/10 p-5 backdrop-blur-md md:flex-row md:items-center hover:bg-white/20 transition-all">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/20"><Image src={`https://picsum.photos/seed/${suggestion.profileId}/200/200`} fill className="object-cover" alt="Match" /></div>
                        <div className="flex-1"><p className="text-sm opacity-90 leading-relaxed">{suggestion.reason}</p></div>
                        <Link href={`/profiles/${suggestion.profileId}`}><Button variant="secondary" size="sm" className="font-bold">View Profile</Button></Link>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 opacity-60">
                       <Heart className="mx-auto h-8 w-8 mb-2" />
                       <p className="text-xs">Finding matches for you...</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle className="text-xl font-headline text-primary">Your Membership</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Plan</p>
                        <p className="font-bold text-lg">{planName}</p>
                    </div>
                    {planName === 'Free' ? <Zap className="h-6 w-6 text-orange-400" /> : <Crown className="h-6 w-6 text-primary" />}
                </div>
                <Link href="/membership" className="block">
                    <Button variant={planName === 'Free' ? 'default' : 'outline'} className="w-full font-bold h-11">
                        {planName === 'Premium' ? "Manage Plan" : "Upgrade Benefits"}
                    </Button>
                </Link>
                {planName === 'Free' && <p className="text-[10px] text-center text-muted-foreground">Unlock chat and contact info with an upgrade.</p>}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
                <CardHeader><CardTitle className="text-xl font-headline text-primary">Quick Links</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                    <Link href="/discover"><Button variant="ghost" className="w-full h-14 flex-col text-[11px] gap-1"><Search className="h-4 w-4" /> Discover</Button></Link>
                    <Link href="/interests"><Button variant="ghost" className="w-full h-14 flex-col text-[11px] gap-1"><Heart className="h-4 w-4" /> Interests</Button></Link>
                    <Link href="/messages"><Button variant="ghost" className="w-full h-14 flex-col text-[11px] gap-1"><MessageSquare className="h-4 w-4" /> Messages</Button></Link>
                    <Link href="/setup-profile"><Button variant="ghost" className="w-full h-14 flex-col text-[11px] gap-1"><Edit2 className="h-4 w-4" /> Edit Profile</Button></Link>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
