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
  AlertCircle,
  Loader2,
  ShieldAlert,
  Ban,
  MoreVertical,
  Flag
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { 
  doc, 
  collection, 
  query, 
  where, 
  addDoc, 
  serverTimestamp, 
  limit, 
  deleteDoc,
  or,
  and 
} from "firebase/firestore";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ActivityStatus } from "@/components/profile/ActivityStatus";
import { calculateCompatibility, CalculateCompatibilityOutput } from "@/ai/flows/calculate-compatibility";

const REPORT_CATEGORIES = [
  "Fake profile",
  "Harassment",
  "Inappropriate content",
  "Spam",
  "Scammer",
  "Other"
];

export default function ProfileDetailClient({ id }: { id: string }) {
  const { toast } = useToast();
  const db = useFirestore();
  const router = useRouter();
  const { user: currentUser } = useUser();
  
  const [isSending, setIsSending] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportCategory, setReportCategory] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [aiScore, setAiScore] = useState<CalculateCompatibilityOutput | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'users', id);
  }, [db, id]);
  
  const { data: profile, loading: profileLoading } = useDoc(profileRef);

  const viewerProfileRef = useMemoFirebase(() => {
    if (!db || !currentUser) return null;
    return doc(db, 'users', currentUser.uid);
  }, [db, currentUser]);
  
  const { data: viewerProfile, loading: viewerLoading } = useDoc(viewerProfileRef);

  const blockQuery = useMemoFirebase(() => {
    if (!db || !currentUser || !id) return null;
    return query(
      collection(db, "blocks"),
      or(
        and(where("blockerId", "==", currentUser.uid), where("blockedId", "==", id)),
        and(where("blockerId", "==", id), where("blockedId", "==", currentUser.uid))
      )
    );
  }, [db, currentUser, id]);

  const { data: blockRecords, loading: blockLoading } = useCollection(blockQuery);
  const isBlockedRelationship = blockRecords && blockRecords.length > 0;
  const iBlockedThem = blockRecords?.find(b => b.blockerId === currentUser?.uid);

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

  useEffect(() => {
    async function getCompatibility() {
      if (!viewerProfile || !profile || id === currentUser?.uid || aiScore || loadingAi || isBlockedRelationship) return;
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
    if (viewerProfile && profile && !aiScore && !loadingAi && id !== currentUser?.uid && !isBlockedRelationship) {
      getCompatibility();
    }
  }, [viewerProfile, profile, id, currentUser?.uid, aiScore, loadingAi, isBlockedRelationship]);

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
    addDoc(collection(db, "interests"), interestData)
      .then(() => {
        toast({ title: "Interest Sent" });
        addDoc(collection(db, 'users', profile.id, 'notifications'), {
          type: 'interest_received',
          title: '❤️ Interest Received',
          message: `${viewerProfile.fullName || "A member"} sent you an interest request.`,
          senderId: currentUser.uid,
          receiverId: profile.id,
          read: false,
          createdAt: serverTimestamp()
        });
      })
      .finally(() => setIsSending(false));
  };

  const handleBlockUser = async () => {
    if (!db || !currentUser || !id) return;
    setIsBlocking(true);
    const blockData = {
      blockerId: currentUser.uid,
      blockedId: id,
      createdAt: serverTimestamp()
    };
    addDoc(collection(db, "blocks"), blockData)
      .then(() => {
        toast({ title: "User Blocked", description: "This member will no longer be visible to you." });
        router.push('/discover');
      })
      .finally(() => setIsBlocking(false));
  };

  const handleUnblockUser = async () => {
    if (!db || !iBlockedThem) return;
    deleteDoc(doc(db, "blocks", iBlockedThem.id)).then(() => {
      toast({ title: "User Unblocked" });
    });
  };

  const handleReportUser = async () => {
    if (!db || !currentUser || !id || !reportCategory) return;
    setIsReporting(true);
    const reportData = {
      reporterId: currentUser.uid,
      reportedId: id,
      reportedName: profile?.fullName || "Member",
      category: reportCategory,
      reason: reportReason,
      status: "pending",
      createdAt: serverTimestamp()
    };
    addDoc(collection(db, "reports"), reportData)
      .then(() => {
        toast({ title: "Report Submitted", description: "Administration will review this case within 24 hours." });
        setShowReportDialog(false);
      })
      .finally(() => setIsReporting(false));
  };

  if (profileLoading || viewerLoading || blockLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (!profile || (isBlockedRelationship && !iBlockedThem)) return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="h-20 w-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6"><Ban className="h-10 w-10 text-muted-foreground/30" /></div>
        <h1 className="text-2xl font-bold mb-4 font-headline">Profile Not Found</h1>
        <p className="text-muted-foreground mb-8">This profile may have been removed or is no longer available.</p>
        <Link href="/discover"><Button className="rounded-xl px-8 h-12 font-bold">Return to Discover</Button></Link>
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
      <main className="container mx-auto px-4 py-8 md:py-12 lg:px-8 max-w-7xl">
        <div className="grid gap-8 md:gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6 md:space-y-8">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl md:rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] bg-muted border-4 border-white">
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
                        <CarouselPrevious className="left-4 bg-white/20 backdrop-blur-md border-none text-white hover:bg-white/40 h-10 w-10 md:h-12 md:w-12" />
                        <CarouselNext className="right-4 bg-white/20 backdrop-blur-md border-none text-white hover:bg-white/40 h-10 w-10 md:h-12 md:w-12" />
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1 md:gap-1.5 z-10">
                          {displayPhotos.map((_: any, i: number) => (
                             <div key={i} className={cn("h-1 md:h-1.5 w-6 md:w-8 rounded-full transition-all duration-300", i === current ? "bg-white w-10 md:w-12 shadow-sm" : "bg-white/30")} />
                          ))}
                        </div>
                      </>
                    )}
                  </Carousel>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                    <User className="h-24 w-24 md:h-32 md:w-32" />
                  </div>
                )}
                {profile.status === 'approved' && (
                   <div className="absolute left-4 top-4 md:left-8 md:top-8 z-20 flex items-center gap-2 rounded-xl md:rounded-2xl bg-white/95 px-3 py-2 md:px-5 md:py-2.5 text-primary shadow-2xl backdrop-blur-2xl border border-primary/10">
                      <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest">Verified Al Batul Member</span>
                   </div>
                )}
              </div>
              
              <div className="flex flex-col gap-4">
                {isSelf ? (
                  <Link href="/setup-profile" className="flex-1 w-full">
                    <Button className="h-14 md:h-16 w-full gap-3 text-lg md:text-xl font-bold rounded-2xl md:rounded-[2rem] shadow-xl">
                      <Edit2 className="h-5 w-5" /> Edit My Profile
                    </Button>
                  </Link>
                ) : (
                  <div className="flex flex-col gap-4 w-full">
                    {iBlockedThem ? (
                       <Button onClick={handleUnblockUser} variant="outline" className="h-14 md:h-16 w-full text-destructive border-destructive/20 hover:bg-destructive/5 rounded-2xl font-bold">Unblock Member</Button>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-4">
                        {isMatched ? (
                          <Button disabled className="h-14 md:h-16 flex-1 gap-3 text-base md:text-lg font-bold bg-green-600 text-white border-none opacity-100 shadow-xl rounded-2xl md:rounded-[2rem]">
                            <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" /> Mutual Match
                          </Button>
                        ) : existingSentInterest ? (
                          <div className="flex flex-col flex-1 gap-3">
                            <Button disabled className="h-14 md:h-16 w-full gap-3 text-base md:text-lg font-bold bg-muted text-muted-foreground rounded-2xl md:rounded-[2rem]">
                              {existingSentInterest.status === 'pending' ? <Clock className="h-5 w-5 md:h-6 md:w-6" /> : null}
                              Interest {existingSentInterest.status.toUpperCase()}
                            </Button>
                          </div>
                        ) : existingReceivedInterest ? (
                          <Link href="/interests" className="flex-1 w-full">
                            <Button className="h-14 md:h-16 w-full gap-3 text-base md:text-lg font-bold bg-primary text-white shadow-xl rounded-2xl md:rounded-[2rem]">
                              Respond to Interest
                            </Button>
                          </Link>
                        ) : (
                          <Button 
                            onClick={handleSendInterest} 
                            disabled={isSending || !canInteract}
                            className="h-14 md:h-16 flex-1 gap-3 text-lg md:text-xl font-bold bg-secondary text-primary-foreground shadow-2xl hover:shadow-primary/30 transition-all rounded-2xl md:rounded-[2rem] active:scale-95"
                          >
                            <Heart className="h-5 w-5 md:h-6 md:w-6" /> Send Interest
                          </Button>
                        )}
                        
                        <div className="flex gap-4">
                          {(isMatched || canChat || isAdmin) && (
                            <Link href={canChat ? "/messages" : "/membership"} className="flex-1 sm:w-auto">
                              <Button variant="outline" className="h-14 md:h-16 w-full sm:w-16 rounded-2xl md:rounded-[2rem] border-2 shadow-xl bg-white hover:bg-muted transition-all">
                                {canChat ? <MessageSquare className="h-6 w-6 md:h-7 md:w-7" /> : <Lock className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />}
                                <span className="ml-2 sm:hidden font-bold">{canChat ? "Message" : "Unlock Chat"}</span>
                              </Button>
                            </Link>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className="h-14 w-14 md:h-16 md:w-16 rounded-2xl md:rounded-[2rem] border-2 shadow-sm bg-white"><MoreVertical className="h-5 w-5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl p-2 w-48 shadow-2xl border-none">
                              <DropdownMenuItem className="rounded-xl gap-2 font-bold text-destructive focus:bg-destructive/5 cursor-pointer py-3" onClick={handleBlockUser}>
                                <Ban className="h-4 w-4" /> Block Member
                              </DropdownMenuItem>
                              <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem className="rounded-xl gap-2 font-bold focus:bg-muted cursor-pointer py-3" onSelect={(e) => e.preventDefault()}>
                                    <Flag className="h-4 w-4" /> Report Profile
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent className="rounded-[2rem] p-8 max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle className="text-2xl font-headline text-primary">Report Member</DialogTitle>
                                    <DialogDescription>Your report is strictly confidential and helps us keep Al Batul safe.</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6 py-4">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Violation Category</label>
                                      <Select onValueChange={setReportCategory}>
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                          {REPORT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detailed Reason</label>
                                      <Textarea placeholder="Please describe the issue..." className="min-h-[120px] rounded-xl bg-muted/30 border-none focus-visible:bg-white transition-all" value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button className="w-full h-12 rounded-xl font-bold bg-primary text-white" disabled={isReporting || !reportCategory} onClick={handleReportUser}>
                                      {isReporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Report"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-8 md:space-y-12">
            <div>
              {isAdmin && (
                <Badge className="mb-4 md:mb-6 bg-primary text-white border-none font-bold py-1 px-3 md:py-1.5 md:px-4 rounded-xl shadow-lg">SYSTEM ADMINISTRATOR ACCESS</Badge>
              )}
              <div className="mb-6 md:mb-8 flex flex-col items-start gap-4">
                <div className="flex flex-wrap items-center gap-3 md:gap-6">
                  <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold font-headline text-primary tracking-tight">{profile.fullName}, {profile.age}</h1>
                  <Badge variant="outline" className="h-8 md:h-10 border-primary/20 bg-primary/5 px-4 md:px-6 text-sm md:text-base font-bold text-primary rounded-xl md:rounded-2xl">{profile.sect}</Badge>
                </div>
                <ActivityStatus lastActiveAt={profile.lastActiveAt} className="mt-1 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm border border-border/50" />
              </div>

              {!isSelf && !iBlockedThem && (
                <Card className="border-none shadow-[0_40px_80px_rgba(0,0,0,0.06)] bg-white overflow-hidden rounded-2xl md:rounded-[3rem] animate-fade-in">
                  <CardHeader className="p-6 md:p-10 pb-4 md:pb-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl md:text-2xl font-headline text-primary flex items-center gap-2 md:gap-3">
                      <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-secondary" /> AI Compatibility
                    </CardTitle>
                    {loadingAi ? (
                      <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-primary opacity-30" />
                    ) : aiScore && (
                      <div className="relative flex items-center justify-center">
                        <svg className="h-12 w-12 md:h-16 md:w-16 -rotate-90">
                           <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                           <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * aiScore.score) / 100} className="text-secondary transition-all duration-1000" />
                        </svg>
                        <span className="absolute text-[10px] md:text-sm font-bold text-primary">{aiScore.score}%</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-6 md:p-10 pt-2 md:pt-4">
                    {loadingAi ? (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <div className="h-8 w-full bg-muted/40 animate-pulse rounded-xl" />
                        <div className="h-8 w-2/3 bg-muted/30 animate-pulse rounded-xl" />
                      </div>
                    ) : aiScore ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 md:gap-3">
                          {aiScore.reasons.map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-2 md:gap-3 bg-accent/30 px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl border border-primary/5">
                              <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-secondary shrink-0" />
                              <p className="text-xs md:text-sm font-medium text-primary/80">{reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 py-4 text-muted-foreground opacity-50">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-xs md:text-sm font-medium">Complete your profile preferences to see compatibility insights.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid gap-4 md:gap-8 grid-cols-2 lg:grid-cols-4">
               {[
                { label: "Location", val: `${profile.city}, ${profile.country}`, icon: "📍" },
                { label: "Marital Status", val: profile.maritalStatus || "Single", icon: "💍" },
                { label: "Education", val: profile.education || "Professional Degree", icon: "🎓" },
                { label: "Occupation", val: profile.occupation || "Independent Professional", icon: "💼" }
               ].map((item, i) => (
                 <div key={i} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl border border-border/40 hover:scale-105 transition-transform">
                   <span className="text-xl md:text-2xl mb-2 md:mb-3 block">{item.icon}</span>
                   <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1 md:mb-2">{item.label}</span>
                   <p className="font-bold text-primary leading-snug text-sm md:text-base">{item.val}</p>
                 </div>
               ))}
            </div>

            <section>
              <h3 className="mb-4 md:mb-6 text-2xl md:text-3xl font-bold font-headline text-primary border-b-2 border-primary/10 pb-3 md:pb-4">Personal Narrative</h3>
              <p className="text-base md:text-xl leading-relaxed text-muted-foreground/80 whitespace-pre-wrap font-medium">
                {profile.about || "This member is currently finalizing their personal introduction."}
              </p>
            </section>

            <section>
              <h3 className="mb-6 md:mb-8 text-2xl md:text-3xl font-bold font-headline text-primary border-b-2 border-primary/10 pb-3 md:pb-4 flex items-center gap-3 md:gap-4">
                <Phone className="h-6 w-6 md:h-8 md:w-8" /> Connection Details
              </h3>
              {hasContactAccess ? (
                <div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-2">
                  <div className="rounded-2xl md:rounded-[2.5rem] bg-white p-6 md:p-10 shadow-2xl border-none flex items-center gap-4 md:gap-6 group hover:bg-muted/50 transition-all">
                    <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Phone className="h-6 w-6 md:h-8 md:w-8" /></div>
                    <div><p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 md:mb-1">Direct Mobile</p><p className="text-lg md:text-2xl font-bold text-primary font-headline">{profile.mobileNumber}</p></div>
                  </div>
                  {profile.whatsAppNumber && (
                    <div className="rounded-2xl md:rounded-[2.5rem] bg-white p-6 md:p-10 shadow-2xl border-none flex items-center gap-4 md:gap-6 group hover:bg-muted/50 transition-all">
                      <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-[1.5rem] bg-green-50 text-green-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><MessageCircle className="h-6 w-6 md:h-8 md:w-8" /></div>
                      <div><p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 md:mb-1">WhatsApp Verified</p><p className="text-lg md:text-2xl font-bold text-green-700 font-headline">{profile.whatsAppNumber}</p></div>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="rounded-2xl md:rounded-[3.5rem] bg-muted/20 border-4 border-dashed border-border/50 p-8 md:p-16 text-center shadow-inner">
                  <div className="h-16 w-16 md:h-24 md:w-24 bg-primary/5 rounded-xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-xl"><Lock className="h-8 w-8 md:h-12 md:w-12 text-primary/30" /></div>
                  <h4 className="text-2xl md:text-3xl font-headline font-bold mb-3 md:mb-4 text-primary">Sacred Boundary</h4>
                  <p className="text-muted-foreground text-sm md:text-lg mb-8 md:mb-10 leading-relaxed max-w-sm mx-auto font-medium">Direct contact information is shared exclusively with verified **Gold & Premium** members.</p>
                  <Link href="/membership" className="w-full inline-block">
                    <Button className="h-14 md:h-16 px-8 md:px-12 gap-2 md:gap-3 text-lg md:text-xl font-bold shadow-2xl rounded-xl md:rounded-[2rem] bg-primary hover:scale-105 transition-transform w-full sm:w-auto">
                      <Crown className="h-5 w-5 md:h-6 md:w-6 text-secondary" /> Access Direct Contact
                    </Button>
                  </Link>
                </Card>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}