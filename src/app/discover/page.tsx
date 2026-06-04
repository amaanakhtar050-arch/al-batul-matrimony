
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, Search } from "lucide-react";
import { useState } from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const MOCK_PROFILES = [
  {
    id: "1",
    name: "Ayesha K.",
    age: 24,
    sect: "Sunni",
    city: "Dubai, UAE",
    education: "MBA in Finance",
    occupation: "Financial Analyst",
    imageUrl: PlaceHolderImages.find(img => img.id === 'profile-1')?.imageUrl || "",
    imageHint: "Muslim woman professional",
    isVerified: true
  },
  {
    id: "2",
    name: "Omar R.",
    age: 29,
    sect: "Sunni",
    city: "London, UK",
    education: "MSc in Computer Science",
    occupation: "Software Engineer",
    imageUrl: PlaceHolderImages.find(img => img.id === 'profile-2')?.imageUrl || "",
    imageHint: "Muslim man business",
    isVerified: true
  },
  {
    id: "3",
    name: "Fatima S.",
    age: 26,
    sect: "Shia",
    city: "Karachi, Pakistan",
    education: "Medical Degree",
    occupation: "Resident Physician",
    imageUrl: PlaceHolderImages.find(img => img.id === 'profile-3')?.imageUrl || "",
    imageHint: "Muslim woman smiling",
    isVerified: false
  },
  {
    id: "4",
    name: "Zaid M.",
    age: 31,
    sect: "Sunni",
    city: "New York, USA",
    education: "Bachelor in Architecture",
    occupation: "Architect",
    imageUrl: PlaceHolderImages.find(img => img.id === 'profile-4')?.imageUrl || "",
    imageHint: "Muslim man park",
    isVerified: true
  },
  {
    id: "5",
    name: "Sara L.",
    age: 25,
    sect: "Sunni",
    city: "Toronto, Canada",
    education: "BSc in Nursing",
    occupation: "Registered Nurse",
    imageUrl: PlaceHolderImages.find(img => img.id === 'profile-6')?.imageUrl || "",
    imageHint: "Modern hijab woman",
    isVerified: true
  },
  {
    id: "6",
    name: "Bilal H.",
    age: 28,
    sect: "Shia",
    city: "Beirut, Lebanon",
    education: "Law Degree",
    occupation: "Legal Consultant",
    imageUrl: PlaceHolderImages.find(img => img.id === 'profile-5')?.imageUrl || "",
    imageHint: "Professional man",
    isVerified: false
  }
];

export default function DiscoverPage() {
  const [ageRange, setAgeRange] = useState([20, 40]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <header className="mb-10">
          <h1 className="mb-2 text-3xl font-bold">Discover Matches</h1>
          <p className="text-muted-foreground">Find your potential life partner within our verified community.</p>
        </header>

        {/* Search and Filters */}
        <div className="mb-12 grid gap-6 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, city, or education..." className="pl-10" />
            </div>
          </div>
          
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Sect</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All Sects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunni">Sunni</SelectItem>
                <SelectItem value="shia">Shia</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Age Range ({ageRange[0]} - {ageRange[1]})</label>
            <Slider 
              min={18} 
              max={60} 
              step={1} 
              value={ageRange} 
              onValueChange={setAgeRange} 
              className="py-4"
            />
          </div>
          
          <div className="flex items-end">
            <Button className="w-full gap-2">
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Profile Grid */}
        <div className="masonry-grid gap-6">
          {MOCK_PROFILES.map((profile, idx) => (
            <ProfileCard key={profile.id} profile={profile} tall={idx % 2 === 0} />
          ))}
        </div>
      </main>
    </div>
  );
}
