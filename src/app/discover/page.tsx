'use client';

import { Navbar } from "@/components/layout/Navbar";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, Search, Lock, ShieldCheck, X, ChevronDown, UserSearch } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const MARITAL_STATUS_OPTIONS = ["Single", "Divorced", "Widowed"];
const SECT_OPTIONS = ["Sunni", "Shia", "Other"];

export default function DiscoverPage() {
  const [ageRange, setAgeRange] = useState([18, 60]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectFilter, setSectFilter] = useState("all");
  const [maritalStatusFilter, setMaritalStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
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
      const matchesSect = sectFilter === "all" || p.sect?.toLowerCase() === sectFilter.toLowerCase();
      const matchesMarital = maritalStatusFilter === "all" || p.maritalStatus?.toLowerCase() === maritalStatusFilter.toLowerCase();
      const matchesCity = !cityFilter || p.city?.toLowerCase().includes(cityFilter.toLowerCase());
      const matchesSearch = !searchTerm || 
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.education?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesAge && matchesSect && matchesMarital && matchesCity && matchesSearch;
    });
  }, [profiles, ageRange, sectFilter, maritalStatusFilter, cityFilter, searchTerm, user]);

  const resetFilters = () => {
    setAgeRange([18, 60]);
    setSearchTerm("");
    setSectFilter("all");
    setMaritalStatusFilter("all");
    setCityFilter("");
  };

  const activeFilterCount = [
    sectFilter !== "all",
    maritalStatusFilter !== "all",
    cityFilter !== "",
    searchTerm !== "",
    ageRange[0] !== 18 || ageRange[1] !== 60
  ].filter(Boolean).length;

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  // ACCESS GATING: Pending or restricted profiles cannot search, unless they are admins
  const isAdmin = profile?.role === 'admin';
  if (!profile || (profile.status !== 'approved' && !isAdmin)) {
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
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold font-headline text-primary flex items-center gap-2">
              Discover Matches <ShieldCheck className="h-6 w-6 text-primary/40" />
            </h1>
            <p className="text-muted-foreground">Browse verified profiles looking for a life partner.</p>
            {isAdmin && <Badge className="mt-2 bg-primary text-white border-none font-bold">ADMIN TESTING MODE ACTIVE</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className="gap-2 font-bold h-11"
            >
              <Filter className="h-4 w-4" />
              Filters {activeFilterCount > 0 && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-white">{activeFilterCount}</Badge>}
            </Button>
          </div>
        </header>

        {isFilterVisible && (
          <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="rounded-3xl bg-white p-8 shadow-xl border border-border/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold font-headline flex items-center gap-2">
                   <UserSearch className="h-5 w-5 text-primary" /> Advanced Search Filters
                </h3>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-primary">
                  <X className="h-4 w-4 mr-2" /> Reset All
                </Button>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    Name / Keywords
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="e.g. Doctor, Software..." 
                      className="pl-10 h-11" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location (City)</label>
                  <Input 
                    placeholder="Enter city..." 
                    className="h-11" 
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sect</label>
                  <Select onValueChange={setSectFilter} value={sectFilter}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="All Sects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sects</SelectItem>
                      {SECT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Marital Status</label>
                  <Select onValueChange={setMaritalStatusFilter} value={maritalStatusFilter}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {MARITAL_STATUS_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-10 max-w-xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Age Range</label>
                  <span className="text-sm font-bold text-primary">{ageRange[0]} — {ageRange[1]} years</span>
                </div>
                <Slider 
                  min={18} 
                  max={80} 
                  step={1} 
                  value={ageRange} 
                  onValueChange={setAgeRange} 
                  className="py-4"
                />
              </div>

              <div className="mt-8 flex justify-center">
                <Button className="px-12 h-12 shadow-lg font-bold rounded-xl" onClick={() => setIsFilterVisible(false)}>
                  Show Results
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeFilterCount > 0 && (
          <div className="mb-8 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest mr-2">Active:</span>
            {searchTerm && <Badge variant="secondary" className="gap-1 h-7">Search: {searchTerm} <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} /></Badge>}
            {cityFilter && <Badge variant="secondary" className="gap-1 h-7">City: {cityFilter} <X className="h-3 w-3 cursor-pointer" onClick={() => setCityFilter("")} /></Badge>}
            {sectFilter !== "all" && <Badge variant="secondary" className="gap-1 h-7">Sect: {sectFilter} <X className="h-3 w-3 cursor-pointer" onClick={() => setSectFilter("all")} /></Badge>}
            {maritalStatusFilter !== "all" && <Badge variant="secondary" className="gap-1 h-7">Status: {maritalStatusFilter} <X className="h-3 w-3 cursor-pointer" onClick={() => setMaritalStatusFilter("all")} /></Badge>}
            {(ageRange[0] !== 18 || ageRange[1] !== 60) && <Badge variant="secondary" className="gap-1 h-7">Age: {ageRange[0]}-{ageRange[1]} <X className="h-3 w-3 cursor-pointer" onClick={() => setAgeRange([18, 60])} /></Badge>}
          </div>
        )}

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
                  maritalStatus: profile.maritalStatus || "Single",
                  imageUrl: profile.photoUrl || "",
                  imageHint: "Muslim professional",
                  isVerified: profile.status === 'approved'
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Search className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-xl font-medium text-muted-foreground">No matching approved profiles found.</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">Try adjusting your filters or search criteria to see more results.</p>
            <Button variant="outline" className="mt-8 font-bold" onClick={resetFilters}>Reset All Filters</Button>
          </div>
        )}
      </main>
    </div>
  );
}
