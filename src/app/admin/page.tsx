"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Search, 
  Settings, 
  Users, 
  Ban, 
  Trash2, 
  CreditCard,
  UserCheck,
  Loader2,
  Save,
  Globe,
  Lock,
  Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCollection, useFirestore, useMemoFirebase, useDoc, useUser } from "@/firebase";
import { 
  collection, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  deleteDoc,
  setDoc,
  addDoc 
} from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";

export default function AdminDashboard() {
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Platform Settings State
  const [upiId, setUpiId] = useState("");
  const [siteName, setSiteName] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);

  const platformSettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "platform");
  }, [db]);

  const { data: settings } = useDoc(platformSettingsRef);

  useEffect(() => {
    if (settings) {
      setUpiId(settings.upiId || "");
      setSiteName(settings.siteName || "Al Batul");
      setMaintenanceMode(settings.maintenanceMode || false);
    }
  }, [settings]);

  useEffect(() => {
    if (!authLoading && !profileLoading && user && db) {
      const userEmail = user.email?.toLowerCase() || "";
      const currentRole = profile?.role?.toLowerCase();
      const isSuperAdmin = SUPER_ADMIN_EMAILS.some(email => userEmail === email.toLowerCase());
      const isActuallyAdmin = currentRole === "admin" || isSuperAdmin;

      if (!isActuallyAdmin) {
        router.replace("/dashboard");
      }
    }
  }, [user, profile, authLoading, profileLoading, router, db]);

  const paymentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "payments"), orderBy("createdAt", "desc"));
  }, [db]);

  const allUsersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: payments } = useCollection(paymentsQuery);
  const { data: allUsers } = useCollection(allUsersQuery);

  const handleApprovePayment = (paymentId: string, userId: string, plan: string) => {
    if (!db) return;
    const paymentRef = doc(db, "payments", paymentId);
    const userRef = doc(db, "users", userId);

    updateDoc(paymentRef, { status: "approved", processedAt: serverTimestamp() });

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    updateDoc(userRef, { 
      "membership.plan": plan, 
      "membership.expiresAt": expiryDate.toISOString(),
      updatedAt: serverTimestamp()
    }).then(() => {
      toast({ title: "Payment Approved" });
      addDoc(collection(db, 'users', userId, 'notifications'), {
        type: 'membership_upgraded',
        title: '💳 Membership Activated',
        message: `Your ${plan} membership is now active!`,
        senderId: 'admin',
        receiverId: userId,
        read: false,
        createdAt: serverTimestamp()
      });
    });
  };

  const handleUpdateSettings = async () => {
    if (!db || !platformSettingsRef) return;
    setIsUpdatingSettings(true);
    const updates = {
      upiId,
      siteName,
      maintenanceMode,
      updatedAt: serverTimestamp()
    };

    setDoc(platformSettingsRef, updates, { merge: true })
      .then(() => {
        toast({ title: "Settings Updated" });
      })
      .catch(async (e) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: platformSettingsRef.path,
          operation: "write",
          requestResourceData: updates
        }));
      })
      .finally(() => setIsUpdatingSettings(false));
  };

  const filteredUsers = allUsers?.filter(u => 
    (u.fullName || u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingVerifications = allUsers?.filter(u => u.status === 'pending' && u.isProfileComplete);

  if (authLoading || profileLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const isActuallyAdmin = profile?.role?.toLowerCase() === "admin" || SUPER_ADMIN_EMAILS.some(e => user?.email?.toLowerCase() === e.toLowerCase());

  if (!user || !isActuallyAdmin) return <div className="flex h-screen items-center justify-center p-4 text-center">Unauthorized</div>;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl">
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">Administration</h1>
            <p className="text-muted-foreground text-sm font-medium">Platform control center.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search members..." 
                className="pl-9 h-11 rounded-xl bg-white border-none shadow-sm w-full" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
        </header>

        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="mb-8 p-1 bg-white/50 rounded-2xl border border-white/40 h-auto flex-wrap justify-start">
            <TabsTrigger value="payments" className="rounded-xl px-4 md:px-6 font-bold h-11 flex-1 md:flex-none">Payments</TabsTrigger>
            <TabsTrigger value="approvals" className="rounded-xl px-4 md:px-6 font-bold h-11 flex-1 md:flex-none">Verifications ({pendingVerifications?.length || 0})</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl px-4 md:px-6 font-bold h-11 flex-1 md:flex-none">Members</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl px-4 md:px-6 font-bold h-11 flex-1 md:flex-none">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card className="border-none shadow-sm rounded-2xl md:rounded-[2rem] overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>UTR</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-bold whitespace-nowrap">{payment.userName}</TableCell>
                        <TableCell><Badge variant="outline" className="bg-primary/5 border-none">{payment.plan}</Badge></TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{payment.transactionId}</TableCell>
                        <TableCell className="font-bold">₹{payment.amount}</TableCell>
                        <TableCell><Badge variant={payment.status === 'approved' ? 'default' : 'secondary'}>{payment.status.toUpperCase()}</Badge></TableCell>
                        <TableCell className="text-right">
                          {payment.status === 'pending' && (
                            <Button size="sm" className="bg-primary font-bold h-9 rounded-xl px-5" onClick={() => handleApprovePayment(payment.id, payment.userId, payment.plan)}>Approve</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
             <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border-none shadow-sm rounded-2xl md:rounded-[2.5rem] bg-white p-6 md:p-8">
                  <CardHeader className="p-0 mb-8">
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                      <Globe className="h-6 w-6 text-primary" /> Global Configuration
                    </CardTitle>
                    <CardDescription>Update platform-wide settings and payment details.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Site Display Name</Label>
                      <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Default UPI ID (for payments)</Label>
                      <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="example@upi" className="h-12 rounded-xl font-mono" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Maintenance Mode</Label>
                        <p className="text-xs text-muted-foreground">Restrict user access for maintenance.</p>
                      </div>
                      <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                    </div>
                    <Button onClick={handleUpdateSettings} disabled={isUpdatingSettings} className="w-full h-14 font-bold rounded-2xl gap-2 text-lg shadow-xl">
                      {isUpdatingSettings ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      Save Site Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl md:rounded-[2.5rem] bg-primary text-primary-foreground p-8 md:p-10 flex flex-col justify-center">
                   <Zap className="h-10 w-10 md:h-12 md:w-12 text-secondary mb-6" />
                   <h3 className="text-2xl md:text-3xl font-headline font-bold mb-4">Platform Stats</h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-white/20">
                         <span className="opacity-70 font-medium">Total Members</span>
                         <span className="text-xl md:text-2xl font-bold">{allUsers?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/20">
                         <span className="opacity-70 font-medium">Pending Payments</span>
                         <span className="text-xl md:text-2xl font-bold">{payments?.filter((p:any) => p.status === 'pending').length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="opacity-70 font-medium">Pending Approvals</span>
                         <span className="text-xl md:text-2xl font-bold">{pendingVerifications?.length || 0}</span>
                      </div>
                   </div>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="approvals">
            <Card className="border-none shadow-sm rounded-2xl md:rounded-[2rem] overflow-hidden bg-white">
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Docs</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingVerifications?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-bold text-lg whitespace-nowrap">{user.fullName}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-xl">Review ID Proof</Button></DialogTrigger>
                            <DialogContent className="max-w-[90vw] md:max-w-3xl rounded-2xl md:rounded-[3rem] p-4 md:p-8">
                               <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline">Verification Document</DialogTitle></DialogHeader>
                               <div className="relative aspect-video w-full mt-4 overflow-hidden rounded-xl">
                                 <Image src={user.idPhotoUrl || "https://picsum.photos/seed/id/800/600"} alt="ID" fill className="object-contain" />
                               </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" className="bg-green-600 font-bold h-9 rounded-xl" onClick={() => updateDoc(doc(db!, "users", user.id), { status: 'approved', updatedAt: serverTimestamp() })}>Approve</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
               </div>
            </Card>
          </TabsContent>

          <TabsContent value="users">
             <Card className="border-none shadow-sm rounded-2xl md:rounded-[2rem] overflow-hidden bg-white">
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-bold whitespace-nowrap">{user.fullName || user.email}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{user.membership?.plan || 'Free'}</Badge></TableCell>
                        <TableCell><Badge variant={user.status === 'approved' ? 'default' : 'secondary'}>{user.status.toUpperCase()}</Badge></TableCell>
                        <TableCell className="text-right">
                           <Button size="icon" variant="ghost" className="text-destructive h-10 w-10 rounded-xl hover:bg-destructive/10"><Ban className="h-5 w-5" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
               </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}