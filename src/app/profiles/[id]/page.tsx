
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Heart, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  ShieldCheck, 
  Flag, 
  Ban, 
  MessageSquare,
  User,
  DollarSign,
  Ruler,
  Scale,
  Languages,
  Lock,
  Phone,
  MessageCircle,
  Crown,
  CheckCircle2,
  Clock
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where, addDoc, serverTimestamp, limit } from "firebase/firestore";
import { format } from "date-fns";
import Link from "next/link";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

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

  // Check for existing interest request
  const interestQuery = useMemoFirebase(() => {
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

  const { data: sentInterests } = useCollection(interestQuery);
  const { data: receivedInterests } = useCollection(receivedInterestQuery);

  const existingSentInterest = sentInterests?.[0];
  const existingReceivedInterest = receivedInterests?.[0];

  const handleSendInterest = () => {
    if (!currentUser || !db || !profile) return;
    
    if (viewerProfile?.status !== 'approved') {
      toast({
        title: "Account Restricted",
        description: "Your profile must be approved by an admin before you can send interests.",
        variant: "destructive"
      });
      return;
    }

    if (existingSentInterest) {
      toast({ title: "Already Sent", description: "You have already sent an interest request to this member." });
      return;
    }

    setIsSending(true);
    const interestData = {
      fromUserId: currentUser.uid,
      fromUserName: viewerProfile?.fullName || viewerProfile?.name || currentUser.email,
      toUserId: profile.id,
      toUserName: profile.fullName,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const interestRef = collection(db, "interests");
    addDoc(interestRef, interestData)
      .then(() => {
        toast({
          title: "Interest Sent",
          description: `We've notified ${profile.fullName} of your interest.`,
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

  if (profileLoading || viewerLoading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-xl font-medium text-muted-foreground">Profile not found.</p>
        <Link href="/discover" className="mt-4">
          <Button variant="link">Back to Discover</Button>
        </Link>
      </div>
    </div>
  );

  const canInteract = viewerProfile?.status === 'approved' && !viewerProfile?.isSuspended && !viewerProfile?.isBanned;
  const isMatched = (existingSentInterest?.status === 'accepted') || (existingReceivedInterest?.status === 'accepted');
  const hasContactAccess = viewerProfile?.membership?.plan && ['Gold', 'Premium', 'Prime'].includes(viewerProfile.membership.plan);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-2xl bg-muted">
                <Image 
                  src={profile.photoUrl || `https://picsum.photos/seed/${profile.id}/600/800`} 
                  alt={profile.fullName || "User Profile"} 
                  fill 
                  className="object-cover" 
                />
                {profile.status === 'approved' && (
                   <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-primary shadow-lg backdrop-blur-md">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="text-sm font-bold">Verified Member</span>
                   </div>
                )}
              </div>
              
              <div className="flex flex-col gap-4">
                {!canInteract && (
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-2xl text-xs text-muted-foreground border border-dashed text-center justify-center">
                    <Lock className="h-4 w-4" />
                    Account verification required to interact.
                  </div>
                )}
                
                <div className="flex gap-4">
                  {existingSentInterest ? (
                    <Button 
                      disabled 
                      className="h-14 flex-1 gap-2 text-lg font-bold bg-muted text-muted-foreground cursor-not-allowed"
                    >
                      {existingSentInterest.status === 'pending' ? <Clock className="h-5 w-5" /> : existingSentInterest.status === 'accepted' ? <CheckCircle2 className="h-5 w-5" /> : <X className="h-5 w-5" />}
                      Interest {existingSentInterest.status.charAt(0).toUpperCase() + existingSentInterest.status.slice(1)}
                    </Button>
                  ) : existingReceivedInterest ? (
                    <Link href="/interests" className="flex-1">
                      <Button className="h-14 w-full gap-2 text-lg font-bold bg-primary text-white">
                        <Heart className="h-5 w-5 fill-white" />
                        Handle Request
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      onClick={handleSendInterest} 
                      disabled={isSending || profile.status !== 'approved' || !canInteract}
                      className="h-14 flex-1 gap-2 text-lg font-bold bg-secondary hover:bg-secondary/90 text-primary-foreground"
                    >
                      <Heart className={`h-5 w-5 ${isSending ? 'animate-pulse' : ''}`} />
                      {isSending ? 'Sending...' : 'Send Interest'}
                    </Button>
                  )}
                  
                  <Link href={isMatched ? "/messages" : "#"} className={!isMatched ? "opacity-50 cursor-not-allowed" : ""}>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-14 w-14" 
                      disabled={!canInteract || !isMatched}
                      onClick={() => {
                        if (!isMatched) {
                          toast({ 
                            title: "Connection Required", 
                            description: "Mutual interest must be accepted to unlock private chat.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <MessageSquare className="h-6 w-6" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 text-muted-foreground">
                <button className="flex items-center gap-1 hover:text-destructive text-sm font-medium">
                  <Flag className="h-4 w-4" /> Report
                </button>
                <button className="flex items-center gap-1 hover:text-destructive text-sm font-medium">
                  <Ban className="h-4 w-4" /> Block
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <h1 className="text-5xl font-bold font-headline">{profile.fullName}, {profile.age}</h1>
              <Badge variant="outline" className="h-8 border-primary/20 bg-primary/5 px-4 text-sm text-primary">{profile.sect}</Badge>
              <Badge variant="outline" className="h-8 border-secondary/20 bg-secondary/5 px-4 text-sm text-secondary">{profile.maritalStatus}</Badge>
            </div>

            <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Location</span>
                </div>
                <p className="font-medium">{profile.city}, {profile.country}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Education</span>
                </div>
                <p className="font-medium">{profile.education}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Occupation</span>
                </div>
                <p className="font-medium">{profile.occupation}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Ruler className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Height</span>
                </div>
                <p className="font-medium">{profile.height || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Scale className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Weight</span>
                </div>
                <p className="font-medium">{profile.weight || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Languages className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Languages</span>
                </div>
                <p className="font-medium">{profile.languagesSpoken?.join(', ') || 'N/A'}</p>
              </div>
            </div>

            <section className="mb-12">
              <h3 className="mb-4 text-2xl font-bold font-headline border-b pb-2">About Me</h3>
              <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {profile.about}
              </p>
            </section>

            <section className="mb-12">
              <h3 className="mb-6 text-2xl font-bold font-headline border-b pb-2 flex items-center gap-2">
                <Phone className="h-6 w-6 text-primary" /> Contact Details
              </h3>
              {hasContactAccess ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-6 shadow-sm border border-border flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mobile Number</p>
                      <p className="font-bold text-lg">{profile.mobileNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  {profile.whatsAppNumber && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-border flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">WhatsApp</p>
                        <p className="font-bold text-lg">{profile.whatsAppNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl bg-muted/30 border-2 border-dashed border-border p-10 text-center">
                  <Lock className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-lg font-bold mb-2">Details Locked</p>
                  <p className="text-sm text-muted-foreground mb-6">Upgrade to Gold+ membership to view contact details.</p>
                  <Link href="/membership">
                    <Button className="gap-2 bg-primary text-white font-bold h-11 px-8">
                      <Crown className="h-4 w-4" />
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              )}
            </section>

            <div className="grid gap-8 md:grid-cols-2">
              <section className="rounded-3xl bg-white p-8 shadow-sm border border-border/50">
                <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Details & Values
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-muted py-2">
                    <span className="text-muted-foreground text-sm">Date of Birth</span>
                    <span className="font-medium text-sm">{profile.dob || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-muted py-2">
                    <span className="text-muted-foreground text-sm">Annual Income</span>
                    <span className="font-medium text-sm flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> {profile.income || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-muted py-2">
                    <span className="text-muted-foreground text-sm">Last Active</span>
                    <span className="font-medium text-sm italic">
                      {profile.lastActiveAt ? format(new Date(profile.lastActiveAt), 'MMM dd, HH:mm') : 'Recently'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl bg-primary/5 p-8 shadow-sm border border-primary/10">
                <h3 className="mb-6 text-xl font-bold flex items-center gap-2 text-primary">
                  <Heart className="h-5 w-5" /> Looking For
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-primary/10 py-2">
                    <span className="text-muted-foreground text-sm">Age Range</span>
                    <span className="font-medium text-sm">
                      {profile.partnerPreferences?.minAge || 18} - {profile.partnerPreferences?.maxAge || 40} Years
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-primary/10 py-2">
                    <span className="text-muted-foreground text-sm">Sect Preference</span>
                    <span className="font-medium text-sm">{profile.partnerPreferences?.sect || 'Any'}</span>
                  </div>
                  <div className="flex justify-between border-b border-primary/10 py-2">
                    <span className="text-muted-foreground text-sm">Min. Education</span>
                    <span className="font-medium text-sm">{profile.partnerPreferences?.education || 'Any'}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
