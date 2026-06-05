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
  User
} from "lucide-react";
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
  updateDoc 
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { format, isToday, isYesterday } from "date-fns";
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

export default function MessagesPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [activeInterest, setActiveInterest] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarSearch, setSidebarSearch] = useState("");

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userProfileRef);

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
      ),
      orderBy("updatedAt", "desc")
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
    const interestRef = doc(db, "interests", activeInterest.id);

    addDoc(msgsRef, messageData)
      .then(() => {
        setMessageText("");
        // Update parent interest for sorting and preview
        updateDoc(interestRef, {
          lastMessage: messageText.trim(),
          updatedAt: serverTimestamp()
        });
      })
      .catch(async (e) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: msgsRef.path,
          operation: 'create',
          requestResourceData: messageData
        }));
      });
  };

  const formatMessageDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

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
          {showDateDivider && (
            <div className="flex justify-center my-6">
              <span className="bg-muted px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {dateStr}
              </span>
            </div>
          )}
          <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
              isMine 
                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                : 'bg-white text-foreground border border-border/50 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
            <div className="flex items-center gap-1.5 mt-1 px-1">
              <span className="text-[9px] text-muted-foreground opacity-60">
                {msgDate ? format(msgDate, 'HH:mm') : '...'}
              </span>
              {isMine && (
                <span className="text-primary">
                  {msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3 opacity-50" />}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  if (authLoading || loadingMatches) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  // Admin Testing Mode: Bypass chat restrictions for admins
  const isAdmin = profile?.role === 'admin';
  const canChat = isAdmin || ["Silver", "Gold", "Premium"].includes(profile?.membership?.plan || "Free");

  const filteredMatches = matches.filter(m => {
    const partnerName = m.fromUserId === user?.uid ? m.toUserName : m.fromUserName;
    return (partnerName || "").toLowerCase().includes(sidebarSearch.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-12 h-[calc(100vh-10rem)]">
          {/* Sidebar */}
          <aside className={`lg:col-span-4 flex flex-col gap-4 ${activeInterest ? 'hidden lg:flex' : 'flex'}`}>
            <div className="flex items-center justify-between px-2">
              <h1 className="text-2xl font-bold font-headline">Messages</h1>
              <Badge variant="outline" className="h-6 font-bold text-[10px]">{matches.length} matches</Badge>
            </div>
            
            <div className="relative px-2">
              <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-10 h-10 bg-white/50 border-none rounded-xl"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
              />
            </div>

            <ScrollArea className="flex-1 rounded-3xl border bg-white/50 backdrop-blur-md overflow-hidden">
              <div className="p-2 space-y-1">
                {filteredMatches.length > 0 ? (
                  filteredMatches.map((match: any) => {
                    const partnerId = match.fromUserId === user?.uid ? match.toUserId : match.fromUserId;
                    const partnerName = match.fromUserId === user?.uid ? match.toUserName : match.fromUserName;
                    const isActive = activeInterest?.id === match.id;
                    
                    return (
                      <div 
                        key={match.id} 
                        onClick={() => setActiveInterest(match)}
                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]" 
                            : "hover:bg-accent/40"
                        }`}
                      >
                         <UserAvatar userId={partnerId} className="h-12 w-12 shrink-0 border-2 border-white/20 shadow-sm" />
                         <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                              <p className="font-bold truncate text-sm">{partnerName}</p>
                              {match.updatedAt && (
                                <span className={`text-[9px] ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                  {format(match.updatedAt.toDate(), 'HH:mm')}
                                </span>
                              )}
                            </div>
                            <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                              {match.lastMessage || "Start a conversation..."}
                            </p>
                         </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 text-center px-4">
                     <MessageSquare className="mx-auto h-12 w-12 opacity-10 mb-4" />
                     <p className="text-xs text-muted-foreground">No conversations found.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Active Chat */}
          <section className={`lg:col-span-8 flex flex-col overflow-hidden ${!activeInterest ? 'hidden lg:flex' : 'flex'}`}>
            {activeInterest ? (
              <Card className="flex-1 flex flex-col border-none shadow-2xl overflow-hidden bg-white/60 backdrop-blur-lg">
                {/* Chat Header */}
                <div className="p-4 border-b bg-white/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setActiveInterest(null)}>
                       <ChevronLeft className="h-5 w-5" />
                     </Button>
                     <UserAvatar userId={activeInterest.fromUserId === user?.uid ? activeInterest.toUserId : activeInterest.fromUserId} className="h-10 w-10 border-2 border-primary/10" />
                     <div>
                        <p className="font-bold text-sm leading-none">
                          {activeInterest.fromUserId === user?.uid ? activeInterest.toUserName : activeInterest.fromUserName}
                        </p>
                        <span className="text-[10px] text-primary font-bold flex items-center gap-1 mt-1">
                          <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" /> Secure Connection
                        </span>
                     </div>
                  </div>
                  <Link href={`/profiles/${activeInterest.fromUserId === user?.uid ? activeInterest.toUserId : activeInterest.fromUserId}`}>
                    <Button variant="outline" size="sm" className="text-[10px] font-bold h-8 rounded-full px-4">View Profile</Button>
                  </Link>
                </div>

                {/* Messages Body */}
                {canChat ? (
                  <>
                    <ScrollArea className="flex-1 p-6">
                      <div className="space-y-2">
                        {loadingMessages ? (
                          <div className="flex h-40 items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                          </div>
                        ) : messages.length > 0 ? (
                          renderMessages()
                        ) : (
                          <div className="py-20 text-center flex flex-col items-center">
                             <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                               <MessageSquare className="h-10 w-10 text-primary opacity-20" />
                             </div>
                             <h3 className="text-lg font-bold font-headline mb-2 text-primary">Begin with Bismillah</h3>
                             <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                               Maintaining respect and tradition in communication is the foundation of a blessed union.
                             </p>
                          </div>
                        )}
                        <div ref={scrollRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t bg-white/80">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Write your message respectfully..." 
                          className="flex-1 h-12 bg-muted/30 border-none rounded-2xl shadow-inner px-5 focus-visible:ring-primary/20"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                        />
                        <Button type="submit" size="icon" className="h-12 w-12 rounded-2xl shadow-lg" disabled={!messageText.trim()}>
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="h-24 w-24 bg-orange-100 rounded-full flex items-center justify-center mb-8">
                       <Lock className="h-12 w-12 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-headline font-bold mb-4">Chat is Locked</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
                      You've matched! To start the conversation and exchange values, please upgrade to a **Silver Plan** or higher.
                    </p>
                    <Link href="/membership">
                      <Button className="h-12 px-8 gap-2 font-bold shadow-xl rounded-xl">
                        <Crown className="h-4 w-4" /> Upgrade to Chat
                      </Button>
                    </Link>
                    <p className="text-[10px] text-muted-foreground mt-4 italic">
                      Includes 30 interests/mo and increased visibility.
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="flex-1 border-none shadow-xl flex flex-col items-center justify-center text-center p-12 bg-white/50 backdrop-blur-md rounded-[2.5rem]">
                <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mb-10 group">
                  <MessageSquare className="h-12 w-12 text-primary opacity-20 group-hover:opacity-40 transition-opacity" />
                </div>
                <h3 className="text-3xl font-headline font-bold mb-4 text-primary">Your Conversations</h3>
                <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed text-sm">
                  Choose a verified match from the list to begin a purposeful discussion about your future and shared journey.
                </p>
                
                <div className="grid gap-3 w-full max-w-sm">
                   <div className="flex items-start gap-4 p-5 bg-white rounded-2xl text-xs text-left border border-border/50 shadow-sm">
                    <ShieldAlert className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-bold mb-1">Safety First</p>
                      <p className="text-muted-foreground leading-relaxed">
                        Keep conversations within the platform for your security. Report any suspicious behavior.
                      </p>
                    </div>
                  </div>
                   <div className="flex items-start gap-4 p-5 bg-white rounded-2xl text-xs text-left border border-border/50 shadow-sm">
                    <AlertCircle className="h-5 w-5 text-secondary-foreground shrink-0" />
                    <div>
                      <p className="font-bold mb-1">Respectful Intent</p>
                      <p className="text-muted-foreground leading-relaxed">
                        Approach every interaction with sincerity and respect for the other member's values.
                      </p>
                    </div>
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
