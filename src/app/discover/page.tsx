
'use client';

import { Navbar } from "@/components/layout/Navbar";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, Search, Lock, ShieldCheck } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DiscoverPage() {
  const [ageRange, setAgeRange] = useState([20, 60]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectFilter, setSectFilter] = useState("all");
  
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // STRICT FILTERING: Only approved profiles appear in search results
  const approvedUsersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'users'),
      where('status', '==', 'approved')
    );
  }, [db]);

  const { data: profiles, loading: profilesLoading } = useCollection(approvedUsersQuery);

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter(p => {
      // Exclude self and restricted accounts
      if (p.id === user?.uid || p.isSuspended || p.isBanned) return false;

      const matchesAge = p.age >= ageRange[0] && p.age <= ageRange[1];
      const matchesSect = sectFilter === "all" || p.sect.toLowerCase() === sectFilter.toLowerCase();
      const matchesSearch = !searchTerm || 
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.occupation?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesAge && matchesSect && matchesSearch;
    });
  }, [profiles, ageRange, sectFilter, searchTerm, user]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  // ACCESS GATING: Pending or restricted profiles cannot search
  if (!profile || profile.status !== 'approved') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex items-center justify-center px-4 py-20">
           <div className="text-center max-w-md">
             <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/50 text-primary">
                <Lock className="h-10 w-10" />
             </div>
             <h1 className="text-3xl font-bold mb-4 font-headline text-primary">Access Restricted</h1>
             <p className="text-muted-foreground mb-8">
               {!profile 
                 ? "You must complete your profile before you can discover potential matches." 
                 : profile.status === 'rejected' 
                   ? "Your verification was not approved. Please review your profile details and resubmit."
                   : "Your profile is currently under review by our admin team. Once approved, you'll gain full access to search and view matches."}
             </p>
             {!profile ? (
                <Link href="/setup-profile">
                  <Button size="lg" className="w-full h-12 font-bold shadow-lg">Complete Profile Now</Button>
                </Link>
             ) : (
                <div className="flex flex-col gap-4">
                  <Link href="/setup-profile">
                    <Button variant="outline" size="lg" className="w-full h-12">Edit Profile Details</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="lg" className="w-full h-12">Back to Dashboard</Button>
                  </Link>
                </div>
             )}
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <header className="mb-10">
          <h1 className="mb-2 text-3xl font-bold font-headline text-primary flex items-center gap-2">
            Discover Matches <ShieldCheck className="h-6 w-6 text-primary/40" />
          </h1>
          <p className="text-muted-foreground">Find potential life partners within our verified community.</p>
        </header>

        <div className="mb-12 grid gap-6 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-5 border border-border/50">
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
                <SelectItem value="Sunni">Sunni</SelectItem>
                <SelectItem value="Shia">Shia</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
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
            <Button className="w-full gap-2 h-11 shadow-sm">
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </div>

        {profilesLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
        ) : filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProfiles.map((profile: any) => (
              <ProfileCard 
                key={profile.id} 
                profile={{
                  id: profile.id,
                  name: profile.fullName || "User",
                  age: profile.age,
                  sect: profile.sect,
                  city: profile.city,
                  education: profile.education,
                  occupation: profile.occupation,
                  imageUrl: profile.photoUrl || `https://picsum.photos/seed/${profile.id}/600/800`,
                  imageHint: "Muslim professional",
                  isVerified: profile.status === 'approved'
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
            <p className="text-xl font-medium text-muted-foreground">No matching approved profiles found.</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}
