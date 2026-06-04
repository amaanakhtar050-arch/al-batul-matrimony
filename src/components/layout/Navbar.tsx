
"use client";

import Link from "next/link";
import { User, Heart, MessageSquare, Search, Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [isLoggedIn] = useState(true); // Mock auth state

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-headline text-2xl font-bold text-primary">Al Batul</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/discover" className="flex items-center gap-1.5 text-sm font-medium hover:text-primary">
            <Search className="h-4 w-4" />
            Discover
          </Link>
          <Link href="/interests" className="flex items-center gap-1.5 text-sm font-medium hover:text-primary">
            <Heart className="h-4 w-4" />
            Interests
          </Link>
          <Link href="/messages" className="flex items-center gap-1.5 text-sm font-medium hover:text-primary">
            <MessageSquare className="h-4 w-4" />
            Messages
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-secondary"></span>
              </Button>
              <Link href="/dashboard">
                <Button variant="default" className="hidden gap-2 md:flex">
                  <User className="h-4 w-4" />
                  My Profile
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost">Login</Button>
              <Button>Join Al Batul</Button>
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
              <div className="flex flex-col gap-6 py-8">
                <Link href="/discover" className="text-lg font-medium">Discover</Link>
                <Link href="/interests" className="text-lg font-medium">Interests</Link>
                <Link href="/messages" className="text-lg font-medium">Messages</Link>
                <Link href="/dashboard" className="text-lg font-medium">My Profile</Link>
                <Link href="/membership" className="text-lg font-medium">Premium Membership</Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
