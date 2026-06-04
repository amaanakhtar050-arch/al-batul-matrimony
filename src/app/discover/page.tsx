
'use client';

import { Navbar } from "@/components/layout/Navbar";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export default function DiscoverPage() {
  const [ageRange, setAgeRange] = useState([20, 60]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectFilter, setSectFilter] = useState("all");
  
  const db = useFirestore();

  const approvedUsersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'users'),
      where('status', '==', 'approved')
    );
  }, [db]);

  const { data: profiles, loading } = useCollection(approvedUsersQuery);

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter(p => {
      const matchesAge = p.age >= ageRange[0] && p.age <= ageRange[1];
      const matchesSect = sectFilter === "all" || p.sect.toLowerCase() === sectFilter.toLowerCase();
      const matchesSearch = !searchTerm || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.occupation.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesAge && matchesSect && matchesSearch;
    });
  }, [profiles, ageRange, sectFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <header className="mb-10">
          <h1 className="mb-2 text-3xl font-bold font-headline">Discover Matches</h1>
          <p className="text-muted-foreground">Find your potential life partner within our verified community.</p>
        </header>

        {/* Search and Filters */}
        <div className="mb-12 grid gap-6 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by name, city, or education..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Sect</label>
            <Select onValueChange={setSectFilter} defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="All Sects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sects</SelectItem>
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
              max={80} 
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
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
        ) : filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProfiles.map((profile: any, idx) => (
              <ProfileCard 
                key={profile.id} 
                profile={{
                  ...profile,
                  imageUrl: profile.photoUrl || `https://picsum.photos/seed/${profile.id}/600/800`,
                  imageHint: "Muslim professional"
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-xl font-medium text-muted-foreground">No approved profiles found matching your filters.</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search criteria or check back later.</p>
          </div>
        )}
      </main>
    </div>
  );
}
