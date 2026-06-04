
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Calendar, 
  ShieldCheck, 
  Flag, 
  Ban, 
  MessageSquare,
  User,
  DollarSign,
  Ruler,
  Scale,
  Languages
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { format } from "date-fns";

export default function ProfileDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const db = useFirestore();
  const [interestSent, setInterestSent] = useState(false);

  const profileRef = id ? doc(db!, 'users', id as string) : null;
  const { data: profile, loading } = useDoc(profileRef as any);

  const handleSendInterest = () => {
    setInterestSent(true);
    toast({
      title: "Interest Sent",
      description: `We've notified ${profile?.fullName || 'the user'} of your interest.`,
    });
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-xl font-medium text-muted-foreground">Profile not found.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-6">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-2xl bg-muted">
                <Image 
                  src={profile.photoUrl || `https://picsum.photos/seed/${profile.id}/600/800`} 
                  alt={profile.fullName} 
                  fill 
                  className="object-cover" 
                />
                {profile.status === 'approved' && (
                   <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-primary shadow-lg backdrop-blur-md">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="text-sm font-bold">Verified Member</span>
                   </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleSendInterest} 
                  disabled={interestSent || profile.status !== 'approved'}
                  className="h-14 flex-1 gap-2 text-lg font-bold bg-secondary hover:bg-secondary/90 text-primary-foreground"
                >
                  <Heart className={`h-5 w-5 ${interestSent ? 'fill-current' : ''}`} />
                  {interestSent ? 'Interest Sent' : 'Send Interest'}
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14">
                  <MessageSquare className="h-6 w-6" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 text-muted-foreground">
                <button className="flex items-center gap-1 hover:text-destructive text-sm font-medium">
                  <Flag className="h-4 w-4" /> Report
                </button>
                <button className="flex items-center gap-1 hover:text-destructive text-sm font-medium">
                  <Ban className="h-4 w-4" /> Block
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <h1 className="text-5xl font-bold font-headline">{profile.fullName}, {profile.age}</h1>
              <Badge variant="outline" className="h-8 border-primary/20 bg-primary/5 px-4 text-sm text-primary">{profile.sect}</Badge>
              <Badge variant="outline" className="h-8 border-secondary/20 bg-secondary/5 px-4 text-sm text-secondary">{profile.maritalStatus}</Badge>
            </div>

            <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Location</span>
                </div>
                <p className="font-medium">{profile.city}, {profile.country}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Education</span>
                </div>
                <p className="font-medium">{profile.education}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Occupation</span>
                </div>
                <p className="font-medium">{profile.occupation}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Ruler className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Height</span>
                </div>
                <p className="font-medium">{profile.height || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Scale className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Weight</span>
                </div>
                <p className="font-medium">{profile.weight || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Languages className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Languages</span>
                </div>
                <p className="font-medium">{profile.languagesSpoken?.join(', ') || 'N/A'}</p>
              </div>
            </div>

            <section className="mb-12">
              <h3 className="mb-4 text-2xl font-bold font-headline border-b pb-2">About Me</h3>
              <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {profile.about}
              </p>
            </section>

            <div className="grid gap-8 md:grid-cols-2">
              <section className="rounded-3xl bg-white p-8 shadow-sm border border-border/50">
                <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Details & Values
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-muted py-2">
                    <span className="text-muted-foreground text-sm">Date of Birth</span>
                    <span className="font-medium text-sm">{profile.dob || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-muted py-2">
                    <span className="text-muted-foreground text-sm">Annual Income</span>
                    <span className="font-medium text-sm flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> {profile.income || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-muted py-2">
                    <span className="text-muted-foreground text-sm">Last Active</span>
                    <span className="font-medium text-sm italic">
                      {profile.lastActiveAt ? format(new Date(profile.lastActiveAt), 'MMM dd, HH:mm') : 'Recently'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl bg-primary/5 p-8 shadow-sm border border-primary/10">
                <h3 className="mb-6 text-xl font-bold flex items-center gap-2 text-primary">
                  <Heart className="h-5 w-5" /> Looking For
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-primary/10 py-2">
                    <span className="text-muted-foreground text-sm">Age Range</span>
                    <span className="font-medium text-sm">
                      {profile.partnerPreferences?.minAge || 18} - {profile.partnerPreferences?.maxAge || 40} Years
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-primary/10 py-2">
                    <span className="text-muted-foreground text-sm">Sect Preference</span>
                    <span className="font-medium text-sm">{profile.partnerPreferences?.sect || 'Any'}</span>
                  </div>
                  <div className="flex justify-between border-b border-primary/10 py-2">
                    <span className="text-muted-foreground text-sm">Min. Education</span>
                    <span className="font-medium text-sm">{profile.partnerPreferences?.education || 'Any'}</span>
                  </div>
                  <div className="flex justify-between border-b border-primary/10 py-2">
                    <span className="text-muted-foreground text-sm">Preferred Region</span>
                    <span className="font-medium text-sm">{profile.partnerPreferences?.location || 'Any'}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
