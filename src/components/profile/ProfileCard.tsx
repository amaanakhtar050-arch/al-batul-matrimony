
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
  tall?: boolean;
}

export function ProfileCard({ profile, tall = false }: ProfileCardProps) {
  return (
    <Link href={`/profiles/${profile.id}`}>
      <Card className={`group relative overflow-hidden transition-all hover:shadow-xl ${tall ? 'masonry-item-tall' : 'masonry-item'} border-none bg-transparent h-[420px]`}>
        <div className="relative h-full w-full bg-muted">
          {profile.imageUrl ? (
            <Image
              src={profile.imageUrl}
              alt={profile.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              data-ai-hint={profile.imageHint}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
              <User className="h-24 w-24" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-xl font-bold font-headline truncate">{profile.name}, {profile.age}</h3>
              {profile.isVerified && (
                <Badge variant="secondary" className="bg-green-600 text-white border-none h-5 px-1.5 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span className="text-[10px]">Verified</span>
                </Badge>
              )}
            </div>
            
            <div className="space-y-1.5 text-[11px] opacity-90">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-secondary shrink-0" />
                <span className="truncate">{profile.city} • {profile.sect}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-secondary shrink-0" />
                <span>{profile.maritalStatus}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-3 w-3 text-secondary shrink-0" />
                <span className="truncate">{profile.education}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-3 w-3 text-secondary shrink-0" />
                <span className="truncate">{profile.occupation}</span>
              </div>
            </div>
          </div>
          
          <div className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white backdrop-blur-md transition-colors hover:bg-secondary">
            <Heart className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
