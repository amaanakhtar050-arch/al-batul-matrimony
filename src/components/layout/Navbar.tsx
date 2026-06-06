
'use client';

import Link from "next/link";
import { User, Heart, MessageSquare, Search, Menu, Bell, LogOut, ShieldAlert, Lock, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { doc, collection, query, orderBy, limit, updateDoc, deleteDoc, where } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Logo } from "@/components/brand/Logo";

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

export function Navbar() {
  const { user, loading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(profileRef);

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [db, user]);

  const { data: notifications } = useCollection(notificationsQuery);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const sentMatchesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "interests"),
      where("fromUserId", "==", user.uid),
      where("status", "==", "accepted"),
      limit(20)
    );
  }, [db, user]);

  const receivedMatchesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "interests"),
      where("toUserId", "==", user.uid),
      where("status", "==", "accepted"),
      limit(20)
    );
  }, [db, user]);

  const { data: sentMatches } = useCollection(sentMatchesQuery);
  const { data: receivedMatches } = useCollection(receivedMatchesQuery);

  const recentMatches = useMemo(() => {
    const combined = [...sentMatches, ...receivedMatches];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique.sort((a: any, b: any) => {
      const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
      const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
      return timeB - timeA;
    });
  }, [sentMatches, receivedMatches]);

  const hasUnreadMessages = useMemo(() => {
    return recentMatches.some(m => m.lastMessageRead === false && m.lastMessageSenderId && m.lastMessageSenderId !== user?.uid);
  }, [recentMatches, user]);

  const isAdmin = profile?.role === 'admin';
  const hasProfile = !!profile && profile.isProfileComplete;
  const isApproved = profile?.status === 'approved';

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/');
    } catch (error: any) {}
  };

  const handleMarkAsRead = (id: string) => {
    if (!db || !user) return;
    const notificationRef = doc(db, 'users', user.uid, 'notifications', id);
    updateDoc(notificationRef, { read: true });
  };

  const handleDeleteNotification = (id: string) => {
    if (!db || !user) return;
    const notificationRef = doc(db, 'users', user.uid, 'notifications', id);
    deleteDoc(notificationRef);
  };

  const navLinks = [
    { href: "/interests", label: "Interests", icon: Heart, restricted: true },
    { href: "/messages", label: "Messages", icon: MessageSquare, restricted: true },
  ];

  const handleSearchClick = (e: React.MouseEvent) => {
    const isDisabled = (!hasProfile || !isApproved) && !isAdmin;
    if (isDisabled) {
      e.preventDefault();
      toast({
        title: "Access Restricted",
        description: !hasProfile ? "Complete profile first." : "Profile pending approval.",
      });
    } else {
      router.push('/discover');
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Link href="/">
          <Logo variant="full" size={36} />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {isAdmin && (
            <Link href="/admin" className={cn(
              "flex items-center gap-1.5 text-sm font-bold transition-colors",
              pathname.startsWith('/admin') ? "text-primary" : "text-muted-foreground hover:text-primary"
            )}>
              <ShieldAlert className="h-4 w-4" /> Admin
            </Link>
          )}
          {navLinks.map((link) => {
            const isDisabled = link.restricted && (!hasProfile || !isApproved) && !isAdmin;
            const active = pathname === link.href;
            
            return (
              <Link 
                key={link.href}
                href={isDisabled ? "#" : link.href} 
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-colors",
                  active ? "text-primary font-bold" : "text-muted-foreground hover:text-primary",
                  isDisabled && "cursor-not-allowed opacity-50"
                )}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    toast({
                      title: "Access Restricted",
                      description: !hasProfile ? "Complete profile first." : "Profile pending approval.",
                    });
                  }
                }}
              >
                {isDisabled ? <Lock className="h-3.5 w-3.5" /> : <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {!loading && user ? (
            <>
              {/* Search Trigger */}
              <Button 
                variant={pathname === '/discover' ? 'default' : 'ghost'} 
                size="icon" 
                className="h-9 w-9 rounded-full" 
                onClick={handleSearchClick}
                title="Search Members"
              >
                <Search className="h-5 w-5" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute right-1 top-1 h-4 w-4 flex items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground shadow-sm">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 shadow-2xl border-primary/10" align="end">
                  <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <Link href="/notifications" className="text-[10px] font-bold text-primary uppercase hover:underline">View All</Link>
                  </div>
                  <div className="max-h-[400px] overflow-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n: any) => (
                        <div 
                          key={n.id} 
                          className={cn("p-4 border-b text-xs flex justify-between items-start gap-4 transition-colors cursor-pointer hover:bg-muted/20", !n.read ? "bg-primary/5 border-l-4 border-l-primary" : "bg-transparent")}
                          onClick={() => !n.read && handleMarkAsRead(n.id)}
                        >
                          <div className="flex-1 space-y-1">
                            <p className={cn("text-[11px]", !n.read ? "font-bold text-foreground" : "text-muted-foreground")}>{n.title || "Notification"}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">{n.message || "Notification details..."}</p>
                            <span className="text-[9px] text-muted-foreground opacity-70">{n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'Just now'}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n.id); }}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center flex flex-col items-center gap-2">
                        <Bell className="h-8 w-8 text-muted-foreground/20" />
                        <p className="text-muted-foreground text-[11px] italic">No notifications yet.</p>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <MessageSquare className="h-5 w-5" />
                    {(recentMatches.length > 0 || hasUnreadMessages) && (
                      <span className="absolute right-1 top-1 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-sm">
                        {recentMatches.filter(m => !m.lastMessageRead && m.lastMessageSenderId !== user.uid).length || recentMatches.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 shadow-2xl border-primary/10" align="end">
                  <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                    <h3 className="font-bold text-sm">Matches & Chat</h3>
                    <Link href="/messages" className="text-[10px] font-bold text-primary uppercase hover:underline">Open Messages</Link>
                  </div>
                  <div className="max-h-[400px] overflow-auto">
                    {recentMatches.length > 0 ? (
                      recentMatches.map((match: any) => {
                        const partnerId = match.fromUserId === user?.uid ? match.toUserId : match.fromUserId;
                        const partnerName = match.fromUserId === user?.uid ? match.toUserName : match.fromUserName;
                        return (
                          <div key={match.id} className="p-4 border-b flex items-center gap-3 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => router.push('/messages')}>
                            <UserAvatar userId={partnerId} className="h-10 w-10 shrink-0 border border-primary/10" />
                            <div className="flex-1 overflow-hidden">
                              <div className="flex justify-between items-center mb-0.5">
                                <p className="font-bold text-xs truncate">{partnerName}</p>
                                {match.updatedAt?.toDate && <span className="text-[9px] text-muted-foreground">{formatDistanceToNow(match.updatedAt.toDate(), { addSuffix: false })}</span>}
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">{match.lastMessage || "Start a conversation..."}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-12 text-center flex flex-col items-center gap-2">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/20" />
                        <p className="text-muted-foreground text-[11px] italic">No active matches found.</p>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Link href="/dashboard">
                <Button variant={pathname === '/dashboard' ? 'default' : 'ghost'} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full p-0 border border-primary/20 bg-muted">
                   {profile?.photoUrl ? (
                     <Image src={profile.photoUrl} alt="Avatar" width={36} height={36} className="h-full w-full object-cover" />
                   ) : (
                     <User className="h-5 w-5 text-muted-foreground" />
                   )}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleLogout} title="Log Out">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : !loading && (
            <div className="flex gap-2">
              <Link href="/login"><Button variant="ghost">Login</Button></Link>
              <Link href="/register"><Button>Join Al Batul</Button></Link>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-6 w-6" /></Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="sr-only"><SheetTitle>Navigation Menu</SheetTitle></SheetHeader>
              <div className="flex flex-col gap-6 py-8">
                {isAdmin && (
                  <Link href="/admin" className="text-lg font-bold text-primary flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" /> Admin Panel
                  </Link>
                )}
                <Link href="/discover" className={cn("text-lg font-medium flex items-center gap-2", (!hasProfile || !isApproved) && !isAdmin && "opacity-50 cursor-not-allowed")} onClick={handleSearchClick as any}>
                  <Search className="h-5 w-5" /> Search
                </Link>
                {navLinks.map((link) => {
                  const isDisabled = link.restricted && (!hasProfile || !isApproved) && !isAdmin;
                  return (
                    <Link 
                      key={link.href}
                      href={isDisabled ? "#" : link.href} 
                      className={cn("text-lg font-medium flex items-center gap-2", isDisabled && "opacity-50 cursor-not-allowed")}
                      onClick={(e) => {
                        if (isDisabled) {
                          e.preventDefault();
                          toast({ title: "Access Restricted" });
                        }
                      }}
                    >
                      {isDisabled ? <Lock className="h-4 w-4" /> : <link.icon className="h-5 w-5" />} {link.label}
                    </Link>
                  );
                })}
                <Link href="/notifications" className="text-lg font-medium">Notifications</Link>
                <Link href="/messages" className="text-lg font-medium">Messages</Link>
                <Link href="/dashboard" className="text-lg font-medium">My Dashboard</Link>
                {user && <Button variant="destructive" className="w-full mt-4" onClick={handleLogout}>Logout</Button>}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
