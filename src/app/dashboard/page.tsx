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

  // Calculate Profile Completion Percentage
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
    if (!authLoading && user && db && !loadingNotifications && notifications.length === 0) {
      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      addDoc(notificationsRef, {
        type: 'welcome',
        title: 'Welcome to Al Batul Matrimony',
        message: "Welcome to Al Batul Matrimony. We are delighted to have you on your journey towards completing your deen. Please complete your profile to find your match.",
        senderId: 'system',
        receiverId: user.uid,
        read: false,
        createdAt: serverTimestamp()
      });
    }
  }, [authLoading, user, db, loadingNotifications, notifications]);

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
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 2MB.",
      });
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const userRef = doc(db, 'users', user.uid);
      
      updateDoc(userRef, {
        photoUrl: base64String,
        updatedAt: serverTimestamp()
      })
      .then(() => {
        toast({ title: "Photo Updated", description: "Your profile picture has been updated instantly." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { photoUrl: base64String }
        }));
      })
      .finally(() => setIsUploadingPhoto(false));
    };
    reader.readAsDataURL(file);
  };

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
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-primary/10 bg-muted relative shadow-lg group-hover:border-primary/30 transition-all">
                {profile.photoUrl ? (
                  <Image src={profile.photoUrl} alt="Avatar" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                    <UserPlus className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                   <Camera className="h-6 w-6 text-white" />
                </div>
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md">
                <Camera className="h-4 w-4" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handlePhotoUpload}
              />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">Salam, {profile.fullName}!</h1>
              <div className="flex items-center gap-2 mt-1">
                 <Badge variant="outline" className={`h-6 px-2 gap-1 text-[10px] ${profile.status === 'approved' ? 'bg-green-600 text-white border-none' : 'bg-muted'}`}>
                    {profile.status === 'approved' ? <ShieldCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {profile.status === 'approved' ? 'VERIFIED' : 'PENDING'}
                 </Badge>
                 {planName !== 'Free' && (
                   <Badge className="h-6 px-2 gap-1 bg-primary border-none text-white text-[10px]">
                      <Crown className="h-3 w-3 text-secondary" />
                      {planName}
                   </Badge>
                 )}
              </div>
            </div>
          </div>
          
          <Link href="/setup-profile">
            <Button className="h-12 px-6 gap-2 font-bold shadow-md rounded-xl">
               <Edit2 className="h-4 w-4" /> Edit Profile
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Intelligent Matches Section */}
            <Card className={`border-none shadow-lg overflow-hidden ${profile.status === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
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
                    ) : aiError ? (
                      <div className="text-center py-10 opacity-60">
                         <AlertCircle className="mx-auto h-8 w-8 mb-2 text-primary-foreground/50" />
                         <p className="text-xs">{aiError}</p>
                      </div>
                    ) : aiSuggestions?.suggestions.length ? (
                      aiSuggestions.suggestions.map((suggestion) => (
                        <div key={suggestion.profileId} className="group flex flex-col gap-5 rounded-2xl bg-white/10 p-5 backdrop-blur-md md:flex-row md:items-center hover:bg-white/20 transition-all">
                          <UserAvatar userId={suggestion.profileId} className="h-16 w-16 shrink-0 rounded-2xl bg-white/20" />
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

            {/* Quick Actions Grid for easier navigation */}
            <section>
               <h2 className="text-xl font-bold font-headline mb-4 text-primary px-1">Quick Actions</h2>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Link href="/setup-profile" className="block">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-none shadow-sm h-full flex flex-col items-center justify-center p-6 text-center gap-3 rounded-2xl">
                       <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Edit2 className="h-6 w-6" />
                       </div>
                       <span className="text-xs font-bold">Edit Details</span>
                    </Card>
                  </Link>
                  <Link href={`/profiles/${user.uid}`} className="block">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-none shadow-sm h-full flex flex-col items-center justify-center p-6 text-center gap-3 rounded-2xl">
                       <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary-foreground">
                          <Eye className="h-6 w-6" />
                       </div>
                       <span className="text-xs font-bold">View Profile</span>
                    </Card>
                  </Link>
                  <Link href="/membership" className="block">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-none shadow-sm h-full flex flex-col items-center justify-center p-6 text-center gap-3 rounded-2xl">
                       <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                          <Crown className="h-6 w-6" />
                       </div>
                       <span className="text-xs font-bold">Membership</span>
                    </Card>
                  </Link>
                  <Link href="/discover" className="block">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-none shadow-sm h-full flex flex-col items-center justify-center p-6 text-center gap-3 rounded-2xl">
                       <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                          <Search className="h-6 w-6" />
                       </div>
                       <span className="text-xs font-bold">Find Matches</span>
                    </Card>
                  </Link>
               </div>
            </section>
          </div>

          <div className="space-y-6">
            {/* Profile Completion Card */}
            <Card className="border-none shadow-lg bg-white overflow-hidden">
               <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                     <CardTitle className="text-lg font-headline text-primary">Profile Score</CardTitle>
                     <Badge className="bg-primary/10 text-primary border-none">{completionPercentage}%</Badge>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
               </CardHeader>
               <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-4">
                    {completionPercentage < 100 
                      ? "Completing your profile increases your chances of finding a compatible partner by 80%." 
                      : "Your profile is fully complete! You're ready to find your match."}
                  </p>
                  {completionPercentage < 100 && (
                    <Link href="/setup-profile">
                      <Button variant="outline" className="w-full text-xs font-bold h-9 gap-2">
                         Complete Now <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
               </CardContent>
            </Card>

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
                <CardHeader><CardTitle className="text-xl font-headline text-primary">Recent Interactions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Link href="/interests" className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center"><Heart className="h-5 w-5 text-primary" /></div>
                           <span className="text-sm font-medium">Interests</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    <Link href="/messages" className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center"><MessageSquare className="h-5 w-5 text-primary" /></div>
                           <span className="text-sm font-medium">Messages</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
