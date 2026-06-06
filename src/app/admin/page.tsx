
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Unlock,
  Lock,
  CreditCard,
  UserCheck,
  MoreVertical,
  ShieldCheck,
  XCircle,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

const PLANS_LIST = ["Free", "Basic", "Silver", "Gold", "Premium"];

// BOOTSTRAP ADMINS: These emails are guaranteed admin access
const SUPER_ADMIN_EMAILS = [
  "amaanakhtar050@gmail.com",
  "admin@albatul.com"
];

export default function AdminDashboard() {
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);

  // SECURITY GUARD & SELF-HEALING ROLE SYSTEM
  useEffect(() => {
    if (!authLoading && !profileLoading && user && db) {
      const userEmail = user.email?.toLowerCase() || "";
      const currentRole = profile?.role?.toLowerCase();
      
      console.log('[Admin Guard] User:', userEmail);
      console.log('[Admin Guard] Current Role:', currentRole);

      const isSuperAdmin = SUPER_ADMIN_EMAILS.some(email => userEmail.includes(email.split('@')[0]));
      const isActuallyAdmin = currentRole === "admin" || isSuperAdmin;

      if (!isActuallyAdmin) {
        console.warn('[Admin Guard] Access Denied. Redirecting...');
        router.replace("/dashboard");
      } else {
        console.log('[Admin Guard] Access Granted.');
        
        // SELF-HEALING: If user is a super admin but Firestore role is wrong, fix it now
        if (isSuperAdmin && currentRole !== "admin" && userProfileRef) {
          console.log('[Admin Guard] Self-healing role to admin...');
          updateDoc(userProfileRef, { 
            role: "admin", 
            status: "approved",
            updatedAt: serverTimestamp() 
          }).then(() => {
            toast({ title: "Admin Access Initialized", description: "Your account role has been updated to Administrator." });
          });
        }
      }
    }
  }, [user, profile, authLoading, profileLoading, router, db, userProfileRef, toast]);

  const paymentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "payments"), orderBy("createdAt", "desc"));
  }, [db]);

  const allUsersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users"), orderBy("createdAt", "desc"));
  }, [db]);

  const platformSettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "platform");
  }, [db]);

  const { data: payments, loading: loadingPayments } = useCollection(paymentsQuery);
  const { data: allUsers, loading: loadingUsers } = useCollection(allUsersQuery);
  const { data: settings } = useDoc(platformSettingsRef);

  const handleApprovePayment = (paymentId: string, userId: string, plan: string) => {
    if (!db) return;
    const paymentRef = doc(db, "payments", paymentId);
    const userRef = doc(db, "users", userId);

    updateDoc(paymentRef, {
      status: "approved",
      processedAt: serverTimestamp(),
    }).catch(e => errorEmitter.emit("permission-error", new FirestorePermissionError({ path: paymentRef.path, operation: "update" })));

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    updateDoc(userRef, {
      "membership.plan": plan,
      "membership.expiresAt": expiryDate.toISOString(),
    }).then(() => {
      toast({ title: "Payment Approved", description: `${plan} membership activated.` });
      
      addDoc(collection(db, 'users', userId, 'notifications'), {
        type: 'membership_upgraded',
        title: '💳 Membership Plan Activated',
        message: `Your ${plan} membership payment has been approved. Enjoy your new benefits and increased visibility!`,
        senderId: 'admin',
        receiverId: userId,
        read: false,
        createdAt: serverTimestamp()
      });
    });
  };

  const handleRejectPayment = (paymentId: string, userId: string) => {
    if (!db) return;
    const paymentRef = doc(db, "payments", paymentId);
    updateDoc(paymentRef, {
      status: "rejected",
      processedAt: serverTimestamp(),
    }).then(() => {
      toast({ title: "Payment Rejected", variant: "destructive" });

      addDoc(collection(db, 'users', userId, 'notifications'), {
        type: 'membership_rejected',
        title: '❌ Payment Verification Failed',
        message: `Your membership payment was rejected. Please verify your transaction details and resubmit proof of payment.`,
        senderId: 'admin',
        receiverId: userId,
        read: false,
        createdAt: serverTimestamp()
      });
    });
  };

  const handleUpdateUserStatus = (userId: string, updates: any) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    updateDoc(userRef, updates).then(() => {
      toast({ title: "Updated successfully" });

      if (updates.status) {
        addDoc(collection(db, 'users', userId, 'notifications'), {
          type: updates.status === 'approved' ? 'verification_approved' : 'verification_rejected',
          title: updates.status === 'approved' ? '✅ Profile Verification Successful' : '❌ Profile Verification Rejected',
          message: updates.status === 'approved' 
            ? 'Congratulations! Your profile has been verified and is now visible to other members.' 
            : 'Your profile verification was rejected. Please ensure your documents are clear.',
          senderId: 'admin',
          receiverId: userId,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    }).catch(e => errorEmitter.emit("permission-error", new FirestorePermissionError({ path: userRef.path, operation: "update" })));
  };

  const handleUpdateMembership = (userId: string, plan: string) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    updateDoc(userRef, {
      "membership.plan": plan,
      "membership.expiresAt": expiryDate.toISOString(),
    }).then(() => {
      toast({ title: "Membership Updated", description: `User is now on ${plan} plan.` });
      
      addDoc(collection(db, 'users', userId, 'notifications'), {
        type: 'membership_upgraded',
        title: '⭐ Membership Manually Updated',
        message: `Your account has been upgraded to the ${plan} plan by an administrator.`,
        senderId: 'admin',
        receiverId: userId,
        read: false,
        createdAt: serverTimestamp()
      });
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (!db || !confirm("Delete this user permanently?")) return;
    const userRef = doc(db, "users", userId);
    deleteDoc(userRef).then(() => {
      toast({ title: "User Deleted", variant: "destructive" });
    }).catch(e => errorEmitter.emit("permission-error", new FirestorePermissionError({ path: userRef.path, operation: "delete" })));
  };

  const handleUpdateSettings = (updates: any) => {
    if (!db) return;
    const settingsRef = doc(db, "settings", "platform");
    setDoc(settingsRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true }).then(() => {
      toast({ title: "Settings Saved" });
    });
  };

  const filteredUsers = allUsers?.filter(u => 
    (u.fullName || u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.city || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingVerifications = allUsers?.filter(u => u.status === 'pending' && u.isProfileComplete);

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Double check role or email for final render
  const userEmail = user?.email?.toLowerCase() || "";
  const isSuperAdmin = SUPER_ADMIN_EMAILS.some(email => userEmail.includes(email.split('@')[0]));
  const isActuallyAdmin = profile?.role?.toLowerCase() === "admin" || isSuperAdmin;

  if (!user || !isActuallyAdmin) {
    return (
       <div className="flex flex-col h-screen items-center justify-center p-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Unauthorized</h2>
          <p className="text-muted-foreground mb-6">You do not have administrative privileges to access this page.</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Administration</h1>
            <p className="text-muted-foreground text-sm">Manage members, verify payments, and control system settings.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search members..." 
                className="w-64 pl-10 h-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="mb-6 h-auto p-1 bg-muted/50">
            <TabsTrigger value="payments" className="gap-2 px-4 py-2">
              <CreditCard className="h-4 w-4" /> Payments
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2 px-4 py-2">
              <UserCheck className="h-4 w-4" /> Verifications {pendingVerifications?.length > 0 && <Badge className="ml-1 h-5 bg-primary">{pendingVerifications.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 px-4 py-2">
              <Users className="h-4 w-4" /> All Members
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 px-4 py-2">
              <Settings className="h-4 w-4" /> System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card className="border-none shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Requested Plan</TableHead>
                    <TableHead>UTR / Trans ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPayments ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20">Loading payments...</TableCell></TableRow>
                  ) : payments?.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-semibold text-sm">{payment.userName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{payment.plan}</Badge></TableCell>
                      <TableCell className="font-mono text-[11px]">{payment.transactionId}</TableCell>
                      <TableCell className="text-sm font-bold">₹{payment.amount}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'approved' ? 'default' : payment.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                             <Button size="sm" className="bg-green-600 h-8 hover:bg-green-700" onClick={() => handleApprovePayment(payment.id, payment.userId, payment.plan)}>
                               Approve
                             </Button>
                             <Button size="sm" variant="ghost" className="text-destructive h-8 hover:bg-destructive/10" onClick={() => handleRejectPayment(payment.id, payment.userId)}>
                               Reject
                             </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loadingPayments && !payments?.length && (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No pending payments found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="approvals">
            <Card className="border-none shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Identity Docs</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingVerifications?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-semibold text-sm">{user.fullName}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8">ID Scan</Button></DialogTrigger>
                            <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>ID Document Preview - {user.fullName}</DialogTitle>
                                </DialogHeader>
                                <div className="relative aspect-video w-full mt-4 overflow-hidden rounded-lg">
                                  <Image src={user.idPhotoUrl || "https://picsum.photos/seed/id/800/600"} alt="ID" fill className="object-contain" />
                                </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8">Selfie</Button></DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Verification Selfie Preview - {user.fullName}</DialogTitle>
                                </DialogHeader>
                                <div className="relative aspect-square w-full mt-4 overflow-hidden rounded-lg">
                                  <Image src={user.selfiePhotoUrl || "https://picsum.photos/seed/selfie/600/600"} alt="Selfie" fill className="object-contain" />
                                </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{user.city}, {user.country}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" className="bg-green-600 h-8 hover:bg-green-700" onClick={() => handleUpdateUserStatus(user.id, { status: 'approved' })}>Approve</Button>
                          <Button size="sm" variant="outline" className="text-destructive h-8 hover:bg-destructive/10" onClick={() => handleUpdateUserStatus(user.id, { status: 'rejected' })}>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!pendingVerifications?.length && (
                    <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground">No pending profile verifications.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-none shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Current Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user: any) => (
                    <TableRow key={user.id} className={user.isBanned ? "bg-red-50/30" : ""}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{user.fullName || user.email || "Unnamed Member"}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{user.id.slice(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-2">
                              {user.membership?.plan || 'Free'} <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {PLANS_LIST.map(p => (
                              <DropdownMenuItem key={p} onClick={() => handleUpdateMembership(user.id, p)}>
                                Set to {p}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={user.status === 'approved' ? 'default' : 'secondary'} className="text-[9px] h-4">
                            {user.status}
                          </Badge>
                          <Badge variant="outline" className={cn("text-[9px] h-4", user.role === 'admin' ? "text-primary border-primary" : "text-muted-foreground")}>
                            {user.role || 'user'}
                          </Badge>
                          {user.isSuspended && <Badge variant="outline" className="text-orange-600 border-orange-200 text-[9px] h-4">Suspended</Badge>}
                          {user.isBanned && <Badge variant="destructive" className="text-[9px] h-4">Banned</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            size="icon" variant="ghost" className="h-8 w-8" 
                            title={user.isSuspended ? "Unlock" : "Suspend"}
                            onClick={() => handleUpdateUserStatus(user.id, { isSuspended: !user.isSuspended })}
                          >
                            {user.isSuspended ? <Unlock className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-orange-600" />}
                          </Button>
                          <Button 
                            size="icon" variant="ghost" className="h-8 w-8"
                            title={user.isBanned ? "Unban" : "Ban"}
                            onClick={() => handleUpdateUserStatus(user.id, { isBanned: !user.isBanned })}
                          >
                            <Ban className={`h-4 w-4 ${user.isBanned ? "text-primary" : "text-destructive"}`} />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loadingUsers && !filteredUsers?.length && (
                    <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground">No members found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="text-lg">System Controls</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Maintenance Mode</Label>
                      <p className="text-[10px] text-muted-foreground">Disable all public interaction.</p>
                    </div>
                    <Switch checked={settings?.maintenanceMode || false} onCheckedChange={(val) => handleUpdateSettings({ maintenanceMode: val })} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="text-lg">Payment Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Active UPI ID for Payments</Label>
                    <Input defaultValue={settings?.upiId} className="h-10" onBlur={(e) => handleUpdateSettings({ upiId: e.target.value })} />
                    <p className="text-[10px] text-muted-foreground">Members will see this ID during membership upgrade.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
