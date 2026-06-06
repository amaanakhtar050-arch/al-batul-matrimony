'use client';

import { Navbar } from "@/components/layout/Navbar";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, Search, Lock, ShieldCheck, X, UserSearch, Loader2, MapPin, Briefcase, GraduationCap, Hash } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, limit } from "firebase/firestore";
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
  const [stateFilter, setStateFilter] = useState("");
  const [professionFilter, setProfessionFilter] = useState("");
  const [educationFilter, setEducationFilter] = useState("");
  const [memberIdFilter, setMemberIdFilter] = useState("");
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

  const approvedUsersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'users'),
      where('status', '==', 'approved'),
      limit(100)
    );
  }, [db]);

  const { data: profiles, loading: profilesLoading } = useCollection(approvedUsersQuery);

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter(p => {
      if (p.id === user?.uid || p.isSuspended || p.isBanned) return false;

      const matchesAge = p.age >= ageRange[0] && p.age <= ageRange[1];
      const matchesSect = sectFilter === "all" || p.sect?.toLowerCase() === sectFilter.toLowerCase();
      const matchesMarital = maritalStatusFilter === "all" || p.maritalStatus?.toLowerCase() === maritalStatusFilter.toLowerCase();
      
      const cityMatch = !cityFilter || p.city?.toLowerCase().includes(cityFilter.toLowerCase());
      const stateMatch = !stateFilter || p.state?.toLowerCase().includes(stateFilter.toLowerCase());
      const professionMatch = !professionFilter || p.occupation?.toLowerCase().includes(professionFilter.toLowerCase());
      const educationMatch = !educationFilter || p.education?.toLowerCase().includes(educationFilter.toLowerCase());
      const memberIdMatch = !memberIdFilter || p.id?.toLowerCase().includes(memberIdFilter.toLowerCase());
      
      const matchesSearch = !searchTerm || 
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.education?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesAge && matchesSect && matchesMarital && cityMatch && stateMatch && professionMatch && educationMatch && memberIdMatch && matchesSearch;
    });
  }, [profiles, ageRange, sectFilter, maritalStatusFilter, cityFilter, stateFilter, professionFilter, educationFilter, memberIdFilter, searchTerm, user]);

  const resetFilters = () => {
    setAgeRange([18, 60]);
    setSearchTerm("");
    setSectFilter("all");
    setMaritalStatusFilter("all");
    setCityFilter("");
    setStateFilter("");
    setProfessionFilter("");
    setEducationFilter("");
    setMemberIdFilter("");
  };

  const activeFilterCount = [
    sectFilter !== "all",
    maritalStatusFilter !== "all",
    cityFilter !== "",
    stateFilter !== "",
    professionFilter !== "",
    educationFilter !== "",
    memberIdFilter !== "",
    searchTerm !== "",
    ageRange[0] !== 18 || ageRange[1] !== 60
  ].filter(Boolean).length;

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';
  if (!profile || (profile.status !== 'approved' && !isAdmin)) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />
        <main className="container mx-auto flex items-center justify-center px-4 py-20">
           <div className="text-center max-w-md w-full">
             <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/50 text-primary">
                <Lock className="h-10 w-10" />
             </div>
             <h1 className="text-2xl md:text-3xl font-bold mb-4 font-headline text-primary">Access Restricted</h1>
             <p className="text-muted-foreground mb-8 px-4">
               {!profile 
                 ? "You must complete your profile before you can discover potential matches." 
                 : profile.status === 'rejected' 
                   ? "Your verification was not approved. Please review your profile details and resubmit."
                   : "Your profile is currently under review by our admin team."}
             </p>
             {!profile ? (
                <Link href="/setup-profile" className="px-4 block">
                  <Button size="lg" className="w-full h-12 font-bold shadow-lg">Complete Profile Now</Button>
                </Link>
             ) : (
                <div className="flex flex-col gap-4 px-4">
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
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl">
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary tracking-tight">Search Members</h1>
              <p className="text-muted-foreground mt-1 font-medium text-sm md:text-base">Find your life partner among verified profiles.</p>
            </div>
            <Button 
              variant={isFilterVisible ? "secondary" : "outline"}
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className="gap-2 font-bold h-12 rounded-2xl shadow-sm self-start md:self-center w-full md:w-auto"
            >
              <Filter className="h-5 w-5" />
              Advanced Filters {activeFilterCount > 0 && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-white text-[10px]">{activeFilterCount}</Badge>}
            </Button>
          </div>

          <div className="relative group">
            <Search className="absolute left-5 top-1/2 h-5 w-5 md:h-6 md:w-6 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by name, ID, or profession..." 
              className="h-14 md:h-16 pl-12 md:pl-14 pr-6 text-base md:text-lg rounded-[1.5rem] md:rounded-[2rem] border-none shadow-2xl bg-white focus-visible:ring-2 focus-visible:ring-primary/20 transition-all w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {isFilterVisible && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="rounded-2xl md:rounded-[2.5rem] bg-white p-6 md:p-8 shadow-2xl border-none relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20"></div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl md:text-2xl font-bold font-headline flex items-center gap-2 text-primary">
                   <UserSearch className="h-6 w-6" /> Detailed Filters
                </h3>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-destructive font-bold">
                  <X className="h-4 w-4 mr-1" /> Reset
                </Button>
              </div>

              <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> City
                  </label>
                  <Input placeholder="Search city..." className="h-11 rounded-xl bg-muted/30 border-none focus-visible:bg-white transition-all" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> State
                  </label>
                  <Input placeholder="Search state..." className="h-11 rounded-xl bg-muted/30 border-none focus-visible:bg-white transition-all" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                    <Briefcase className="h-3 w-3" /> Profession
                  </label>
                  <Input placeholder="Doctor, Engineer..." className="h-11 rounded-xl bg-muted/30 border-none focus-visible:bg-white transition-all" value={professionFilter} onChange={(e) => setProfessionFilter(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                    <GraduationCap className="h-3 w-3" /> Education
                  </label>
                  <Input placeholder="Degree, Major..." className="h-11 rounded-xl bg-muted/30 border-none focus-visible:bg-white transition-all" value={educationFilter} onChange={(e) => setEducationFilter(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                    <Hash className="h-3 w-3" /> Member ID
                  </label>
                  <Input placeholder="ID prefix..." className="h-11 rounded-xl bg-muted/30 border-none focus-visible:bg-white transition-all" value={memberIdFilter} onChange={(e) => setMemberIdFilter(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Religious Sect</label>
                  <Select onValueChange={setSectFilter} value={sectFilter}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none focus-visible:bg-white transition-all"><SelectValue placeholder="All Sects" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sects</SelectItem>
                      {SECT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Marital Status</label>
                  <Select onValueChange={setMaritalStatusFilter} value={maritalStatusFilter}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none focus-visible:bg-white transition-all"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {MARITAL_STATUS_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-10 max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Age Range</label>
                  <span className="text-sm font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-full">{ageRange[0]} — {ageRange[1]} years</span>
                </div>
                <Slider min={18} max={80} step={1} value={ageRange} onValueChange={setAgeRange} className="py-4" />
              </div>
            </Card>
          </div>
        )}

        {profilesLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[400px] md:h-[480px] rounded-2xl md:rounded-[2.5rem] bg-muted animate-pulse" />
            ))}
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
                  isVerified: profile.status === 'approved',
                  lastActiveAt: profile.lastActiveAt
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center bg-white rounded-2xl md:rounded-[3rem] shadow-sm border border-border/40 px-4">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-muted/30 flex items-center justify-center mb-6 md:mb-8">
               <Search className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/20" />
            </div>
            <h3 className="text-xl md:text-2xl font-headline font-bold text-primary mb-2">No results found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mb-8 md:mb-10 font-medium text-sm md:text-base">Try broadening your filters or using different keywords to find more potential matches.</p>
            <Button variant="outline" className="font-bold h-12 px-8 rounded-2xl w-full sm:w-auto" onClick={resetFilters}>Clear All Filters</Button>
          </div>
        )}
      </main>
    </div>
  );
}