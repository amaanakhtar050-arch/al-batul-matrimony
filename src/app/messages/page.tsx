'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Send, 
  ShieldAlert, 
  Lock, 
  Check, 
  CheckCheck, 
  Crown,
  ChevronLeft,
  Search,
  AlertCircle,
  User,
  Loader2,
  Clock,
  Sparkles
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { format, isToday, isYesterday } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";

function UserAvatar({ userId, className }: { userId: string, className?: string }) {
  const db = useFirestore();
  const userRef = useMemoFirebase(() => userId ? doc(db!, 'users', userId) : null, [db, userId]);
  const { data: profile } = useDoc(userRef);
  return (
    <div className={cn("relative overflow-hidden rounded-[1.5rem] bg-muted shadow-md border-2 border-white", className)}>
      {profile?.photoUrl ? <Image src={profile.photoUrl} alt="Avatar" fill className="object-cover" /> : <div className="flex h-full w-full items-center justify-center text-muted-foreground/30 bg-muted"><User className="h-2/3 w-2/3" /></div>}
    </div>
  );
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [activeInterest, setActiveInterest] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarSearch, setSidebarSearch] = useState("");

  const userProfileRef = useMemoFirebase(() => { if (!db || !user) return null; return doc(db, 'users', user.uid); }, [db, user]);
  const { data: profile } = useDoc(userProfileRef);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  const sentMatchesQuery = useMemoFirebase(() => { if (!db || !user) return null; return query(collection(db, "interests"), where("fromUserId", "==", user.uid), where("status", "==", "accepted")); }, [db, user]);
  const receivedMatchesQuery = useMemoFirebase(() => { if (!db || !user) return null; return query(collection(db, "interests"), where("toUserId", "==", user.uid), where("status", "==", "accepted")); }, [db, user]);
  const { data: sentMatches } = useCollection(sentMatchesQuery);
  const { data: receivedMatches } = useCollection(receivedMatchesQuery);

  const matches = useMemo(() => {
    const combined = [...sentMatches, ...receivedMatches];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique.sort((a: any, b: any) => {
      const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
      const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
      return timeB - timeA;
    });
  }, [sentMatches, receivedMatches]);

  const messagesQuery = useMemoFirebase(() => { if (!db || !activeInterest) return null; return query(collection(db, "interests", activeInterest.id, "messages"), orderBy("timestamp", "asc")); }, [db, activeInterest]);
  const { data: messages, loading: loadingMessages } = useCollection(messagesQuery);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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
    if (!db || !user || !activeInterest || !messageText.trim() || !profile) return;
    const currentText = messageText.trim();
    const messageData = { text: currentText, senderId: user.uid, timestamp: serverTimestamp(), read: false };
    const msgsRef = collection(db, "interests", activeInterest.id, "messages");
    const interestRef = doc(db, "interests", activeInterest.id);
    addDoc(msgsRef, messageData).then(() => {
      setMessageText("");
      updateDoc(interestRef, { lastMessage: currentText, updatedAt: serverTimestamp(), lastMessageRead: false, lastMessageSenderId: user.uid });
      const partnerId = activeInterest.fromUserId === user.uid ? activeInterest.toUserId : activeInterest.fromUserId;
      addDoc(collection(db, 'users', partnerId, 'notifications'), { type: 'message', title: '💬 New Message Received', message: `You received a new message from ${profile.fullName || "a member"}: "${currentText.slice(0, 30)}..."`, senderId: user.uid, receiverId: partnerId, read: false, createdAt: serverTimestamp() });
    });
  };

  const formatMessageDate = (date: Date) => { if (isToday(date)) return "Today"; if (isYesterday(date)) return "Yesterday"; return format(date, "MMMM d, yyyy"); };

  const renderMessages = () => {
    if (!messages.length) return null;
    let lastDate = "";
    return messages.map((msg: any) => {
      const msgDate = msg.timestamp?.toDate();
      const dateStr = msgDate ? formatMessageDate(msgDate) : "";
      const showDateDivider = dateStr !== lastDate;
      lastDate = dateStr;
      const isMine = msg.senderId === user?.uid;
      return (
        <div key={msg.id} className="space-y-6">
          {showDateDivider && (
            <div className="flex justify-center my-10 relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-muted/50"></div></div>
              <span className="relative bg-background px-6 py-2 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{dateStr}</span>
            </div>
          )}
          <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-fade-in`}>
            <div className={cn(
              "max-w-[85%] sm:max-w-[70%] rounded-[2rem] px-6 py-4 text-sm font-medium leading-relaxed shadow-xl transition-all",
              isMine ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white text-foreground border border-border/40 rounded-tl-none'
            )}>
              {msg.text}
            </div>
            <div className="flex items-center gap-2 mt-2 px-2">
              <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{msgDate ? format(msgDate, 'HH:mm') : '...'}</span>
              {isMine && <span className="text-primary">{msg.read ? <CheckCheck className="h-4 w-4" /> : <Check className="h-4 w-4 opacity-50" />}</span>}
            </div>
          </div>
        </div>
      );
    });
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  const isAdmin = profile?.role === 'admin';
  const canChat = isAdmin || ["Silver", "Gold", "Premium"].includes(profile?.membership?.plan || "Free");
  const filteredMatches = matches.filter(m => { const partnerName = m.fromUserId === user?.uid ? m.toUserName : m.fromUserName; return (partnerName || "").toLowerCase().includes(sidebarSearch.toLowerCase()); });

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full flex flex-col md:flex-row gap-0 md:gap-8 py-0 md:py-8 lg:px-8 max-w-7xl">
          {/* Conversation List Sidebar */}
          <aside className={cn(
            "md:w-96 flex flex-col gap-6 bg-white md:bg-transparent h-full transition-all",
            activeInterest ? 'hidden md:flex' : 'flex w-full'
          )}>
            <div className="px-6 pt-6 md:p-0">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">Messages</h1>
                <Badge className="bg-primary/5 text-primary border-none font-bold rounded-xl h-8 px-4">{matches.length}</Badge>
              </div>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search contacts..." 
                  className="h-14 pl-14 pr-6 bg-white border-none rounded-[1.5rem] shadow-xl focus-visible:ring-primary/20 transition-all text-sm" 
                  value={sidebarSearch} 
                  onChange={(e) => setSidebarSearch(e.target.value)} 
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-4 md:px-0">
              <div className="space-y-4 pb-12">
                {filteredMatches.length > 0 ? filteredMatches.map((match: any) => {
                  const partnerId = match.fromUserId === user?.uid ? match.toUserId : match.fromUserId;
                  const partnerName = match.fromUserId === user?.uid ? match.toUserName : match.fromUserName;
                  const isActive = activeInterest?.id === match.id;
                  const hasUnread = match.lastMessageRead === false && match.lastMessageSenderId !== user?.uid;

                  return (
                    <div 
                      key={match.id} 
                      onClick={() => setActiveInterest(match)} 
                      className={cn(
                        "group flex items-center gap-5 p-6 rounded-[2rem] cursor-pointer transition-all border border-transparent hover:shadow-2xl relative",
                        isActive ? "bg-primary text-primary-foreground shadow-[0_20px_50px_rgba(8,112,84,0.15)] scale-[1.02] border-none" : "bg-white/60 hover:bg-white"
                      )}
                    >
                       <UserAvatar userId={partnerId} className="h-16 w-16 shrink-0 border-2 border-white/40 shadow-xl" />
                       <div className="flex-1 overflow-hidden space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold truncate text-base">{partnerName}</p>
                            {match.updatedAt?.toDate && (
                              <span className={cn("text-[10px] font-bold uppercase tracking-[0.1em] opacity-50", isActive && 'text-primary-foreground/70')}>
                                {format(match.updatedAt.toDate(), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          <p className={cn("text-sm truncate opacity-60 font-medium", isActive && 'text-primary-foreground/90')}>
                            {match.lastMessage || "Express your interest..."}
                          </p>
                       </div>
                       {hasUnread && !isActive && (
                         <div className="absolute top-6 right-6 h-3 w-3 bg-secondary rounded-full border-2 border-white animate-pulse" />
                       )}
                    </div>
                  );
                }) : (
                  <div className="py-32 text-center opacity-20">
                    <MessageSquare className="mx-auto h-24 w-24 mb-6" />
                    <p className="text-lg font-bold">No active threads</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Dedicated Chat Window */}
          <section className={cn(
            "flex-1 flex flex-col bg-background md:bg-transparent overflow-hidden h-full",
            !activeInterest ? 'hidden md:flex' : 'flex'
          )}>
            {activeInterest ? (
              <Card className="flex-1 flex flex-col border-none shadow-2xl overflow-hidden bg-white/50 backdrop-blur-2xl rounded-[3rem] md:rounded-[4rem] border border-white/40 h-full">
                {/* Chat Header */}
                <div className="p-6 md:p-8 bg-white/80 border-b flex items-center justify-between">
                  <div className="flex items-center gap-5">
                     <Button variant="ghost" size="icon" className="md:hidden h-12 w-12 rounded-2xl" onClick={() => setActiveInterest(null)}><ChevronLeft className="h-7 w-7" /></Button>
                     <UserAvatar userId={activeInterest.fromUserId === user?.uid ? activeInterest.toUserId : activeInterest.fromUserId} className="h-16 w-16 border-2 border-primary/10 shadow-xl" />
                     <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xl md:text-2xl font-headline text-primary">{activeInterest.fromUserId === user?.uid ? activeInterest.toUserName : activeInterest.fromUserName}</p>
                          <ShieldCheck className="h-5 w-5 text-secondary" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Verified Match</span>
                        </div>
                     </div>
                  </div>
                  <Link href={`/profiles/${activeInterest.fromUserId === user?.uid ? activeInterest.toUserId : activeInterest.fromUserId}`}>
                    <Button variant="outline" size="lg" className="font-bold h-12 px-8 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all">Profile</Button>
                  </Link>
                </div>

                {canChat ? (
                  <>
                    {/* Message Stream */}
                    <ScrollArea className="flex-1 p-6 md:p-12 bg-primary/[0.01]">
                      <div className="max-w-4xl mx-auto space-y-6">
                        {loadingMessages ? (
                          <div className="flex h-64 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" /></div>
                        ) : messages.length > 0 ? renderMessages() : (
                          <div className="py-32 text-center max-w-sm mx-auto space-y-6 animate-fade-in">
                            <div className="h-24 w-24 bg-primary/5 rounded-[3rem] flex items-center justify-center mx-auto"><Sparkles className="h-12 w-12 text-primary/40" /></div>
                            <h3 className="text-3xl font-headline font-bold text-primary">Purposeful Connection</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">Bismillah. Approach this conversation with respect, clarity, and the intention of fulfilling your deen.</p>
                          </div>
                        )}
                        <div ref={scrollRef} />
                      </div>
                    </ScrollArea>

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} className="p-8 bg-white border-t">
                      <div className="max-w-4xl mx-auto flex gap-4">
                        <Input 
                          placeholder="Type your message with respect..." 
                          className="flex-1 h-16 bg-muted/40 border-none rounded-[2rem] px-8 focus-visible:ring-primary/10 text-base shadow-inner font-medium" 
                          value={messageText} 
                          onChange={(e) => setMessageText(e.target.value)} 
                        />
                        <Button 
                          type="submit" 
                          size="icon" 
                          className="h-16 w-16 rounded-[2rem] shadow-2xl bg-primary hover:scale-105 transition-transform active:scale-95 shrink-0" 
                          disabled={!messageText.trim()}
                        >
                          <Send className="h-7 w-7" />
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  /* Paywall Screen */
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white/20">
                    <div className="h-32 w-32 bg-orange-100 rounded-[3.5rem] flex items-center justify-center mb-10 shadow-2xl animate-fade-in"><Lock className="h-16 w-16 text-orange-600" /></div>
                    <h3 className="text-4xl font-headline font-bold mb-6 text-primary tracking-tight">Messaging Restricted</h3>
                    <p className="text-muted-foreground text-lg max-w-sm mb-12 leading-relaxed font-medium">To initiate a conversation and exchange values with your match, please upgrade to a **Silver Plan** or higher.</p>
                    <Link href="/membership">
                      <Button className="h-20 px-12 gap-4 font-bold shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] rounded-[2.5rem] text-xl bg-primary hover:bg-primary/90 hover:scale-105 transition-all">
                        <Crown className="h-6 w-6 text-secondary" /> Upgrade to Chat
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            ) : (
              /* Empty State Window */
              <Card className="flex-1 border-none shadow-2xl flex flex-col items-center justify-center text-center p-20 bg-white/40 backdrop-blur-3xl rounded-[4rem] border border-white/40 h-full">
                <div className="h-40 w-40 bg-primary/5 rounded-[4rem] flex items-center justify-center mb-12 shadow-[0_40px_80px_rgba(8,112,84,0.1)] group">
                  <MessageSquare className="h-20 w-20 text-primary opacity-10 group-hover:opacity-30 transition-all duration-700 scale-100 group-hover:scale-110" />
                </div>
                <h3 className="text-5xl font-headline font-bold mb-6 text-primary tracking-tight">Your Inbox</h3>
                <p className="text-muted-foreground/70 max-w-md mb-16 leading-relaxed text-lg font-medium">Select a verified match from your list to begin a purposeful discussion about your future journey together.</p>
                <div className="grid gap-8 w-full max-w-xl">
                   {[
                    { icon: ShieldAlert, title: "Secure & Encrypted", msg: "Conversations are strictly private between you and your match." },
                    { icon: Clock, title: "Timed Interactions", msg: "Intentional communication helps build deeper foundations for marriage." }
                   ].map((item, i) => (
                    <div key={i} className="flex items-center gap-6 p-8 bg-white rounded-[2.5rem] text-left border border-border/40 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-2">
                      <div className="h-16 w-16 rounded-[1.5rem] bg-accent flex items-center justify-center shrink-0 shadow-inner"><item.icon className="h-8 w-8 text-primary" /></div>
                      <div>
                        <p className="font-bold text-primary text-lg mb-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium uppercase tracking-widest opacity-70">{item.msg}</p>
                      </div>
                    </div>
                   ))}
                </div>
              </Card>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}