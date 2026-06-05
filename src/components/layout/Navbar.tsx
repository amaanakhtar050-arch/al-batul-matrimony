
'use client';

import Link from "next/link";
import { User, Heart, MessageSquare, Search, Menu, Bell, LogOut, ShieldAlert, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-secondary"></span>
              </Button>
              <Link href="/dashboard">
                <Button variant={pathname === '/dashboard' ? 'default' : 'outline'} className="hidden gap-2 md:flex">
                  <User className="h-4 w-4" />
                  My Dashboard
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
