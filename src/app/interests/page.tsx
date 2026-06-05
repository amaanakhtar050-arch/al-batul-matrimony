
'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Heart, Check, X, User, MessageSquare, Users, Trash2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, updateDoc, doc, serverTimestamp, orderBy, deleteDoc, addDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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

export default function InterestsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const receivedQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "interests"), 
      where("toUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const sentQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "interests"), 
      where("fromUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: receivedInterests, loading: loadingReceived } = useCollection(receivedQuery);
  const { data: sentInterests, loading: loadingSent } = useCollection(sentQuery);

  const handleUpdateStatus = (interestId: string, status: 'accepted' | 'declined', partnerId: string) => {
    if (!db || !user) return;
    const interestRef = doc(db, "interests", interestId);
    updateDoc(interestRef, {
      status,
      updatedAt: serverTimestamp()
    }).then(() => {
      toast({
        title: status === 'accepted' ? "Interest Accepted" : "Interest Declined",
        description: status === 'accepted' ? "You can now chat with this member." : "Request declined.",
      });

      // Notify the requester
      const notifyRef = collection(db, 'users', partnerId, 'notifications');
      addDoc(notifyRef, {
        text: `${user.displayName || "A member"} ${status} your interest request.`,
        read: false,
        createdAt: serverTimestamp()
      });
    }).catch(async (e) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: interestRef.path,
        operation: 'update',
        requestResourceData: { status }
      }));
    });
  };

  const handleWithdrawInterest = (interestId: string) => {
    if (!db || !confirm("Are you sure you want to withdraw this interest request?")) return;
    const interestRef = doc(db, "interests", interestId);
    deleteDoc(interestRef).then(() => {
      toast({
        title: "Interest Withdrawn",
        description: "Your request has been removed.",
      });
    }).catch(async (e) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: interestRef.path,
        operation: 'delete'
      }));
    });
  };

  const pendingReceived = receivedInterests.filter(i => i.status === 'pending');
  const acceptedMatches = [
    ...receivedInterests.filter(i => i.status === 'accepted'),
    ...sentInterests.filter(i => i.status === 'accepted')
  ];

  if (authLoading || loadingReceived || loadingSent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold font-headline mb-2">Interests Hub</h1>
          <p className="text-muted-foreground">Manage your connections and matrimonial interests in one place.</p>
        </header>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="mb-8 h-auto p-1 bg-muted/50">
            <TabsTrigger value="received" className="gap-2 px-6 py-2.5 font-bold">
              Received {pendingReceived.length > 0 && (
                <Badge variant="secondary" className="bg-primary text-white ml-1">
                  {pendingReceived.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2 px-6 py-2.5 font-bold">
              Matches {acceptedMatches.length > 0 && (
                <Badge variant="outline" className="ml-1">
                  {acceptedMatches.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2 px-6 py-2.5 font-bold">
              Sent Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {receivedInterests.filter(i => i.status !== 'accepted').length > 0 ? (
                receivedInterests.filter(i => i.status !== 'accepted').map((interest: any) => (
                  <Card key={interest.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4 pb-4">
                      <UserAvatar userId={interest.fromUserId} className="h-16 w-16 border-2 border-primary/10" />
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold truncate">{interest.fromUserName || 'Member'}</CardTitle>
                        <CardDescription className="text-xs">
                          {interest.createdAt?.toDate() ? interest.createdAt.toDate().toLocaleDateString() : 'recent'}
                        </CardDescription>
                      </div>
                      <Badge variant={interest.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px] uppercase">
                        {interest.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {interest.status === 'pending' && (
                        <div className="flex gap-2 mb-2">
                          <Button size="sm" className="flex-1 gap-1.5 h-10 font-bold" onClick={() => handleUpdateStatus(interest.id, 'accepted', interest.fromUserId)}>
                            <Check className="h-4 w-4" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-10 text-destructive hover:bg-destructive/5" onClick={() => handleUpdateStatus(interest.id, 'declined', interest.fromUserId)}>
                            <X className="h-4 w-4" /> Reject
                          </Button>
                        </div>
                      )}
                      <Link href={`/profiles/${interest.fromUserId}`} className="block">
                        <Button variant="ghost" size="sm" className="w-full text-xs h-8 opacity-70">
                          View Full Profile
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                   <Heart className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                   <p className="text-muted-foreground font-medium">No pending requests received.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="matches">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {acceptedMatches.length > 0 ? (
                acceptedMatches.map((interest: any) => {
                  const partnerId = interest.fromUserId === user?.uid ? interest.toUserId : interest.fromUserId;
                  const partnerName = interest.fromUserId === user?.uid ? interest.toUserName : interest.fromUserName;
                  
                  return (
                    <Card key={interest.id} className="overflow-hidden border-none shadow-sm bg-accent/10 border-l-4 border-l-primary">
                      <CardHeader className="flex flex-row items-center gap-4 pb-4">
                        <UserAvatar userId={partnerId} className="h-16 w-16 border-2 border-primary/20" />
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold truncate">{partnerName}</CardTitle>
                          <CardDescription className="text-xs uppercase tracking-tighter text-primary font-bold">
                            Mutual Match
                          </CardDescription>
                        </div>
                        <Users className="h-5 w-5 text-primary opacity-30" />
                      </CardHeader>
                      <CardContent className="pt-0 flex flex-col gap-2">
                        <Link href="/messages" className="block">
                          <Button className="w-full gap-2 h-10 font-bold" variant="default">
                            <MessageSquare className="h-4 w-4" /> Start Conversation
                          </Button>
                        </Link>
                        <Link href={`/profiles/${partnerId}`} className="block">
                          <Button variant="ghost" size="sm" className="w-full text-xs h-8 opacity-70">
                            View Profile
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full py-24 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                   <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                   <p className="text-muted-foreground font-medium">No mutual matches yet. Keep exploring!</p>
                   <Link href="/discover" className="mt-4 block">
                      <Button variant="link" className="font-bold text-primary">Discover Profiles</Button>
                   </Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sent">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sentInterests.length > 0 ? (
                sentInterests.map((interest: any) => (
                  <Card key={interest.id} className="overflow-hidden border-none shadow-sm opacity-90">
                    <CardHeader className="flex flex-row items-center gap-4 pb-4">
                      <UserAvatar userId={interest.toUserId} className="h-16 w-16 border-2 border-primary/10" />
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold truncate">{interest.toUserName || 'Member'}</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wider">
                          {interest.status}
                        </CardDescription>
                      </div>
                      <Badge variant={interest.status === 'accepted' ? 'default' : interest.status === 'declined' ? 'destructive' : 'secondary'} className="h-5 text-[9px]">
                        {interest.status.toUpperCase()}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-col gap-2">
                        {interest.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full gap-2 text-destructive hover:bg-destructive/5"
                            onClick={() => handleWithdrawInterest(interest.id)}
                          >
                            <Trash2 className="h-4 w-4" /> Withdraw Request
                          </Button>
                        )}
                        {interest.status === 'accepted' ? (
                          <Link href="/messages" className="block w-full">
                            <Button className="w-full gap-2 h-10 font-bold" variant="secondary">
                              <MessageSquare className="h-4 w-4" /> Message Now
                            </Button>
                          </Link>
                        ) : interest.status === 'declined' ? (
                          <p className="text-center text-xs text-muted-foreground italic py-2">The member declined the request.</p>
                        ) : null}
                        <Link href={`/profiles/${interest.toUserId}`} className="block w-full">
                          <Button variant="ghost" size="sm" className="w-full text-xs h-8 opacity-70">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                   <Heart className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4 rotate-180" />
                   <p className="text-muted-foreground font-medium">You haven't sent any interests yet.</p>
                   <Link href="/discover" className="mt-4 block">
                      <Button variant="link" className="font-bold underline">Explore Profiles</Button>
                   </Link>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
