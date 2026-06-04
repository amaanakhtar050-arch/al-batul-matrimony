
'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Activity, ShieldCheck, Heart, ArrowRight, UserPlus, AlertCircle, Edit2, Clock, Crown, MailWarning, ShieldAlert, Lock, UserCheck } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { intelligentMatchmakerSuggestions, IntelligentMatchmakerSuggestionsOutput } from "@/ai/flows/intelligent-matchmaker-suggestions";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, getDocs, doc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

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

  const completionPercentage = useMemo(() => {
    if (!profile) return 0;
    const coreFields = [
      'fullName', 'dob', 'age', 'gender', 'height', 'weight', 'maritalStatus', 
      'sect', 'lifestyle', 'education', 'occupation', 'city', 'state', 'country', 
      'about', 'photoUrl', 'mobileNumber'
    ];
    const prefFields = [
      'minAge', 'maxAge', 'sect', 'education', 'location'
    ];
    
    let filledCount = 0;
    coreFields.forEach(field => {
      if (profile[field]) filledCount++;
    });
    
    if (profile.partnerPreferences) {
      Object.keys(profile.partnerPreferences).forEach(field => {
        if (profile.partnerPreferences[field]) filledCount++;
      });
    }

    const totalFields = coreFields.length + 5; // pref fields count
    return Math.min(100, Math.round((filledCount / totalFields) * 100));
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchSuggestions() {
      if (!profile || !db || profile.status !== 'approved' || profile.isSuspended || profile.isBanned) return;
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

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (profile?.isBanned) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Account Banned</h1>
        <p className="text-muted-foreground text-center max-w-md">Your access has been revoked for safety violations.</p>
        <Button variant="outline" className="mt-8" onClick={() => window.location.href = '/'}>Back to Home</Button>
      </div>
    );
  }

  if (profile?.isSuspended) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <Lock className="h-20 w-20 text-orange-600 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Account Suspended</h1>
        <p className="text-muted-foreground max-w-md">Your account is currently under administrative review.</p>
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
              <CardTitle className="text-3xl font-headline">Complete Your Profile</CardTitle>
              <CardDescription className="text-base">To maintain our verified community, please finish your profile setup.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/setup-profile" className="w-full">
                <Button className="w-full h-14 text-lg font-bold">Start Setup</Button>
              </Link>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  const isPremium = profile.membership?.plan && profile.membership.plan !== 'Free';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-bold font-headline">Salam, {profile.fullName}!</h1>
            <p className="text-muted-foreground">Manage your matrimonial journey here.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant={profile.status === 'approved' ? 'default' : profile.status === 'rejected' ? 'destructive' : 'secondary'} className="h-10 px-4 gap-2 border-none">
              {profile.status === 'approved' ? <ShieldCheck className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              {profile.status === 'approved' ? 'VERIFIED' : 'PENDING REVIEW'}
            </Badge>
            {isPremium ? (
               <Badge className="h-10 px-4 gap-2 bg-primary border-none text-white">
                  <Crown className="h-4 w-4 text-secondary" />
                  {profile.membership.plan}
               </Badge>
            ) : (
              <Link href="/membership">
                <Button className="gap-2 bg-secondary hover:bg-secondary/90 text-primary-foreground h-10 border-none">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>

        {profile.status === 'pending' && (
          <div className="mb-8 flex items-center gap-4 rounded-2xl bg-accent/30 p-6 text-primary border border-primary/5">
            <UserCheck className="h-8 w-8 shrink-0 text-primary" />
            <div>
              <p className="font-bold text-lg">Verification in Progress</p>
              <p className="opacity-80">Our team is reviewing your profile. Once approved, you can interact with other members.</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <Card className={`lg:col-span-2 border-none shadow-lg overflow-hidden ${profile.status === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Sparkles className="h-6 w-6 text-secondary" />
                Intelligent Suggestions
              </CardTitle>
              <Badge variant="secondary" className="bg-white/10 text-white border-none">AI Powered</Badge>
            </CardHeader>
            <CardContent>
              {profile.status !== 'approved' ? (
                <div className="py-20 text-center text-muted-foreground">
                  <Lock className="mx-auto mb-4 h-14 w-14 opacity-20" />
                  <p className="text-lg font-bold">Suggestions Locked</p>
                  <p className="text-sm">Available only for verified members.</p>
                </div>
              ) : (
                <>
                  <p className="mb-8 opacity-90 text-lg">Compatible profiles found based on your background and lifestyle:</p>
                  <div className="space-y-4">
                    {loadingSuggestions ? (
                      <div className="flex h-40 items-center justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                      </div>
                    ) : aiSuggestions?.suggestions.length ? (
                      aiSuggestions.suggestions.map((suggestion) => (
                        <div key={suggestion.profileId} className="group flex flex-col gap-5 rounded-2xl bg-white/10 p-5 backdrop-blur-md md:flex-row md:items-center hover:bg-white/20 transition-all">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/20 shadow-lg">
                             <Image src={`https://picsum.photos/seed/${suggestion.profileId}/200/200`} fill className="object-cover" alt="Match" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-xl mb-1">Recommended Match</h4>
                            <p className="text-sm opacity-90 leading-relaxed">{suggestion.reason}</p>
                          </div>
                          <Link href={`/profiles/${suggestion.profileId}`}>
                            <Button variant="secondary" size="lg" className="gap-2 font-bold shadow-sm">
                              Profile
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 opacity-60">
                         <Heart className="mx-auto h-12 w-12 mb-3 opacity-30" />
                         <p>Refining suggestions. Check back shortly.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-headline">
                  <Activity className="h-5 w-5 text-primary" />
                  Profile Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Setup Progress</span>
                      <span>{completionPercentage}%</span>
                   </div>
                   <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${completionPercentage === 100 ? 'bg-primary' : 'bg-secondary'}`} 
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Link href="/setup-profile">
                    <Button variant="outline" className="w-full gap-2 h-12 border-primary/20">
                      <Edit2 className="h-4 w-4" />
                      Edit Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-accent/10 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-headline">Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b border-muted pb-4">
                  <span className="text-sm font-medium text-muted-foreground">Plan</span>
                  <Badge variant="outline" className="px-4 py-1 font-bold">{profile.membership?.plan || 'Free'}</Badge>
                </div>
                {!isPremium && (
                  <Link href="/membership" className="block pt-2">
                    <Button variant="secondary" className="w-full font-bold h-11">Upgrade Plan</Button>
                  </Link>
                )}
                {profile.membership?.expiresAt && (
                   <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                    Expiry: {format(new Date(profile.membership.expiresAt), 'MMM dd, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
