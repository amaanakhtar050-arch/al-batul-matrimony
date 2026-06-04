
'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Heart, Check, X, User, MessageSquare } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, updateDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

  const handleUpdateStatus = (interestId: string, status: 'accepted' | 'declined') => {
    if (!db) return;
    const interestRef = doc(db, "interests", interestId);
    updateDoc(interestRef, {
      status,
      updatedAt: serverTimestamp()
    }).then(() => {
      toast({
        title: status === 'accepted' ? "Interest Accepted" : "Interest Declined",
        description: status === 'accepted' ? "You can now chat with this member." : "Request removed from queue.",
      });
    }).catch(async (e) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: interestRef.path,
        operation: 'update',
        requestResourceData: { status }
      }));
    });
  };

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
          <h1 className="text-3xl font-bold font-headline mb-2">Interest Requests</h1>
          <p className="text-muted-foreground">Manage your connection requests and matrimonial interests.</p>
        </header>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="mb-8 h-auto p-1 bg-muted/50">
            <TabsTrigger value="received" className="gap-2 px-6 py-2.5 font-bold">
              Received {receivedInterests.filter(i => i.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="bg-primary text-white ml-1">
                  {receivedInterests.filter(i => i.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2 px-6 py-2.5 font-bold">
              Sent Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {receivedInterests.length > 0 ? (
                receivedInterests.map((interest: any) => (
                  <Card key={interest.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4 pb-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted border-2 border-primary/10">
                        <Image 
                          src={`https://picsum.photos/seed/${interest.fromUserId}/200/200`} 
                          alt="User" 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold">{interest.fromUserName || 'Member'}</CardTitle>
                        <CardDescription className="text-xs">
                          Sent on {interest.createdAt?.toDate().toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant={interest.status === 'pending' ? 'secondary' : interest.status === 'accepted' ? 'default' : 'destructive'} className="text-[10px] uppercase">
                        {interest.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {interest.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 gap-1.5 h-10 font-bold" onClick={() => handleUpdateStatus(interest.id, 'accepted')}>
                            <Check className="h-4 w-4" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-10 text-destructive hover:bg-destructive/5" onClick={() => handleUpdateStatus(interest.id, 'declined')}>
                            <X className="h-4 w-4" /> Decline
                          </Button>
                        </div>
                      ) : interest.status === 'accepted' ? (
                        <Link href="/messages" className="block">
                          <Button className="w-full gap-2 h-10 font-bold" variant="secondary">
                            <MessageSquare className="h-4 w-4" /> Start Chat
                          </Button>
                        </Link>
                      ) : (
                        <p className="text-center text-xs text-muted-foreground italic py-2">This request was declined.</p>
                      )}
                      <Link href={`/profiles/${interest.fromUserId}`} className="block mt-2">
                        <Button variant="ghost" size="sm" className="w-full text-xs h-8 opacity-70">
                          View Profile
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-24 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                   <Heart className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                   <p className="text-muted-foreground font-medium">No interest requests received yet.</p>
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
                       <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted border-2 border-primary/10">
                        <Image 
                          src={`https://picsum.photos/seed/${interest.toUserId}/200/200`} 
                          alt="User" 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold">{interest.toUserName || 'Member'}</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wider">
                          {interest.status}
                        </CardDescription>
                      </div>
                      <Badge variant={interest.status === 'accepted' ? 'default' : interest.status === 'declined' ? 'destructive' : 'secondary'} className="h-5 text-[9px]">
                        {interest.status.toUpperCase()}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {interest.status === 'accepted' ? (
                        <Link href="/messages" className="block">
                          <Button className="w-full gap-2 h-10 font-bold" variant="secondary">
                            <MessageSquare className="h-4 w-4" /> Message Now
                          </Button>
                        </Link>
                      ) : interest.status === 'declined' ? (
                        <p className="text-center text-xs text-muted-foreground italic py-2">The member has declined the request.</p>
                      ) : (
                        <p className="text-center text-xs text-muted-foreground py-2 flex items-center justify-center gap-2">
                           <User className="h-3 w-3" /> Awaiting response...
                        </p>
                      )}
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
