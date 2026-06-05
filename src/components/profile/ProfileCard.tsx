"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, GraduationCap, Briefcase, Heart, ShieldCheck, User, Users } from "lucide-react";
import Link from "next/link";

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
  };
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Link href={`/profiles/${profile.id}`}>
      <Card className="group relative h-[450px] overflow-hidden rounded-[2.5rem] border-none shadow-2xl transition-all hover:-translate-y-2 hover:shadow-primary/20">
        <div className="relative h-full w-full bg-muted">
          {profile.imageUrl ? (
            <Image
              src={profile.imageUrl}
              alt={profile.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              data-ai-hint={profile.imageHint}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
              <User className="h-24 w-24" />
            </div>
          )}
          
          {/* Top Overlays */}
          <div className="absolute left-4 top-4 z-10">
            {profile.isVerified && (
              <Badge className="bg-white/90 text-primary border-none h-8 px-3 flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
              </Badge>
            )}
          </div>

          <div className="absolute right-4 top-4 z-10">
             <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-colors hover:bg-secondary hover:text-white">
                <Heart className="h-5 w-5" />
             </div>
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          
          {/* Bottom Details */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="mb-3">
              <h3 className="text-2xl font-bold font-headline leading-none">{profile.name}, {profile.age}</h3>
              <p className="text-xs opacity-70 mt-1 font-medium tracking-wide">{profile.sect} Member</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2 backdrop-blur-sm border border-white/5">
                <MapPin className="h-3 w-3 text-secondary" />
                <span className="text-[10px] font-bold truncate">{profile.city}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2 backdrop-blur-sm border border-white/5">
                <Users className="h-3 w-3 text-secondary" />
                <span className="text-[10px] font-bold truncate">{profile.maritalStatus}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2 backdrop-blur-sm border border-white/5">
                <GraduationCap className="h-3 w-3 text-secondary" />
                <span className="text-[10px] font-bold truncate">{profile.education}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2 backdrop-blur-sm border border-white/5">
                <Briefcase className="h-3 w-3 text-secondary" />
                <span className="text-[10px] font-bold truncate">{profile.occupation}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}