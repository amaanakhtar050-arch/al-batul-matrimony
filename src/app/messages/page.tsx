
'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, ShieldAlert, Lock, User, Clock, Check, CheckCheck } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { 
  collection, 
  query, 
  where, 
  or, 
  and,
  orderBy, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  writeBatch 
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function MessagesPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [activeInterest, setActiveInterest] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const matchesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "interests"),
      and(
        where("status", "==", "accepted"),
        or(
          where("fromUserId", "==", user.uid),
          where("toUserId", "==", user.uid)
        )
      )
    );
  }, [db, user]);

  const { data: matches, loading: loadingMatches } = useCollection(matchesQuery);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !activeInterest) return null;
    return query(
      collection(db, "interests", activeInterest.id, "messages"),
      orderBy("timestamp", "asc")
    );
  }, [db, activeInterest]);

  const { data: messages, loading: loadingMessages } = useCollection(messagesQuery);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as read when active chat changes or new messages arrive
  useEffect(() => {
    if (!db || !user || !activeInterest || !messages.length) return;

    const unreadMessages = messages.filter(m => m.senderId !== user.uid && !m.read);
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => {
        const msgRef = doc(db, "interests", activeInterest.id, "messages", msg.id);
        updateDoc(msgRef, { read: true }).catch(() => {});
      });
    }
  }, [db, user, activeInterest, messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !activeInterest || !messageText.trim()) return;

    const messageData = {
      text: messageText.trim(),
      senderId: user.uid,
      timestamp: serverTimestamp(),
      read: false
    };

    const msgsRef = collection(db, "interests", activeInterest.id, "messages");
    addDoc(msgsRef, messageData)
      .then(() => setMessageText(""))
      .catch(async (e) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: msgsRef.path,
          operation: 'create',
          requestResourceData: messageData
        }));
      });
  };

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
      
      <main className="container mx-auto px-4 py-8 lg:px-8 max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-12 h-[calc(100vh-12rem)]">
          {/* Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-4">
            <h1 className="text-2xl font-bold font-headline px-2">Messages</h1>
            <ScrollArea className="flex-1 rounded-2xl border bg-card/50 backdrop-blur-sm">
              <div className="p-2 space-y-2">
                {matches.length > 0 ? (
                  matches.map((match: any) => {
                    const partnerId = match.fromUserId === user?.uid ? match.toUserId : match.fromUserId;
                    const partnerName = match.fromUserId === user?.uid ? match.toUserName : match.fromUserName;
                    const isActive = activeInterest?.id === match.id;
                    
                    return (
                      <div 
                        key={match.id} 
                        onClick={() => setActiveInterest(match)}
                        className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${
                          isActive 
                            ? "bg-primary text-primary-foreground border-primary shadow-md" 
                            : "hover:bg-muted/80 border-transparent"
                        }`}
                      >
                         <div className="relative h-12 w-12 overflow-hidden rounded-full shrink-0 border border-white/20">
                            <Image 
                              src={`https://picsum.photos/seed/${partnerId}/200/200`} 
                              alt="Partner" 
                              fill 
                              className="object-cover" 
                            />
                         </div>
                         <div className="flex-1 overflow-hidden">
                            <p className="font-bold truncate text-sm">{partnerName}</p>
                            <div className="flex items-center gap-2">
                               <Badge variant={isActive ? "secondary" : "outline"} className="text-[9px] h-4 py-0 uppercase tracking-tighter">
                                 Matched
                               </Badge>
                            </div>
                         </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 text-center px-4">
                     <MessageSquare className="mx-auto h-10 w-10 opacity-10 mb-2" />
                     <p className="text-xs text-muted-foreground">No matches found yet. Start discovering profiles to find a partner.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Active Chat */}
          <section className="lg:col-span-8 flex flex-col overflow-hidden">
            {activeInterest ? (
              <Card className="flex-1 flex flex-col border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
                {/* Chat Header */}
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="relative h-10 w-10 overflow-hidden rounded-full border border-primary/10">
                        <Image 
                          src={`https://picsum.photos/seed/${activeInterest.fromUserId === user?.uid ? activeInterest.toUserId : activeInterest.fromUserId}/100/100`} 
                          alt="Avatar" 
                          fill 
                          className="object-cover" 
                        />
                     </div>
                     <div>
                        <p className="font-bold text-sm leading-none">
                          {activeInterest.fromUserId === user?.uid ? activeInterest.toUserName : activeInterest.fromUserName}
                        </p>
                        <span className="text-[10px] text-primary font-medium flex items-center gap-1 mt-1">
                          <CheckCircleIcon className="h-3 w-3" /> Secure Connection
                        </span>
                     </div>
                  </div>
                  <Link href={`/profiles/${activeInterest.fromUserId === user?.uid ? activeInterest.toUserId : activeInterest.fromUserId}`}>
                    <Button variant="ghost" size="sm" className="text-xs h-8">View Profile</Button>
                  </Link>
                </div>

                {/* Messages Body */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {loadingMessages ? (
                      <div className="flex h-40 items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((msg: any) => {
                        const isMine = msg.senderId === user?.uid;
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                          >
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              isMine 
                                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                : 'bg-white text-foreground border rounded-tl-none'
                            }`}>
                              {msg.text}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 px-1">
                              <span className="text-[9px] text-muted-foreground opacity-60">
                                {msg.timestamp?.toDate() ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
                              </span>
                              {isMine && (
                                <span className="text-primary">
                                  {msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3 opacity-50" />}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-20 text-center flex flex-col items-center">
                         <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                           <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                         </div>
                         <p className="text-sm font-medium text-muted-foreground">Start the conversation with respect</p>
                         <p className="text-[10px] text-muted-foreground opacity-60 max-w-xs mt-2">
                           Remember to follow Al Batul's community guidelines and maintain professional decorum.
                         </p>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t bg-muted/10">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Type a message..." 
                      className="flex-1 h-12 bg-white rounded-xl shadow-inner"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                    />
                    <Button type="submit" size="icon" className="h-12 w-12 rounded-xl" disabled={!messageText.trim()}>
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </Card>
            ) : (
              <Card className="flex-1 border-none shadow-lg flex flex-col items-center justify-center text-center p-12 bg-white/50 backdrop-blur-sm">
                <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mb-8 animate-pulse">
                  <MessageSquare className="h-12 w-12 text-primary opacity-30" />
                </div>
                <h3 className="text-3xl font-headline font-bold mb-4">Your Private Sanctuary</h3>
                <p className="text-muted-foreground max-sm mb-10 leading-relaxed">
                  Select a match from the sidebar to engage in a meaningful and respectful conversation. 
                  Communication is built on trust and mutual values.
                </p>
                <div className="grid gap-4 w-full max-w-md">
                   <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl text-xs text-primary font-medium border border-primary/10">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <p className="text-left">
                      <strong>Security First:</strong> Conversations are end-to-end verified for safety. Never share personal sensitive passwords.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
