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
  Sparkles,
  ShieldCheck
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
import { ActivityStatus } from "@/components/profile/ActivityStatus";

function UserAvatar({ userId, className }: { userId: string, className?: string }) {
  const db = useFirestore();
  const userRef = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return doc(db, 'users', userId);
  }, [db, userId]);
  
  const { data: profile } = useDoc(userRef);
  
  return (
    <div className={cn("relative overflow-hidden rounded-[1.25rem] md:rounded-[1.5rem] bg-muted shadow-md border-2 border-white", className)}>
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

  const activePartnerId = useMemo(() => {
    if (!activeInterest || !user) return null;
    return activeInterest.fromUserId === user.uid ? activeInterest.toUserId : activeInterest.fromUserId;
  }, [activeInterest, user]);

  const activePartnerRef = useMemoFirebase(() => {
    if (!db || !activePartnerId) return null;
    return doc(db, 'users', activePartnerId);
  }, [db, activePartnerId]);

  const { data: activePartner } = useDoc(activePartnerRef);

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
        <div key={msg.id} className="space-y-4 md:space-y-6">
          {showDateDivider && (
            <div className="flex justify-center my-6 md:my-10 relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-muted/50"></div></div>
              <span className="relative bg-background px-4 md:px-6 py-1 md:py-2 rounded-full text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{dateStr}</span>
            </div>
          )}
          <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-fade-in`}>
            <div className={cn(
              "max-w-[85%] sm:max-w-[70%] rounded-[1.5rem] md:rounded-[2rem] px-4 md:px-6 py-3 md:py-4 text-sm font-medium leading-relaxed shadow-xl transition-all",
              isMine ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white text-foreground border border-border/40 rounded-tl-none'
            )}>
              {msg.text}
            </div>
            <div className="flex items-center gap-2 mt-1 md:mt-2 px-2">
              <span className="text-[9px] md:text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{msgDate ? format(msgDate, 'HH:mm') : '...'}</span>
              {isMine && <span className="text-primary">{msg.read ? <CheckCheck className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Check className="h-3.5 w-3.5 md:h-4 md:w-4 opacity-50" />}</span>}
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
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden max-w-[100vw]">
      <Navbar />
      <main className="flex-1 overflow-hidden relative">
        <div className="container mx-auto h-full flex flex-col md:flex-row gap-0 md:gap-8 md:py-8 lg:px-8 max-w-7xl relative">
          {/* Conversation List Sidebar */}
          <aside className={cn(
            "md:w-80 lg:w-96 flex flex-col gap-6 bg-white md:bg-transparent h-full transition-all duration-300 ease-in-out absolute md:relative z-20 inset-0 md:inset-auto",
            activeInterest ? '-translate-x-full md:translate-x-0 invisible md:visible opacity-0 md:opacity-100' : 'translate-x-0 visible opacity-100'
          )}>
            <div className="px-6 pt-6 md:p-0">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary tracking-tight">Messages</h1>
                <Badge className="bg-primary/5 text-primary border-none font-bold rounded-xl h-8 px-4">{matches.length}</Badge>
              </div>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search contacts..." 
                  className="h-12 md:h-14 pl-12 pr-6 bg-white border-none rounded-xl md:rounded-[1.5rem] shadow-xl focus-visible:ring-primary/20 transition-all text-sm" 
                  value={sidebarSearch} 
                  onChange={(e) => setSidebarSearch(e.target.value)} 
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-4 md:px-0">
              <div className="space-y-3 md:space-y-4 pb-12">
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
                        "group flex items-center gap-4 md:gap-5 p-4 md:p-6 rounded-2xl md:rounded-[2rem] cursor-pointer transition-all border border-transparent hover:shadow-2xl relative",
                        isActive ? "bg-primary text-primary-foreground shadow-lg md:shadow-[0_20px_50px_rgba(8,112,84,0.15)] md:scale-[1.02] border-none" : "bg-white/60 hover:bg-white"
                      )}
                    >
                       <UserAvatar userId={partnerId} className="h-12 w-12 md:h-16 md:w-16 shrink-0 border-2 border-white/40 shadow-xl" />
                       <div className="flex-1 overflow-hidden space-y-0.5 md:space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold truncate text-sm md:text-base">{partnerName}</p>
                            {match.updatedAt?.toDate && (
                              <span className={cn("text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] opacity-50", isActive && 'text-primary-foreground/70')}>
                                {format(match.updatedAt.toDate(), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          <p className={cn("text-xs truncate opacity-60 font-medium", isActive && 'text-primary-foreground/90')}>
                            {match.lastMessage || "Express your interest..."}
                          </p>
                       </div>
                       {hasUnread && !isActive && (
                         <div className="absolute top-4 right-4 md:top-6 md:right-6 h-2 w-2 md:h-3 md:w-3 bg-secondary rounded-full border-2 border-white animate-pulse" />
                       )}
                    </div>
                  );
                }) : (
                  <div className="py-20 md:py-32 text-center opacity-20">
                    <MessageSquare className="mx-auto h-16 w-16 md:h-24 md:w-24 mb-6" />
                    <p className="text-base md:text-lg font-bold">No active threads</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Dedicated Chat Window */}
          <section className={cn(
            "flex-1 flex flex-col bg-background md:bg-transparent overflow-hidden h-full transition-all duration-300 ease-in-out absolute md:relative z-30 inset-0 md:inset-auto",
            activeInterest ? 'translate-x-0 opacity-100' : 'translate-x-full md:translate-x-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto'
          )}>
            {activeInterest ? (
              <Card className="flex-1 flex flex-col border-none shadow-2xl overflow-hidden bg-white/50 backdrop-blur-2xl rounded-none md:rounded-[4rem] border border-white/40 h-full">
                {/* Chat Header */}
                <div className="p-4 md:p-8 bg-white/80 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
                     <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl" onClick={() => setActiveInterest(null)}><ChevronLeft className="h-6 w-6" /></Button>
                     <UserAvatar userId={activePartnerId!} className="h-10 w-10 md:h-16 md:w-16 border-2 border-primary/10 shadow-xl shrink-0" />
                     <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <p className="font-bold text-lg md:text-2xl font-headline text-primary truncate">{activePartner?.fullName || "Member"}</p>
                          <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-secondary shrink-0" />
                        </div>
                        <ActivityStatus lastActiveAt={activePartner?.lastActiveAt} className="mt-0.5" />
                     </div>
                  </div>
                  <Link href={`/profiles/${activePartnerId}`}>
                    <Button variant="outline" size="sm" className="hidden sm:flex font-bold h-10 px-6 rounded-xl border-2 hover:bg-primary hover:text-white transition-all">Profile</Button>
                    <Button variant="ghost" size="icon" className="sm:hidden h-10 w-10 rounded-xl"><User className="h-5 w-5" /></Button>
                  </Link>
                </div>

                {canChat ? (
                  <>
                    {/* Message Stream */}
                    <ScrollArea className="flex-1 p-4 md:p-12 bg-primary/[0.01]">
                      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                        {loadingMessages ? (
                          <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
                        ) : messages.length > 0 ? renderMessages() : (
                          <div className="py-20 md:py-32 text-center max-w-sm mx-auto space-y-6 animate-fade-in">
                            <div className="h-20 w-20 md:h-24 md:w-24 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto"><Sparkles className="h-10 w-10 md:h-12 md:w-12 text-primary/40" /></div>
                            <h3 className="text-2xl md:text-3xl font-headline font-bold text-primary">Purposeful Connection</h3>
                            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">Approach this conversation with respect and the intention of fulfilling your deen.</p>
                          </div>
                        )}
                        <div ref={scrollRef} />
                      </div>
                    </ScrollArea>

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} className="p-4 md:p-8 bg-white border-t">
                      <div className="max-w-4xl mx-auto flex gap-3 md:gap-4">
                        <Input 
                          placeholder="Type your message..." 
                          className="flex-1 h-12 md:h-16 bg-muted/40 border-none rounded-xl md:rounded-[2rem] px-4 md:px-8 focus-visible:ring-primary/10 text-sm md:text-base shadow-inner font-medium" 
                          value={messageText} 
                          onChange={(e) => setMessageText(e.target.value)} 
                        />
                        <Button 
                          type="submit" 
                          size="icon" 
                          className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-[2rem] shadow-2xl bg-primary hover:scale-105 transition-transform active:scale-95 shrink-0" 
                          disabled={!messageText.trim()}
                        >
                          <Send className="h-5 w-5 md:h-7 md:w-7" />
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  /* Paywall Screen */
                  <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white/20">
                    <div className="h-24 w-24 md:h-32 md:w-32 bg-orange-100 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center mb-6 md:mb-10 shadow-2xl animate-fade-in"><Lock className="h-12 w-12 md:h-16 md:w-16 text-orange-600" /></div>
                    <h3 className="text-2xl md:text-4xl font-headline font-bold mb-4 md:mb-6 text-primary tracking-tight">Messaging Restricted</h3>
                    <p className="text-muted-foreground text-sm md:text-lg max-w-sm mb-8 md:mb-12 leading-relaxed font-medium">To initiate a conversation, please upgrade to a **Silver Plan** or higher.</p>
                    <Link href="/membership" className="w-full sm:w-auto">
                      <Button className="h-16 md:h-20 px-8 md:px-12 gap-3 md:gap-4 font-bold shadow-xl rounded-2xl md:rounded-[2.5rem] text-lg md:text-xl bg-primary hover:bg-primary/90 hover:scale-105 transition-all w-full">
                        <Crown className="h-5 w-5 md:h-6 md:w-6 text-secondary" /> Upgrade to Chat
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            ) : (
              /* Empty State Window (Desktop only) */
              <Card className="flex-1 border-none shadow-2xl flex flex-col items-center justify-center text-center p-20 bg-white/40 backdrop-blur-3xl rounded-[4rem] border border-white/40 h-full hidden md:flex">
                <div className="h-40 w-40 bg-primary/5 rounded-[4rem] flex items-center justify-center mb-12 shadow-[0_40px_80px_rgba(8,112,84,0.1)] group">
                  <MessageSquare className="h-20 w-20 text-primary opacity-10 group-hover:opacity-30 transition-all duration-700 scale-100 group-hover:scale-110" />
                </div>
                <h3 className="text-5xl font-headline font-bold mb-6 text-primary tracking-tight">Your Inbox</h3>
                <p className="text-muted-foreground/70 max-w-md mb-16 leading-relaxed text-lg font-medium">Select a verified match from your list to begin a purposeful discussion about your future journey together.</p>
                <div className="grid gap-6 lg:gap-8 w-full max-w-xl">
                   {[
                    { icon: ShieldAlert, title: "Secure & Encrypted", msg: "Conversations are strictly private between you and your match." },
                    { icon: Clock, title: "Timed Interactions", msg: "Intentional communication helps build deeper foundations for marriage." }
                   ].map((item, i) => (
                    <div key={i} className="flex items-center gap-6 p-6 lg:p-8 bg-white rounded-[2.5rem] text-left border border-border/40 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-2">
                      <div className="h-14 w-14 lg:h-16 lg:w-16 rounded-[1.25rem] lg:rounded-[1.5rem] bg-accent flex items-center justify-center shrink-0 shadow-inner"><item.icon className="h-6 w-6 lg:h-8 lg:w-8 text-primary" /></div>
                      <div>
                        <p className="font-bold text-primary text-base lg:text-lg mb-1">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed font-medium uppercase tracking-widest opacity-70">{item.msg}</p>
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