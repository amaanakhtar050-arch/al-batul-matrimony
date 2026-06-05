
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  Edit2
} from "lucide-react";
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

  const profileRef = useMemoFirebase(() => id ? doc(db!, 'users', id as string) : null, [db, id]);
  const { data: profile, loading: profileLoading } = useDoc(profileRef);

  const viewerProfileRef = useMemoFirebase(() => (db && currentUser) ? doc(db, 'users', currentUser.uid) : null, [db, currentUser]);
  const { data: viewerProfile, loading: viewerLoading } = useDoc(viewerProfileRef);

  // Check if I sent an interest
  const sentInterestQuery = useMemoFirebase(() => {
    if (!db || !currentUser || !id) return null;
    return query(
      collection(db, "interests"),
      where("fromUserId", "==", currentUser.uid),
      where("toUserId", "==", id),
      limit(1)
    );
  }, [db, currentUser, id]);

  // Check if I received an interest
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

  // Logic for "Profile viewed" notification
  useEffect(() => {
    if (db && currentUser && profile && id && currentUser.uid !== id) {
      const viewerName = viewerProfile?.fullName || "A member";
      const viewedRef = collection(db, 'users', id as string, 'notifications');
      
      // Simple debounce to prevent notification spam on every refresh
      const lastViewedKey = `viewed_${id}`;
      const lastViewed = localStorage.getItem(lastViewedKey);
      const now = Date.now();
      
      if (!lastViewed || now - parseInt(lastViewed) > 3600000) { // Notify once an hour
        addDoc(viewedRef, {
          text: `${viewerName} viewed your profile.`,
          read: false,
          createdAt: serverTimestamp()
        });
        localStorage.setItem(lastViewedKey, now.toString());
      }
    }
  }, [db, currentUser, profile, id, viewerProfile]);

  const handleSendInterest = async () => {
    if (!currentUser || !db || !profile) return;
    
    if (currentUser.uid === profile.id) {
      toast({ title: "Not Possible", description: "You cannot send an interest to yourself.", variant: "destructive" });
      return;
    }

    const isAdmin = viewerProfile?.role === 'admin';
    if (!isAdmin && viewerProfile?.status !== 'approved') {
      toast({ title: "Verification Required", description: "Your profile must be approved to send interests.", variant: "destructive" });
      return;
    }

    if (existingSentInterest || existingReceivedInterest) {
      toast({ title: "Interaction Exists", description: "You already have an active interaction with this member." });
      return;
    }

    setIsSending(true);

    const interestData = {
      fromUserId: currentUser.uid,
      fromUserName: viewerProfile?.fullName || currentUser.email,
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
        
        // Notify recipient
        const notifyRef = collection(db, 'users', profile.id, 'notifications');
        addDoc(notifyRef, {
          text: `${viewerProfile?.fullName || "A member"} sent you an interest request.`,
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-2xl bg-muted border border-border">
                {profile.photoUrl ? (
                  <Image src={profile.photoUrl} alt="Profile" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                    <User className="h-32 w-32" />
                  </div>
                )}
                {profile.status === 'approved' && (
                   <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-primary shadow-lg backdrop-blur-md">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="text-sm font-bold">Verified Member</span>
                   </div>
                )}
              </div>
              
              <div className="flex flex-col gap-4">
                {isSelf ? (
                  <Link href="/setup-profile" className="flex-1">
                    <Button className="h-14 w-full gap-2 text-lg font-bold">
                      <Edit2 className="h-5 w-5" /> Edit My Profile
                    </Button>
                  </Link>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      {isMatched ? (
                        <div className="flex flex-col flex-1 gap-2">
                          <Button disabled className="h-14 w-full gap-2 text-lg font-bold bg-green-600 text-white border-none opacity-100">
                            <CheckCircle2 className="h-5 w-5" /> Mutual Match
                          </Button>
                        </div>
                      ) : existingSentInterest ? (
                        <div className="flex flex-col flex-1 gap-2">
                          <Button disabled className="h-14 w-full gap-2 text-lg font-bold bg-muted text-muted-foreground">
                            {existingSentInterest.status === 'pending' ? <Clock className="h-5 w-5" /> : null}
                            Interest {existingSentInterest.status.toUpperCase()}
                          </Button>
                          {existingSentInterest.status === 'pending' && (
                            <Button variant="ghost" className="text-destructive h-10 gap-2" onClick={handleWithdrawInterest}>
                              <Trash2 className="h-4 w-4" /> Withdraw Request
                            </Button>
                          )}
                        </div>
                      ) : existingReceivedInterest ? (
                        <Link href="/interests" className="flex-1">
                          <Button className="h-14 w-full gap-2 text-lg font-bold bg-primary text-white">
                            {existingReceivedInterest.status === 'pending' ? 'Respond to Interest' : 'View Interaction'}
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          onClick={handleSendInterest} 
                          disabled={isSending || !canInteract}
                          className="h-14 flex-1 gap-2 text-lg font-bold bg-secondary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                        >
                          <Heart className="h-5 w-5" /> Send Interest
                        </Button>
                      )}
                      
                      {(isMatched || canChat || isAdmin) && (
                        <Link href={canChat ? "/messages" : "/membership"} className={!canChat ? "opacity-70" : ""}>
                          <Button variant="outline" size="icon" className="h-14 w-14">
                            {canChat ? <MessageSquare className="h-6 w-6" /> : <Lock className="h-6 w-6 text-muted-foreground" />}
                          </Button>
                        </Link>
                      )}
                    </div>
                    {isMatched && !canChat && !isAdmin && (
                        <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl text-orange-800 text-[10px] leading-relaxed">
                          <Crown className="h-3 w-3 shrink-0 mt-0.5" />
                          <p>You've matched! To start the conversation, please upgrade to a <strong>Silver Plan</strong> or higher.</p>
                        </div>
                    )}
                    {(isMatched || isAdmin) && canChat && (
                      <Link href="/messages" className="w-full">
                        <Button className="w-full h-11 gap-2 font-bold shadow-md" variant="secondary">
                           <MessageSquare className="h-4 w-4" /> Start Conversation Now
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {isAdmin && (
              <Badge className="mb-4 bg-primary text-white border-none font-bold">ADMIN TESTING MODE ACTIVE</Badge>
            )}
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <h1 className="text-5xl font-bold font-headline">{profile.fullName}, {profile.age}</h1>
              <Badge variant="outline" className="h-8 border-primary/20 bg-primary/5 px-4 text-sm text-primary">{profile.sect}</Badge>
            </div>

            <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location</span>
                <p className="font-medium text-sm">{profile.city}, {profile.country}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marital Status</span>
                <p className="font-medium text-sm">{profile.maritalStatus || "Single"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Education</span>
                <p className="font-medium text-sm">{profile.education}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Occupation</span>
                <p className="font-medium text-sm">{profile.occupation}</p>
              </div>
            </div>

            <section className="mb-12">
              <h3 className="mb-4 text-2xl font-bold font-headline border-b pb-2">About Me</h3>
              <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {profile.about || "This member has not written a bio yet."}
              </p>
            </section>

            <section className="mb-12">
              <h3 className="mb-6 text-2xl font-bold font-headline border-b pb-2 flex items-center gap-2">
                <Phone className="h-6 w-6 text-primary" /> Contact Information
              </h3>
              {hasContactAccess ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-6 shadow-sm border border-border flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Phone className="h-6 w-6" /></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground">MOBILE</p><p className="font-bold">{profile.mobileNumber}</p></div>
                  </div>
                  {profile.whatsAppNumber && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-border flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><MessageCircle className="h-6 w-6" /></div>
                      <div><p className="text-[10px] font-bold text-muted-foreground">WHATSAPP</p><p className="font-bold">{profile.whatsAppNumber}</p></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl bg-muted/30 border-2 border-dashed border-border p-10 text-center">
                  <Lock className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-lg font-bold mb-2">Details Locked</p>
                  <p className="text-sm text-muted-foreground mb-6">Upgrade to Gold+ to unlock direct contact information.</p>
                  <Link href="/membership"><Button className="gap-2 px-8 h-11 font-bold"><Crown className="h-4 w-4" /> Upgrade Now</Button></Link>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
