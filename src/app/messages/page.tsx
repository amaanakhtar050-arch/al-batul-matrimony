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
  Loader2
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
    <div className={cn("relative overflow-hidden rounded-full bg-muted shadow-sm", className)}>
      {profile?.photoUrl ? <Image src={profile.photoUrl} alt="Avatar" fill className="object-cover" /> : <div className="flex h-full w-full items-center justify-center text-muted-foreground/30"><User className="h-2/3 w-2/3" /></div>}
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
        <div key={msg.id} className="space-y-4">
          {showDateDivider && <div className="flex justify-center my-6"><span className="bg-muted px-4 py-1.5 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{dateStr}</span></div>}
          <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[75%] rounded-[1.5rem] px-5 py-3 text-sm shadow-md transition-all ${isMine ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white text-foreground border border-border/50 rounded-tl-none shadow-sm'}`}>
              {msg.text}
            </div>
            <div className="flex items-center gap-1.5 mt-1 px-1">
              <span className="text-[9px] text-muted-foreground opacity-60 font-medium uppercase">{msgDate ? format(msgDate, 'HH:mm') : '...'}</span>
              {isMine && <span className="text-primary">{msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3 opacity-50" />}</span>}
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-12 h-[calc(100vh-12rem)]">
          {/* Sidebar */}
          <aside className={`lg:col-span-4 flex flex-col gap-6 ${activeInterest ? 'hidden lg:flex' : 'flex'}`}>
            <div className="flex items-center justify-between px-2">
              <h1 className="text-3xl font-bold font-headline text-primary">Conversations</h1>
              <Badge variant="outline" className="h-7 px-3 bg-primary/5 text-primary border-primary/10 font-bold text-xs">{matches.length} matches</Badge>
            </div>
            <div className="relative px-2">
              <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search chats..." className="pl-12 h-12 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20" value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)} />
            </div>
            <ScrollArea className="flex-1 rounded-[2.5rem] border-none shadow-xl bg-white/50 backdrop-blur-md overflow-hidden p-4">
              <div className="space-y-2">
                {filteredMatches.length > 0 ? filteredMatches.map((match: any) => {
                  const partnerId = match.fromUserId === user?.uid ? match.toUserId : match.fromUserId;
                  const partnerName = match.fromUserId === user?.uid ? match.toUserName : match.fromUserName;
                  const isActive = activeInterest?.id === match.id;
                  return (
                    <div key={match.id} onClick={() => setActiveInterest(match)} className={cn("flex items-center gap-4 p-5 rounded-[1.75rem] cursor-pointer transition-all border border-transparent hover:shadow-lg", isActive ? "bg-primary text-primary-foreground shadow-2xl scale-[1.02] border-none" : "bg-white/40 hover:bg-white")}>
                       <UserAvatar userId={partnerId} className="h-14 w-14 shrink-0 border-2 border-white/20 shadow-md" />
                       <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <p className="font-bold truncate text-sm">{partnerName}</p>
                            {match.updatedAt?.toDate && <span className={cn("text-[9px] font-bold uppercase tracking-widest", isActive ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{format(match.updatedAt.toDate(), 'HH:mm')}</span>}
                          </div>
                          <p className={cn("text-xs truncate mt-1 opacity-80", isActive ? 'text-primary-foreground/90' : 'text-muted-foreground')}>{match.lastMessage || "Start a conversation..."}</p>
                       </div>
                    </div>
                  );
                }) : <div className="py-24 text-center px-4 opacity-20"><MessageSquare className="mx-auto h-20 w-20 mb-4" /><p className="text-sm font-bold">No discussions yet</p></div>}
              </div>
            </ScrollArea>
          </aside>

          {/* Chat Window */}
          <section className={`lg:col-span-8 flex flex-col overflow-hidden ${!activeInterest ? 'hidden lg:flex' : 'flex'}`}>
            {activeInterest ? (
              <Card className="flex-1 flex flex-col border-none shadow-2xl overflow-hidden bg-white/40 backdrop-blur-xl rounded-[2.5rem]">
                <div className="p-6 border-b bg-white/60 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10" onClick={() => setActiveInterest(null)}><ChevronLeft className="h-6 w-6" /></Button>
                     <UserAvatar userId={activeInterest.fromUserId === user?.uid ? activeInterest.toUserId : activeInterest.fromUserId} className="h-14 w-14 border-2 border-primary/10" />
                     <div>
                        <p className="font-bold text-lg font-headline text-primary">{activeInterest.fromUserId === user?.uid ? activeInterest.toUserName : activeInterest.fromUserName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Verified Connection</span>
                        </div>
                     </div>
                  </div>
                  <Link href={`/profiles/${activeInterest.fromUserId === user?.uid ? activeInterest.toUserId : activeInterest.fromUserId}`}><Button variant="outline" size="sm" className="font-bold h-10 px-6 rounded-full border-2">Profile</Button></Link>
                </div>

                {canChat ? (
                  <>
                    <ScrollArea className="flex-1 p-8 bg-muted/10">
                      <div className="space-y-4">{loadingMessages ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin opacity-20" /></div> : messages.length > 0 ? renderMessages() : <div className="py-24 text-center opacity-40"><MessageSquare className="h-16 w-16 mx-auto mb-6" /><p className="text-xl font-headline font-bold">Bismillah</p><p className="text-xs max-w-xs mx-auto mt-2 italic leading-relaxed">Approach this discussion with sincerity, respect, and clear intentions for a blessed future.</p></div>}<div ref={scrollRef} /></div>
                    </ScrollArea>
                    <form onSubmit={handleSendMessage} className="p-6 bg-white border-t">
                      <div className="flex gap-4">
                        <Input placeholder="Message with respect..." className="flex-1 h-14 bg-muted/40 border-none rounded-2xl px-6 focus-visible:ring-primary/10 text-base" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                        <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl shadow-xl transition-transform active:scale-95" disabled={!messageText.trim()}><Send className="h-6 w-6" /></Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="h-24 w-24 bg-orange-100 rounded-[2rem] flex items-center justify-center mb-10 shadow-lg"><Lock className="h-12 w-12 text-orange-600" /></div>
                    <h3 className="text-3xl font-headline font-bold mb-4 text-primary">Chat is Locked</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mb-10 leading-relaxed font-medium">To start the conversation and exchange values with your match, please upgrade to a **Silver Plan** or higher.</p>
                    <Link href="/membership"><Button className="h-14 px-10 gap-3 font-bold shadow-2xl rounded-2xl text-lg bg-primary hover:bg-primary/90"><Crown className="h-5 w-5" /> Upgrade to Chat</Button></Link>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="flex-1 border-none shadow-2xl flex flex-col items-center justify-center text-center p-16 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/20">
                <div className="h-32 w-32 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mb-10 group"><MessageSquare className="h-16 w-16 text-primary opacity-20 group-hover:opacity-40 transition-all duration-500 scale-100 group-hover:scale-110" /></div>
                <h3 className="text-4xl font-headline font-bold mb-4 text-primary">Your Conversations</h3>
                <p className="text-muted-foreground max-w-sm mb-12 leading-relaxed font-medium opacity-70">Choose a verified match from your list to begin a purposeful discussion about your future journey together.</p>
                <div className="grid gap-6 w-full max-w-md">
                   {[
                    { icon: ShieldAlert, title: "Private & Secure", msg: "All conversations are encrypted and kept strictly between you and your match." },
                    { icon: AlertCircle, title: "Respectful Approach", msg: "Approach every match with the same respect you'd expect for your own family." }
                   ].map((item, i) => (
                    <div key={i} className="flex items-start gap-5 p-6 bg-white rounded-[2rem] text-left border border-border/50 shadow-sm transition-all hover:shadow-md">
                      <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center shrink-0"><item.icon className="h-6 w-6 text-primary" /></div>
                      <div>
                        <p className="font-bold text-primary mb-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">{item.msg}</p>
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