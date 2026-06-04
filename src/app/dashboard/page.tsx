
'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Activity, ShieldCheck, Heart, ArrowRight, UserPlus, AlertCircle, Edit2, Clock, Crown } from "lucide-react";
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex items-center justify-center px-4 py-20">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <UserPlus className="mx-auto h-12 w-12 text-primary opacity-50" />
              <CardTitle className="text-2xl font-headline">Welcome to Al Batul</CardTitle>
              <CardDescription>You're almost there! Complete your profile to start finding matches.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/setup-profile" className="w-full">
                <Button className="w-full h-12">Set Up My Profile</Button>
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
            <h1 className="text-3xl font-bold font-headline">Salam, {profile.name}!</h1>
            <p className="text-muted-foreground">Welcome back to your matrimonial journey.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant={profile.status === 'approved' ? 'default' : 'secondary'} className="h-10 px-4 gap-2">
              {profile.status === 'approved' ? <ShieldCheck className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              {profile.status.toUpperCase()}
            </Badge>
            {isPremium ? (
               <Badge className="h-10 px-4 gap-2 bg-primary">
                  <Crown className="h-4 w-4 text-secondary" />
                  {profile.membership.plan} MEMBER
               </Badge>
            ) : (
              <Link href="/membership">
                <Button className="gap-2 bg-secondary hover:bg-secondary/90 text-primary-foreground h-10">
                  Upgrade to Premium
                </Button>
              </Link>
            )}
          </div>
        </div>

        {profile.status === 'pending' && (
          <div className="mb-8 flex items-center gap-4 rounded-2xl bg-accent/50 p-6 text-primary border border-primary/10">
            <AlertCircle className="h-8 w-8 shrink-0" />
            <div>
              <p className="font-bold">Profile Pending Approval</p>
              <p className="text-sm opacity-80">Our admins are reviewing your profile. Once approved, you'll be visible to other members and can access AI matchmaking suggestions.</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* AI Matchmaker Section */}
          <Card className={`lg:col-span-2 border-none shadow-sm overflow-hidden ${profile.status === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Sparkles className="h-6 w-6 text-secondary" />
                AI Matchmaker Suggestions
              </CardTitle>
              <Badge variant="secondary">GenAI</Badge>
            </CardHeader>
            <CardContent>
              {profile.status !== 'approved' ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Clock className="mx-auto mb-4 h-12 w-12 opacity-20" />
                  <p>Suggestions will appear here once your profile is approved.</p>
                </div>
              ) : (
                <>
                  <p className="mb-6 opacity-80">Based on your preferences and lifestyle, we've found these compatible profiles for you.</p>
                  
                  <div className="space-y-4">
                    {loadingSuggestions ? (
                      <div className="flex h-32 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                      </div>
                    ) : aiSuggestions?.suggestions.length ? (
                      aiSuggestions.suggestions.map((suggestion) => (
                        <div key={suggestion.profileId} className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm md:flex-row md:items-center">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/20">
                             <Image src={`https://picsum.photos/seed/${suggestion.profileId}/100/100`} fill className="object-cover" alt="Profile" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold">Match Recommendation</h4>
                            <p className="text-sm opacity-80">{suggestion.reason}</p>
                          </div>
                          <Link href={`/profiles/${suggestion.profileId}`}>
                            <Button variant="secondary" size="sm" className="gap-2">
                              View Profile
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      ))
                    ) : (
                      <p className="text-center opacity-60">No suggestions available at the moment. Try broadening your preferences.</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activity & Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  Membership Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-sm text-muted-foreground">Current Plan</span>
                  <Badge variant="outline">{profile.membership?.plan || 'Free'}</Badge>
                </div>
                {profile.membership?.expiresAt && (
                   <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-sm text-muted-foreground">Expires On</span>
                    <span className="text-sm font-medium">{format(new Date(profile.membership.expiresAt), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {!isPremium && (
                  <Link href="/membership" className="block pt-2">
                    <Button variant="secondary" className="w-full text-xs h-8">View Premium Plans</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">My Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Profile Status</span>
                  <Badge variant="outline" className="capitalize">{profile.status}</Badge>
                </div>
                <div className="mb-6 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${profile.status === 'approved' ? 'w-full bg-primary' : 'w-2/3 bg-secondary'}`} />
                </div>
                <Link href="/setup-profile">
                  <Button variant="outline" className="w-full gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit Profile Details
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
