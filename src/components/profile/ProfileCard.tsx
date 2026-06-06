"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, GraduationCap, Briefcase, Heart, ShieldCheck, User, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import { ActivityStatus } from "./ActivityStatus";

interface ProfileCardProps {
  profile: {
    id: string;
    name: string;
    age: number;
    sect: string;
    city: string;
    education: string;
    occupation: string;
    maritalStatus: string;
    imageUrl: string;
    imageHint: string;
    isVerified: boolean;
    lastActiveAt?: any;
  };
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Link href={`/profiles/${profile.id}`}>
      <Card className="group relative h-[420px] md:h-[520px] overflow-hidden rounded-[2.5rem] md:rounded-[3rem] border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-4 hover:shadow-primary/30 w-full">
        <div className="relative h-full w-full bg-muted">
          {profile.imageUrl ? (
            <Image
              src={profile.imageUrl}
              alt={profile.name}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
              data-ai-hint={profile.imageHint}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
              <User className="h-24 w-24 md:h-32 md:w-32" />
            </div>
          )}
          
          {/* Top Overlays */}
          <div className="absolute left-4 top-4 md:left-6 md:top-6 z-10 flex flex-col gap-2">
            {profile.isVerified && (
              <Badge className="bg-white/95 text-primary border-none h-8 md:h-10 px-3 md:px-5 flex items-center gap-2 shadow-2xl backdrop-blur-2xl rounded-xl md:rounded-2xl">
                <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest">Verified</span>
              </Badge>
            )}
            <div className="bg-black/20 backdrop-blur-md px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/10">
              <ActivityStatus lastActiveAt={profile.lastActiveAt} className="text-white" />
            </div>
          </div>

          <div className="absolute right-4 top-4 md:right-6 md:top-6 z-10">
             <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 flex items-center justify-center text-white transition-all hover:bg-secondary hover:text-white hover:scale-110 shadow-2xl">
                <Heart className="h-5 w-5 md:h-6 md:w-6" />
             </div>
          </div>
          
          {/* Dynamic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
          
          {/* Detailed Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white transition-transform duration-500 group-hover:translate-y-[-10px]">
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3 mb-1">
                <h3 className="text-2xl md:text-3xl font-bold font-headline leading-tight tracking-tight">{profile.name}, {profile.age}</h3>
                {profile.isVerified && <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-secondary animate-pulse" />}
              </div>
              <p className="text-[9px] md:text-xs font-bold text-white/70 uppercase tracking-[0.2em]">{profile.sect} Community</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 md:gap-3 mt-4 opacity-90">
              <div className="flex items-center gap-2 md:gap-2.5 bg-white/10 rounded-xl md:rounded-2xl p-2 md:p-3 backdrop-blur-xl border border-white/10 transition-colors group-hover:bg-white/20">
                <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 text-secondary shrink-0" />
                <span className="text-[9px] md:text-[11px] font-bold truncate leading-none">{profile.city}</span>
              </div>
              <div className="flex items-center gap-2 md:gap-2.5 bg-white/10 rounded-xl md:rounded-2xl p-2 md:p-3 backdrop-blur-xl border border-white/10 transition-colors group-hover:bg-white/20">
                <Users className="h-3 w-3 md:h-3.5 md:w-3.5 text-secondary shrink-0" />
                <span className="text-[9px] md:text-[11px] font-bold truncate leading-none">{profile.maritalStatus}</span>
              </div>
              <div className="flex items-center gap-2 md:gap-2.5 bg-white/10 rounded-xl md:rounded-2xl p-2 md:p-3 backdrop-blur-xl border border-white/10 transition-colors group-hover:bg-white/20">
                <GraduationCap className="h-3 w-3 md:h-3.5 md:w-3.5 text-secondary shrink-0" />
                <span className="text-[9px] md:text-[11px] font-bold truncate leading-none">{profile.education.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-2 md:gap-2.5 bg-white/10 rounded-xl md:rounded-2xl p-2 md:p-3 backdrop-blur-xl border border-white/10 transition-colors group-hover:bg-white/20">
                <Briefcase className="h-3 w-3 md:h-3.5 md:w-3.5 text-secondary shrink-0" />
                <span className="text-[9px] md:text-[11px] font-bold truncate leading-none">{profile.occupation.split(' ')[0]}</span>
              </div>
            </div>
            
            <div className="mt-6 md:mt-8 flex justify-center opacity-0 transition-all duration-500 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0">
               <span className="text-[9px] md:text-xs font-bold uppercase tracking-[0.4em] text-secondary">View Profile</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}