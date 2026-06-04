
'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Heart, ShieldAlert, Lock, User } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, or, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function MessagesPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const matchesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "interests"),
      where("status", "==", "accepted"),
      or(
        where("fromUserId", "==", user.uid),
        where("toUserId", "==", user.uid)
      )
    );
  }, [db, user]);

  const { data: matches, loading: loadingMatches } = useCollection(matchesQuery);

  if (authLoading || loadingMatches) {
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
          <h1 className="text-3xl font-bold font-headline mb-2">Conversations</h1>
          <p className="text-muted-foreground">Chat with members who have accepted your interest request.</p>
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          <aside className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">Matched Connections</h2>
            <div className="space-y-2">
              {matches.length > 0 ? (
                matches.map((match: any) => {
                  const partnerId = match.fromUserId === user?.uid ? match.toUserId : match.fromUserId;
                  const partnerName = match.fromUserId === user?.uid ? match.toUserName : match.fromUserName;
                  
                  return (
                    <Card key={match.id} className="cursor-pointer hover:bg-muted/50 transition-colors border-none shadow-sm">
                      <CardContent className="p-4 flex items-center gap-4">
                         <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted border border-primary/10">
                            <Image 
                              src={`https://picsum.photos/seed/${partnerId}/200/200`} 
                              alt="Partner" 
                              fill 
                              className="object-cover" 
                            />
                         </div>
                         <div className="flex-1 overflow-hidden">
                            <p className="font-bold truncate">{partnerName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                               <Badge variant="outline" className="text-[9px] h-4 py-0">MATCHED</Badge>
                            </p>
                         </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="py-12 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
                   <p className="text-xs text-muted-foreground">No matches found yet.</p>
                </div>
              )}
            </div>
          </aside>

          <section className="lg:col-span-2">
            <Card className="h-[60vh] border-none shadow-lg flex flex-col items-center justify-center text-center p-12 bg-white/50 backdrop-blur-sm">
              <MessageSquare className="h-16 w-16 text-primary/20 mb-6" />
              <h3 className="text-2xl font-headline font-bold mb-2">Secure Messaging</h3>
              <p className="text-muted-foreground max-w-sm mb-8">
                Select a matched connection from the sidebar to start a respectful conversation. Chatting is only enabled for verified matches.
              </p>
              <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-2xl text-xs text-primary font-medium border border-primary/10">
                 <ShieldAlert className="h-4 w-4" />
                 Conversations are monitored for safety and community guidelines.
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
