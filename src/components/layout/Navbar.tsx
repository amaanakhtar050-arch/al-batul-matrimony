
'use client';

import Link from "next/link";
import { User, Heart, MessageSquare, Search, Menu, Bell, LogOut, ShieldAlert, Lock, Trash2, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
    <div className={cn("relative overflow-hidden rounded-full bg-muted shadow-inner", className)}>
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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "An unexpected error occurred. Please try again."
      });
    }
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
    { href: "/support", label: "Support", icon: HelpCircle, restricted: false },
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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-2xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo variant="full" size={40} />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {isAdmin && (
            <Link href="/admin" className={cn(
              "flex items-center gap-2 text-sm font-bold transition-all px-4 py-2 rounded-full",
              pathname.startsWith('/admin') ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted"
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
                  "flex items-center gap-2 text-sm font-semibold transition-all group px-2 py-1",
                  active ? "text-primary scale-105" : "text-muted-foreground hover:text-primary",
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
                <div className={cn("p-2 rounded-xl transition-colors", active ? "bg-primary/10" : "group-hover:bg-primary/5")}>
                  {isDisabled ? <Lock className="h-4 w-4" /> : <link.icon className="h-4 w-4" />}
                </div>
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {!loading && user ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-11 w-11 rounded-2xl transition-all", pathname === '/discover' ? "bg-primary/10 text-primary" : "hover:bg-muted")} 
                onClick={handleSearchClick}
              >
                <Search className="h-5 w-5" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-2xl hover:bg-muted transition-all">
                    <Bell className="h-5 w-5" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground shadow-lg border-2 border-background">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0 shadow-2xl border-none rounded-[2rem] overflow-hidden mt-2" align="end">
                  <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-primary">Notifications</h3>
                    <Link href="/notifications" className="text-xs font-bold text-primary hover:underline">View All</Link>
                  </div>
                  <div className="max-h-[450px] overflow-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n: any) => (
                        <div 
                          key={n.id} 
                          className={cn("p-6 border-b text-sm flex justify-between items-start gap-4 transition-colors cursor-pointer hover:bg-muted/10", !n.read ? "bg-primary/[0.03] border-l-4 border-l-primary" : "bg-transparent")}
                          onClick={() => !n.read && handleMarkAsRead(n.id)}
                        >
                          <div className="flex-1 space-y-1.5">
                            <p className={cn("text-sm", !n.read ? "font-bold text-foreground" : "text-muted-foreground")}>{n.title || "Notification"}</p>
                            <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">{n.message || "Interaction details available..."}</p>
                            <span className="text-[10px] text-muted-foreground font-bold opacity-60 uppercase tracking-widest">{n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'Just now'}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 rounded-full" onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n.id); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))
                    ) : (
                      <div className="p-16 text-center flex flex-col items-center gap-4">
                        <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center"><Bell className="h-8 w-8 text-muted-foreground/30" /></div>
                        <p className="text-muted-foreground text-sm font-medium italic">Your inbox is empty.</p>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Link href="/dashboard">
                <Button variant="ghost" className={cn("flex h-12 px-2 items-center gap-3 rounded-2xl transition-all", pathname === '/dashboard' ? "bg-primary/5 shadow-inner" : "hover:bg-muted")}>
                   <div className="h-9 w-9 overflow-hidden rounded-xl border border-primary/20 bg-muted shrink-0">
                     {profile?.photoUrl ? (
                       <Image src={profile.photoUrl} alt="Avatar" width={40} height={40} className="h-full w-full object-cover" />
                     ) : (
                       <div className="h-full w-full flex items-center justify-center"><User className="h-5 w-5 text-muted-foreground" /></div>
                     )}
                   </div>
                   <span className="hidden lg:block text-xs font-bold text-primary pr-2">My Profile</span>
                </Button>
              </Link>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl text-destructive hover:bg-destructive/10 transition-all" title="Log Out">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2.5rem] p-8 max-w-sm mx-auto">
                  <AlertDialogHeader className="space-y-4">
                    <div className="h-16 w-16 bg-destructive/5 rounded-2xl flex items-center justify-center mx-auto mb-2">
                       <LogOut className="h-8 w-8 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-headline text-center">Log Out</AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-muted-foreground leading-relaxed">
                      Are you sure you want to log out of Al Batul Matrimony? You will need to sign in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-8 flex flex-col gap-3">
                    <AlertDialogCancel className="w-full h-14 rounded-2xl font-bold border-2 hover:bg-muted m-0">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleLogout} 
                      className="w-full h-14 rounded-2xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xl m-0"
                    >
                      Log Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : !loading && (
            <div className="flex gap-4">
              <Link href="/login"><Button variant="ghost" className="font-bold">Login</Button></Link>
              <Link href="/register"><Button className="font-bold shadow-xl rounded-2xl px-8">Join Free</Button></Link>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-11 w-11 rounded-2xl hover:bg-muted"><Menu className="h-6 w-6" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="rounded-l-[3rem] border-none shadow-2xl p-0">
              <SheetHeader className="sr-only"><SheetTitle>Navigation Menu</SheetTitle></SheetHeader>
              <div className="flex flex-col gap-6 py-12 px-8 h-full">
                <Logo variant="full" size={48} className="mb-8" />
                {isAdmin && (
                  <Link href="/admin" className="text-xl font-bold text-primary flex items-center gap-4 p-4 rounded-3xl bg-primary/5">
                    <ShieldAlert className="h-6 w-6" /> Admin Panel
                  </Link>
                )}
                <Link href="/discover" className={cn("text-xl font-bold flex items-center gap-4 p-4", (!hasProfile || !isApproved) && !isAdmin && "opacity-50")} onClick={handleSearchClick as any}>
                  <Search className="h-6 w-6 text-primary" /> Discover Matches
                </Link>
                {navLinks.map((link) => {
                  const isDisabled = link.restricted && (!hasProfile || !isApproved) && !isAdmin;
                  return (
                    <Link 
                      key={link.href}
                      href={isDisabled ? "#" : link.href} 
                      className={cn("text-xl font-bold flex items-center gap-4 p-4", isDisabled && "opacity-50")}
                      onClick={(e) => {
                        if (isDisabled) {
                          e.preventDefault();
                          toast({ title: "Access Restricted" });
                        }
                      }}
                    >
                      <div className="p-3 bg-muted rounded-2xl">{isDisabled ? <Lock className="h-6 w-6" /> : <link.icon className="h-6 w-6 text-primary" />}</div>
                      {link.label}
                    </Link>
                  );
                })}
                <div className="mt-auto space-y-4">
                  <Link href="/dashboard" className="block p-4 rounded-3xl bg-muted text-center font-bold">My Dashboard</Link>
                  {user && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full h-14 rounded-3xl font-bold shadow-xl">Log Out</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2.5rem] p-8 max-w-[90vw] mx-auto">
                        <AlertDialogHeader className="space-y-4">
                          <AlertDialogTitle className="text-2xl font-headline text-center">Log Out</AlertDialogTitle>
                          <AlertDialogDescription className="text-center text-muted-foreground">
                            Are you sure you want to log out of Al Batul Matrimony? You will need to sign in again to access your account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 flex flex-col gap-3">
                          <AlertDialogCancel className="w-full h-12 rounded-xl font-bold m-0">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleLogout} className="w-full h-12 rounded-xl font-bold bg-destructive m-0">Log Out</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
