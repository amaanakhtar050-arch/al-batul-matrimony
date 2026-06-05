
'use client';

import Link from "next/link";
import { User, Heart, MessageSquare, Search, Menu, Bell, LogOut, ShieldAlert, Lock, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { doc, collection, query, orderBy, limit, updateDoc, deleteDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

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
      limit(10)
    );
  }, [db, user]);

  const { data: notifications } = useCollection(notificationsQuery);
  const unreadCount = notifications.filter(n => !n.read).length;

  const isAdmin = profile?.role === 'admin';
  const hasProfile = !!profile && profile.isProfileComplete;
  const isApproved = profile?.status === 'approved';

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "You have been successfully signed out.",
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message,
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
    { href: "/discover", label: "Discover", icon: Search, restricted: true },
    { href: "/interests", label: "Interests", icon: Heart, restricted: true },
    { href: "/messages", label: "Messages", icon: MessageSquare, restricted: true },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-headline text-2xl font-bold text-primary">Al Batul</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const isDisabled = link.restricted && (!hasProfile || !isApproved);
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
                      description: !hasProfile ? "Please complete your profile first." : "Your profile is pending admin approval.",
                    });
                  }
                }}
              >
                {isDisabled ? <Lock className="h-3.5 w-3.5" /> : <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            );
          })}
          
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-1.5 text-sm font-bold text-primary hover:opacity-80">
              <ShieldAlert className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!loading && user ? (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute right-2 top-2 h-4 w-4 flex items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground shadow-sm">
                        {unreadCount}
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
                          className={cn(
                            "p-4 border-b text-xs flex justify-between items-start gap-4 transition-colors cursor-pointer hover:bg-muted/20",
                            !n.read ? "bg-primary/5 border-l-4 border-l-primary" : "bg-transparent"
                          )}
                          onClick={() => !n.read && handleMarkAsRead(n.id)}
                        >
                          <div className="flex-1 space-y-1">
                            <p className={cn("text-[11px]", n.read ? "text-muted-foreground" : "font-bold text-foreground")}>{n.title}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{n.description}</p>
                            <span className="text-[9px] text-muted-foreground opacity-70">
                              {n.createdAt?.toDate() ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(n.id);
                          }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
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

              <Link href="/dashboard">
                <Button variant={pathname === '/dashboard' ? 'default' : 'ghost'} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full p-0 border border-primary/20 bg-muted">
                   {profile?.photoUrl ? (
                     <Image src={profile.photoUrl} alt="Avatar" width={40} height={40} className="h-full w-full object-cover" />
                   ) : (
                     <User className="h-5 w-5 text-muted-foreground" />
                   )}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Log Out">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : !loading && (
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Join Al Batul</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 py-8">
                {navLinks.map((link) => {
                  const isDisabled = link.restricted && (!hasProfile || !isApproved);
                  return (
                    <Link 
                      key={link.href}
                      href={isDisabled ? "#" : link.href} 
                      className={cn(
                        "text-lg font-medium flex items-center gap-2",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        if (isDisabled) {
                          e.preventDefault();
                          toast({
                            title: "Access Restricted",
                            description: !hasProfile ? "Please complete your profile first." : "Your profile is pending admin approval.",
                          });
                        }
                      }}
                    >
                      {isDisabled && <Lock className="h-4 w-4" />}
                      {link.label}
                    </Link>
                  );
                })}
                {isAdmin && <Link href="/admin" className="text-lg font-bold text-primary">Admin Panel</Link>}
                <Link href="/notifications" className="text-lg font-medium">Notifications {unreadCount > 0 && `(${unreadCount})`}</Link>
                <Link href="/dashboard" className="text-lg font-medium">My Dashboard</Link>
                <Link href="/membership" className="text-lg font-medium">Membership</Link>
                {user && (
                   <Button variant="destructive" className="w-full mt-4" onClick={handleLogout}>
                     Logout
                   </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
