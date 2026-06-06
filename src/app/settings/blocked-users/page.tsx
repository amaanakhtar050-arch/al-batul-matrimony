'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ShieldX, 
  Search, 
  User, 
  Loader2, 
  Trash2, 
  ArrowLeft,
  ShieldCheck,
  Clock
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, deleteDoc, doc, getDoc, orderBy } from "firebase/firestore";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * A specialized row component to handle fetching blocked user profile details.
 */
function BlockedUserRow({ block, onUnblock }: { block: any, onUnblock: (id: string) => void }) {
  const db = useFirestore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!db || !block.blockedId) return;
      try {
        const snap = await getDoc(doc(db, 'users', block.blockedId));
        if (snap.exists()) {
          setProfile(snap.data());
        }
      } catch (err) {
        console.error("Error fetching blocked profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [db, block.blockedId]);

  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="h-16 text-center opacity-30">
          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
        </TableCell>
      </TableRow>
    );
  }

  const blockDate = block.createdAt?.toDate ? format(block.createdAt.toDate(), "MMM dd, yyyy") : "Recent";

  return (
    <TableRow className="group hover:bg-muted/50 transition-colors">
      <TableCell>
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-muted shadow-sm border-2 border-white">
            {profile?.photoUrl ? (
              <Image src={profile.photoUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/30"><User className="h-6 w-6" /></div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-primary truncate max-w-[150px]">{profile?.fullName || "Member"}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{profile?.sect || "Community"}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-medium text-muted-foreground">{profile?.age || "--"} yrs</TableCell>
      <TableCell>
         <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
           <Clock className="h-3.5 w-3.5" />
           {blockDate}
         </div>
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl text-destructive hover:bg-destructive/5 font-bold gap-2">
              <ShieldCheck className="h-4 w-4" /> Unblock
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[2rem] p-8 max-w-sm">
            <AlertDialogHeader className="space-y-4">
              <div className="h-16 w-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <AlertDialogTitle className="text-2xl font-headline text-center">Unblock User?</AlertDialogTitle>
              <AlertDialogDescription className="text-center text-muted-foreground font-medium leading-relaxed">
                Are you sure you want to unblock <strong>{profile?.fullName || "this user"}</strong>? They will be able to view your profile and search for you again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 flex flex-col gap-3">
              <AlertDialogCancel className="w-full h-12 rounded-xl border-2 font-bold m-0">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onUnblock(block.id)}
                className="w-full h-12 rounded-xl bg-primary text-white font-bold m-0"
              >
                Confirm Unblock
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

export default function BlockedUsersPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const blocksQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "blocks"),
      where("blockerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: blocks, loading: loadingBlocks } = useCollection(blocksQuery);

  const handleUnblock = async (blockId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "blocks", blockId));
      toast({ title: "User Unblocked", description: "Interaction privileges have been restored." });
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not unblock user. Please try again." });
    }
  };

  if (authLoading || loadingBlocks) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-12 lg:px-8 max-w-5xl">
        <header className="mb-10">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">Privacy Settings</h1>
              <p className="text-muted-foreground font-medium">Manage the list of members you have restricted.</p>
            </div>
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search blocked list..." 
                className="h-12 pl-12 rounded-xl bg-white border-none shadow-sm focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-10 pb-6 border-b border-muted/50 bg-muted/5">
             <CardTitle className="text-2xl font-headline text-primary flex items-center gap-3">
               <ShieldX className="h-6 w-6 text-destructive" /> Restricted Members
             </CardTitle>
             <CardDescription className="text-muted-foreground">Blocked members cannot find your profile or contact you.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="px-10 h-14 font-bold uppercase tracking-widest text-[10px]">Member Profile</TableHead>
                    <TableHead className="h-14 font-bold uppercase tracking-widest text-[10px]">Age</TableHead>
                    <TableHead className="h-14 font-bold uppercase tracking-widest text-[10px]">Blocked On</TableHead>
                    <TableHead className="px-10 h-14 text-right font-bold uppercase tracking-widest text-[10px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.length > 0 ? (
                    blocks.map((block: any) => (
                      <BlockedUserRow key={block.id} block={block} onUnblock={handleUnblock} />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-32 text-center">
                        <div className="h-20 w-20 bg-muted/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                           <ShieldX className="h-10 w-10 text-muted-foreground/20" />
                        </div>
                        <p className="text-xl font-headline font-bold text-primary opacity-40">Privacy record is clean.</p>
                        <p className="text-sm text-muted-foreground mt-1">You haven't blocked any users yet.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <section className="mt-12 p-8 bg-primary/5 rounded-[2rem] border border-primary/10 flex flex-col md:flex-row items-center gap-8 animate-fade-in">
           <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary" />
           </div>
           <div className="flex-1 text-center md:text-left space-y-1">
              <p className="font-bold text-primary">Need more privacy?</p>
              <p className="text-sm text-muted-foreground">You can also report profiles for community standard violations directly from their profile page.</p>
           </div>
           <Link href="/support">
              <Button variant="outline" className="rounded-xl font-bold h-12 border-primary/20">Contact Support</Button>
           </Link>
        </section>
      </main>
    </div>
  );
}
