
'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Activity, ShieldCheck, Heart, ArrowRight, UserPlus, AlertCircle, Edit2, Clock, Crown, MailWarning } from "lucide-react";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchSuggestions() {
      if (!profile || !db || profile.status !== 'approved') return;
      setLoadingSuggestions(true);
      try {
        const q = query(collection(db, 'users'), where('status', '==', 'approved'), limit(10));
        const snapshot = await getDocs(q);
        const availableProfiles = snapshot.docs
          .filter(d => d.id !== user?.uid)
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
    if (profile) fetchSuggestions();
  }, [profile, db, user]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex items-center justify-center px-4 py-20">
          <Card className="w-full max-w-md text-center border-none shadow-xl">
            <CardHeader>
              <MailWarning className="mx-auto h-16 w-16 text-primary mb-4" />
              <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
              <CardDescription>
                You must verify your email address before accessing matrimonial features.
              </CardDescription>
            </CardHeader>
            <CardFooter>
               <Button className="w-full h-11" onClick={() => window.location.reload()}>I've Verified My Email</Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex items-center justify-center px-4 py-20">
          <Card className="w-full max-w-md text-center border-none shadow-xl">
            <CardHeader>
              <UserPlus className="mx-auto h-12 w-12 text-primary opacity-50 mb-4" />
              <CardTitle className="text-3xl font-headline">Complete Your Profile</CardTitle>
              <CardDescription className="text-base">You're one step away! Fill in your details to begin your journey on Al Batul.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/setup-profile" className="w-full">
                <Button className="w-full h-12 text-lg font-bold">Set Up My Profile Now</Button>
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
            <h1 className="text-4xl font-bold font-headline">Salam, {profile.name}!</h1>
            <p className="text-muted-foreground">Your matrimonial journey is in progress.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant={profile.status === 'approved' ? 'default' : 'secondary'} className="h-10 px-4 gap-2 border-none">
              {profile.status === 'approved' ? <ShieldCheck className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              {profile.status.toUpperCase()}
            </Badge>
            {isPremium ? (
               <Badge className="h-10 px-4 gap-2 bg-primary border-none">
                  <Crown className="h-4 w-4 text-secondary" />
                  {profile.membership.plan} MEMBER
               </Badge>
            ) : (
              <Link href="/membership">
                <Button className="gap-2 bg-secondary hover:bg-secondary/90 text-primary-foreground h-10 border-none">
                  Upgrade to Premium
                </Button>
              </Link>
            )}
          </div>
        </div>

        {profile.status === 'pending' && (
          <div className="mb-8 flex items-center gap-4 rounded-2xl bg-accent/30 p-6 text-primary border border-primary/5">
            <AlertCircle className="h-8 w-8 shrink-0 text-primary" />
            <div>
              <p className="font-bold text-lg">Verification in Progress</p>
              <p className="opacity-80">Our admin team is currently reviewing your profile for quality and authenticity. You'll gain full access to search and AI matches once approved.</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* AI Matchmaker Section */}
          <Card className={`lg:col-span-2 border-none shadow-lg overflow-hidden ${profile.status === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Sparkles className="h-6 w-6 text-secondary" />
                Intelligent Suggestions
              </CardTitle>
              <Badge variant="secondary" className="bg-white/10 text-white border-none">GenAI Powered</Badge>
            </CardHeader>
            <CardContent>
              {profile.status !== 'approved' ? (
                <div className="py-20 text-center text-muted-foreground">
                  <Clock className="mx-auto mb-4 h-14 w-14 opacity-20" />
                  <p className="text-lg">Your personalized matches are being prepared.</p>
                  <p className="text-sm">They will appear here as soon as your profile is approved.</p>
                </div>
              ) : (
                <>
                  <p className="mb-8 opacity-90 text-lg">We've analyzed your preferences. Here are the most compatible profiles for you today:</p>
                  
                  <div className="space-y-4">
                    {loadingSuggestions ? (
                      <div className="flex h-40 items-center justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                      </div>
                    ) : aiSuggestions?.suggestions.length ? (
                      aiSuggestions.suggestions.map((suggestion) => (
                        <div key={suggestion.profileId} className="group flex flex-col gap-5 rounded-2xl bg-white/10 p-5 backdrop-blur-md md:flex-row md:items-center hover:bg-white/20 transition-all">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/20 shadow-lg">
                             <Image src={`https://picsum.photos/seed/${suggestion.profileId}/200/200`} fill className="object-cover" alt="Match Preview" />
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
                         <p>No new suggestions at this moment.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5 text-primary" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between border-b pb-4">
                  <span className="text-sm font-medium text-muted-foreground">Active Plan</span>
                  <Badge variant="outline" className="px-4 py-1 font-bold">{profile.membership?.plan || 'Free'}</Badge>
                </div>
                {profile.membership?.expiresAt && (
                   <div className="flex items-center justify-between border-b pb-4">
                    <span className="text-sm font-medium text-muted-foreground">Renews on</span>
                    <span className="text-sm font-bold">{format(new Date(profile.membership.expiresAt), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {!isPremium && (
                  <Link href="/membership" className="block pt-2">
                    <Button variant="secondary" className="w-full font-bold h-11">Explore Premium Plans</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-primary/10 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Profile Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Current Status</span>
                  <Badge variant="outline" className="capitalize px-4 py-1 border-primary/20 bg-white/50">{profile.status}</Badge>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Setup Progress</span>
                      <span>{profile.status === 'approved' ? '100%' : '75%'}</span>
                   </div>
                   <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden shadow-inner">
                    <div className={`h-full transition-all duration-1000 ${profile.status === 'approved' ? 'w-full bg-primary' : 'w-3/4 bg-secondary'}`} />
                  </div>
                </div>
                <Link href="/setup-profile">
                  <Button variant="outline" className="w-full gap-2 h-11 border-primary/20 hover:bg-primary/5">
                    <Edit2 className="h-4 w-4" />
                    Modify Profile
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
