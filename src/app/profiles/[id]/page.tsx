"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Heart, 
  ShieldCheck, 
  MessageSquare,
  User,
  Lock,
  Phone,
  MessageCircle,
  Crown,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where, addDoc, serverTimestamp, limit, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";
import { ActivityStatus } from "@/components/profile/ActivityStatus";
import { calculateCompatibility, CalculateCompatibilityOutput } from "@/ai/flows/calculate-compatibility";

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

export default function ProfileDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const db = useFirestore();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const [isSending, setIsSending] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  
  const [aiScore, setAiScore] = useState<CalculateCompatibilityOutput | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const profileRef = useMemoFirebase(() => id ? doc(db!, 'users', id as string) : null, [db, id]);
  const { data: profile, loading: profileLoading } = useDoc(profileRef);

  const viewerProfileRef = useMemoFirebase(() => (db && currentUser) ? doc(db, 'users', currentUser.uid) : null, [db, currentUser]);
  const { data: viewerProfile, loading: viewerLoading } = useDoc(viewerProfileRef);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const sentInterestQuery = useMemoFirebase(() => {
    if (!db || !currentUser || !id) return null;
    return query(
      collection(db, "interests"),
      where("fromUserId", "==", currentUser.uid),
      where("toUserId", "==", id),
      limit(1)
    );
  }, [db, currentUser, id]);

  const receivedInterestQuery = useMemoFirebase(() => {
    if (!db || !currentUser || !id) return null;
    return query(
      collection(db, "interests"),
      where("fromUserId", "==", id),
      where("toUserId", "==", currentUser.uid),
      limit(1)
    );
  }, [db, currentUser, id]);

  const { data: sentInterests } = useCollection(sentInterestQuery);
  const { data: receivedInterests } = useCollection(receivedInterestQuery);

  const existingSentInterest = sentInterests?.[0];
  const existingReceivedInterest = receivedInterests?.[0];

  // AI Compatibility Logic
  useEffect(() => {
    async function getCompatibility() {
      if (!viewerProfile || !profile || id === currentUser?.uid || aiScore || loadingAi) return;
      
      setLoadingAi(true);
      try {
        const result = await calculateCompatibility({
          viewerProfile: {
            fullName: viewerProfile.fullName,
            age: Number(viewerProfile.age) || 25,
            sect: viewerProfile.sect || 'Other',
            education: viewerProfile.education || '',
            occupation: viewerProfile.occupation || '',
            city: viewerProfile.city || '',
            country: viewerProfile.country || '',
            maritalStatus: viewerProfile.maritalStatus || '',
            lifestyle: viewerProfile.lifestyle || '',
            partnerPreferences: viewerProfile.partnerPreferences || {}
          },
          targetProfile: {
            fullName: profile.fullName,
            age: Number(profile.age) || 25,
            sect: profile.sect || 'Other',
            education: profile.education || '',
            occupation: profile.occupation || '',
            city: profile.city || '',
            country: profile.country || '',
            maritalStatus: profile.maritalStatus || '',
            lifestyle: profile.lifestyle || '',
            partnerPreferences: profile.partnerPreferences || {}
          }
        });
        setAiScore(result);
      } catch (err) {
        console.error("AI Compatibility Error:", err);
      } finally {
        setLoadingAi(false);
      }
    }
    
    if (viewerProfile && profile && !aiScore && !loadingAi && id !== currentUser?.uid) {
      getCompatibility();
    }
  }, [viewerProfile, profile, id, currentUser?.uid, aiScore, loadingAi]);

  useEffect(() => {
    if (db && currentUser && profile && id && currentUser.uid !== id && viewerProfile) {
      const viewerName = viewerProfile.fullName || "A member";
      const viewedRef = collection(db, 'users', id as string, 'notifications');
      
      const lastViewedKey = `viewed_${id}`;
      const lastViewed = localStorage.getItem(lastViewedKey);
      const now = Date.now();
      
      if (!lastViewed || now - parseInt(lastViewed) > 3600000) {
        addDoc(viewedRef, {
          type: 'profile_viewed',
          title: '👀 Profile Viewed',
          message: `${viewerName} viewed your profile. Potential match!`,
          senderId: currentUser.uid,
          receiverId: id,
          read: false,
          createdAt: serverTimestamp()
        });
        localStorage.setItem(lastViewedKey, now.toString());
      }
    }
  }, [db, currentUser, profile, id, viewerProfile]);

  const handleSendInterest = async () => {
    if (!currentUser || !db || !profile || !viewerProfile) return;
    
    if (currentUser.uid === profile.id) return;

    const isAdmin = viewerProfile?.role === 'admin';
    if (!isAdmin && viewerProfile?.status !== 'approved') {
      toast({ title: "Verification Required", description: "Your profile must be approved to send interests.", variant: "destructive" });
      return;
    }

    setIsSending(true);

    const interestData = {
      fromUserId: currentUser.uid,
      fromUserName: viewerProfile.fullName || currentUser.email,
      toUserId: profile.id,
      toUserName: profile.fullName,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const interestRef = collection(db, "interests");
    addDoc(interestRef, interestData)
      .then(() => {
        toast({ title: "Interest Sent", description: "We've notified the member of your interest." });
        
        const notifyRef = collection(db, 'users', profile.id, 'notifications');
        addDoc(notifyRef, {
          type: 'interest_received',
          title: '❤️ Interest Received',
          message: `${viewerProfile.fullName || "A member"} sent you an interest request. Click to respond!`,
          senderId: currentUser.uid,
          receiverId: profile.id,
          read: false,
          createdAt: serverTimestamp()
        });
      })
      .catch(async (e) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({ 
          path: interestRef.path, 
          operation: 'create',
          requestResourceData: interestData
        }));
      })
      .finally(() => setIsSending(false));
  };

  const handleWithdrawInterest = () => {
    if (!db || !existingSentInterest) return;
    if (!confirm("Withdraw this interest request?")) return;

    const interestRef = doc(db, "interests", existingSentInterest.id);
    deleteDoc(interestRef).then(() => {
      toast({ title: "Interest Withdrawn" });
    }).catch(async (e) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({ 
        path: interestRef.path, 
        operation: 'delete' 
      }));
    });
  };

  if (profileLoading || viewerLoading) return <div className="flex h-screen items-center justify-center animate-pulse" />;

  if (!profile) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <Link href="/discover"><Button>Return to Discover</Button></Link>
      </div>
    </div>
  );

  const isSelf = currentUser?.uid === profile.id;
  const isAdmin = viewerProfile?.role === 'admin';
  const currentPlan = viewerProfile?.membership?.plan || "Free";
  const canInteract = isAdmin || (viewerProfile?.status === 'approved' && !viewerProfile?.isSuspended);
  const isMatched = (existingSentInterest?.status === 'accepted') || (existingReceivedInterest?.status === 'accepted');
  
  const canChat = isAdmin || (["Silver", "Gold", "Premium"].includes(currentPlan) && isMatched);
  const hasContactAccess = isAdmin || ["Gold", "Premium"].includes(currentPlan);

  const displayPhotos = profile.photos?.length > 0 ? profile.photos : (profile.photoUrl ? [profile.photoUrl] : []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 lg:px-8 max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Photo Section */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-8">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] bg-muted border-4 border-white">
                {displayPhotos.length > 0 ? (
                  <Carousel setApi={setApi} className="w-full h-full">
                    <CarouselContent>
                      {displayPhotos.map((photo: string, idx: number) => (
                        <CarouselItem key={idx}>
                          <div className="relative aspect-[3/4] w-full">
                            <Image src={photo} alt={`Profile Photo ${idx + 1}`} fill className="object-cover" priority={idx === 0} />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {displayPhotos.length > 1 && (
                      <>
                        <CarouselPrevious className="left-4 bg-white/20 backdrop-blur-md border-none text-white hover:bg-white/40 h-12 w-12" />
                        <CarouselNext className="right-4 bg-white/20 backdrop-blur-md border-none text-white hover:bg-white/40 h-12 w-12" />
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-10">
                          {displayPhotos.map((_: any, i: number) => (
                             <div key={i} className={cn("h-1.5 w-8 rounded-full transition-all duration-300", i === current ? "bg-white w-12 shadow-sm" : "bg-white/30")} />
                          ))}
                        </div>
                      </>
                    )}
                  </Carousel>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                    <User className="h-32 w-32" />
                  </div>
                )}
                {profile.status === 'approved' && (
                   <div className="absolute left-8 top-8 z-20 flex items-center gap-2 rounded-2xl bg-white/95 px-5 py-2.5 text-primary shadow-2xl backdrop-blur-2xl border border-primary/10">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Verified Al Batul Member</span>
                   </div>
                )}
              </div>
              
              <div className="flex flex-col gap-4">
                {isSelf ? (
                  <Link href="/setup-profile" className="flex-1">
                    <Button className="h-16 w-full gap-3 text-xl font-bold rounded-[2rem] shadow-xl">
                      <Edit2 className="h-5 w-5" /> Edit My Profile
                    </Button>
                  </Link>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      {isMatched ? (
                        <Button disabled className="h-16 flex-1 gap-3 text-lg font-bold bg-green-600 text-white border-none opacity-100 shadow-xl rounded-[2rem]">
                          <CheckCircle2 className="h-6 w-6" /> Mutual Match
                        </Button>
                      ) : existingSentInterest ? (
                        <div className="flex flex-col flex-1 gap-3">
                          <Button disabled className="h-16 w-full gap-3 text-lg font-bold bg-muted text-muted-foreground rounded-[2rem]">
                            {existingSentInterest.status === 'pending' ? <Clock className="h-6 w-6" /> : null}
                            Interest {existingSentInterest.status.toUpperCase()}
                          </Button>
                          {existingSentInterest.status === 'pending' && (
                            <Button variant="ghost" className="text-destructive h-12 gap-2 font-bold hover:bg-destructive/5" onClick={handleWithdrawInterest}>
                              <Trash2 className="h-4 w-4" /> Withdraw Request
                            </Button>
                          )}
                        </div>
                      ) : existingReceivedInterest ? (
                        <Link href="/interests" className="flex-1">
                          <Button className="h-16 w-full gap-3 text-lg font-bold bg-primary text-white shadow-xl rounded-[2rem]">
                            {existingReceivedInterest.status === 'pending' ? 'Respond to Interest' : 'View Interaction'}
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          onClick={handleSendInterest} 
                          disabled={isSending || !canInteract}
                          className="h-16 flex-1 gap-3 text-xl font-bold bg-secondary text-primary-foreground shadow-2xl hover:shadow-primary/30 transition-all rounded-[2rem] active:scale-95"
                        >
                          <Heart className="h-6 w-6" /> Send Interest
                        </Button>
                      )}
                      
                      {(isMatched || canChat || isAdmin) && (
                        <Link href={canChat ? "/messages" : "/membership"}>
                          <Button variant="outline" className="h-16 w-16 rounded-[2rem] border-2 shadow-xl bg-white hover:bg-muted transition-all">
                            {canChat ? <MessageSquare className="h-7 w-7" /> : <Lock className="h-7 w-7 text-muted-foreground" />}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-3 space-y-12">
            <div>
              {isAdmin && (
                <Badge className="mb-6 bg-primary text-white border-none font-bold py-1.5 px-4 rounded-xl shadow-lg">SYSTEM ADMINISTRATOR ACCESS</Badge>
              )}
              <div className="mb-8 flex flex-col items-start gap-4">
                <div className="flex flex-wrap items-center gap-6">
                  <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary tracking-tight">{profile.fullName}, {profile.age}</h1>
                  <Badge variant="outline" className="h-10 border-primary/20 bg-primary/5 px-6 text-base font-bold text-primary rounded-2xl">{profile.sect}</Badge>
                </div>
                <ActivityStatus lastActiveAt={profile.lastActiveAt} className="mt-2 bg-white px-4 py-1.5 rounded-full shadow-sm border border-border/50" />
              </div>

              {/* AI Compatibility Score Card */}
              {!isSelf && (
                <Card className="border-none shadow-[0_40px_80px_rgba(0,0,0,0.06)] bg-white overflow-hidden rounded-[3rem] animate-fade-in">
                  <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-headline text-primary flex items-center gap-3">
                      <Sparkles className="h-8 w-8 text-secondary" /> AI Compatibility
                    </CardTitle>
                    {loadingAi ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary opacity-30" />
                    ) : aiScore && (
                      <div className="relative flex items-center justify-center">
                        <svg className="h-16 w-16 -rotate-90">
                           <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
                           <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="175.9" strokeDashoffset={175.9 - (175.9 * aiScore.score) / 100} className="text-secondary transition-all duration-1000" />
                        </svg>
                        <span className="absolute text-sm font-bold text-primary">{aiScore.score}%</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-10 pt-4">
                    {loadingAi ? (
                      <div className="flex flex-col items-center gap-4 py-6">
                        <div className="h-10 w-full bg-muted/40 animate-pulse rounded-2xl" />
                        <div className="h-10 w-2/3 bg-muted/30 animate-pulse rounded-2xl" />
                      </div>
                    ) : aiScore ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                          {aiScore.reasons.map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-accent/30 px-5 py-3 rounded-2xl border border-primary/5">
                              <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                              <p className="text-sm font-medium text-primary/80">{reason}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em] mt-6 flex items-center gap-2">
                           <TrendingUp className="h-3 w-3" /> Predictive compatibility analysis for marriage
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 py-6 text-muted-foreground opacity-50">
                        <AlertCircle className="h-6 w-6" />
                        <p className="text-sm font-medium">Complete your profile preferences to see compatibility insights.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
               {[
                { label: "Location", val: `${profile.city}, ${profile.country}`, icon: "📍" },
                { label: "Marital Status", val: profile.maritalStatus || "Single", icon: "💍" },
                { label: "Education", val: profile.education || "Professional Degree", icon: "🎓" },
                { label: "Occupation", val: profile.occupation || "Independent Professional", icon: "💼" }
               ].map((item, i) => (
                 <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-border/40 hover:scale-105 transition-transform">
                   <span className="text-2xl mb-3 block">{item.icon}</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">{item.label}</span>
                   <p className="font-bold text-primary leading-snug">{item.val}</p>
                 </div>
               ))}
            </div>

            <section>
              <h3 className="mb-6 text-3xl font-bold font-headline text-primary border-b-2 border-primary/10 pb-4">Personal Narrative</h3>
              <p className="text-xl leading-relaxed text-muted-foreground/80 whitespace-pre-wrap font-medium">
                {profile.about || "This member is currently finalizing their personal introduction. Check back soon for more deep insights into their values and aspirations."}
              </p>
            </section>

            <section>
              <h3 className="mb-8 text-3xl font-bold font-headline text-primary border-b-2 border-primary/10 pb-4 flex items-center gap-4">
                <Phone className="h-8 w-8" /> Connection Details
              </h3>
              {hasContactAccess ? (
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="rounded-[2.5rem] bg-white p-10 shadow-2xl border-none flex items-center gap-6 group hover:bg-muted/50 transition-all">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Phone className="h-8 w-8" /></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Direct Mobile</p><p className="text-2xl font-bold text-primary font-headline">{profile.mobileNumber}</p></div>
                  </div>
                  {profile.whatsAppNumber && (
                    <div className="rounded-[2.5rem] bg-white p-10 shadow-2xl border-none flex items-center gap-6 group hover:bg-muted/50 transition-all">
                      <div className="h-16 w-16 rounded-[1.5rem] bg-green-50 text-green-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><MessageCircle className="h-8 w-8" /></div>
                      <div><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">WhatsApp Verified</p><p className="text-2xl font-bold text-green-700 font-headline">{profile.whatsAppNumber}</p></div>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="rounded-[3.5rem] bg-muted/20 border-4 border-dashed border-border/50 p-16 text-center shadow-inner">
                  <div className="h-24 w-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl"><Lock className="h-12 w-12 text-primary/30" /></div>
                  <h4 className="text-3xl font-headline font-bold mb-4 text-primary">Sacred Boundary</h4>
                  <p className="text-muted-foreground text-lg mb-10 leading-relaxed max-w-sm mx-auto font-medium">Direct contact information is shared exclusively with verified **Gold & Premium** members to ensure a safe and respectful environment.</p>
                  <Link href="/membership"><Button className="h-16 px-12 gap-3 text-xl font-bold shadow-2xl rounded-[2rem] bg-primary hover:scale-105 transition-transform"><Crown className="h-6 w-6 text-secondary" /> Access Direct Contact</Button></Link>
                </Card>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
