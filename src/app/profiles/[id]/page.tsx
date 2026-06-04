
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, GraduationCap, Briefcase, Calendar, ShieldCheck, Flag, Ban, MessageSquare } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ProfileDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [interestSent, setInterestSent] = useState(false);

  // Mock profile finding
  const profile = {
    id: id as string,
    name: "Ayesha K.",
    age: 24,
    sect: "Sunni",
    city: "Dubai, UAE",
    country: "UAE",
    education: "MBA in Finance",
    occupation: "Financial Analyst",
    maritalStatus: "Single",
    height: "5'6\"",
    about: "I am a career-oriented person who values tradition and family. I enjoy traveling and exploring new cultures while staying rooted in my faith. Looking for someone who is equally ambitious and respectful of our values.",
    isVerified: true,
    imageUrl: PlaceHolderImages.find(img => img.id === 'profile-1')?.imageUrl || ""
  };

  const handleSendInterest = () => {
    setInterestSent(true);
    toast({
      title: "Interest Sent",
      description: `We've notified ${profile.name} of your interest. You'll be notified if they accept!`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Profile Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-2xl">
                <Image 
                  src={profile.imageUrl} 
                  alt={profile.name} 
                  fill 
                  className="object-cover" 
                />
                {profile.isVerified && (
                   <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-primary shadow-lg backdrop-blur-md">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="text-sm font-bold">Identity Verified</span>
                   </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleSendInterest} 
                  disabled={interestSent}
                  className="h-14 flex-1 gap-2 text-lg font-bold bg-secondary hover:bg-secondary/90 text-primary-foreground"
                >
                  <Heart className={`h-5 w-5 ${interestSent ? 'fill-current' : ''}`} />
                  {interestSent ? 'Interest Sent' : 'Send Interest'}
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14">
                  <MessageSquare className="h-6 w-6" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 pt-4 text-muted-foreground">
                <button className="flex items-center gap-1 hover:text-destructive">
                  <Flag className="h-4 w-4" />
                  <span className="text-sm">Report</span>
                </button>
                <button className="flex items-center gap-1 hover:text-destructive">
                  <Ban className="h-4 w-4" />
                  <span className="text-sm">Block</span>
                </button>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-3">
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <h1 className="text-5xl font-bold font-headline">{profile.name}, {profile.age}</h1>
              <Badge variant="outline" className="h-8 border-primary/20 bg-primary/5 px-4 text-sm text-primary">{profile.sect}</Badge>
              <Badge variant="outline" className="h-8 border-secondary/20 bg-secondary/5 px-4 text-sm text-secondary">{profile.maritalStatus}</Badge>
            </div>

            <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Location</span>
                </div>
                <p className="font-medium">{profile.city}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Education</span>
                </div>
                <p className="font-medium">{profile.education}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Occupation</span>
                </div>
                <p className="font-medium">{profile.occupation}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Height</span>
                </div>
                <p className="font-medium">{profile.height}</p>
              </div>
            </div>

            <section className="mb-12">
              <h3 className="mb-4 text-2xl font-bold font-headline">About Me</h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {profile.about}
              </p>
            </section>

            <section className="rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="mb-6 text-xl font-bold">Preferences & Values</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Religious Sect</span>
                    <span className="font-medium">{profile.sect}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Prayers</span>
                    <span className="font-medium">Regularly</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Dietary Habits</span>
                    <span className="font-medium">Halal Only</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Language</span>
                    <span className="font-medium">English, Urdu</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Willing to Relocate</span>
                    <span className="font-medium">Yes</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Smokes</span>
                    <span className="font-medium">Never</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
