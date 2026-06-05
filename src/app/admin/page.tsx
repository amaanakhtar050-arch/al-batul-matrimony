
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
  Unlock,
  Lock,
  CreditCard,
  UserCheck,
  ShieldCheck,
  Eye,
  FileText,
  UserCircle,
  XCircle,
  MoreVertical,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { 
  collection, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  deleteDoc,
  setDoc 
} from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const PLANS_LIST = ["Free", "Basic", "Silver", "Gold", "Premium"];

export default function AdminDashboard() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

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

  const { data: payments } = useCollection(paymentsQuery);
  const { data: allUsers } = useCollection(allUsersQuery);
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
    });
  };

  const handleRejectPayment = (paymentId: string) => {
    if (!db) return;
    const paymentRef = doc(db, "payments", paymentId);
    updateDoc(paymentRef, {
      status: "rejected",
      processedAt: serverTimestamp(),
    }).then(() => {
      toast({ title: "Payment Rejected", variant: "destructive" });
    });
  };

  const handleUpdateUserStatus = (userId: string, updates: any) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    updateDoc(userRef, updates).then(() => {
      toast({ title: "Updated successfully" });
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
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (!db || !confirm("Delete this user permanently? This action cannot be undone.")) return;
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
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                placeholder="Search by name or city..." 
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
              <UserCheck className="h-4 w-4" /> Verifications
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
                  {payments?.map((payment: any) => (
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
                             <Button size="sm" className="bg-green-600 h-8" onClick={() => handleApprovePayment(payment.id, payment.userId, payment.plan)}>
                               Approve
                             </Button>
                             <Button size="sm" variant="ghost" className="text-destructive h-8" onClick={() => handleRejectPayment(payment.id)}>
                               Reject
                             </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!payments?.length && (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No pending payments.</TableCell></TableRow>
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
                  {allUsers?.filter(u => u.status === 'pending').map((user: any) => (
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
                                <Image src={user.idPhotoUrl || "https://picsum.photos/seed/id/800/600"} alt="ID" width={800} height={600} className="rounded-lg object-contain" />
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8">Selfie</Button></DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Verification Selfie Preview - {user.fullName}</DialogTitle>
                                </DialogHeader>
                                <Image src={user.selfiePhotoUrl || "https://picsum.photos/seed/selfie/600/600"} alt="Selfie" width={600} height={600} className="rounded-lg object-contain" />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{user.city}, {user.country}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" className="bg-green-600 h-8" onClick={() => handleUpdateUserStatus(user.id, { status: 'approved' })}>Approve</Button>
                          <Button size="sm" variant="outline" className="text-destructive h-8" onClick={() => handleUpdateUserStatus(user.id, { status: 'rejected' })}>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
                    <TableHead className="text-right">Administrative Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user: any) => (
                    <TableRow key={user.id} className={user.isBanned ? "bg-red-50/30" : ""}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{user.fullName}</span>
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
                          {user.isSuspended && <Badge variant="outline" className="text-orange-600 text-[9px] h-4">Suspended</Badge>}
                          {user.isBanned && <Badge variant="destructive" className="text-[9px] h-4">Banned</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            size="icon" variant="ghost" className="h-8 w-8" 
                            onClick={() => handleUpdateUserStatus(user.id, { isSuspended: !user.isSuspended })}
                          >
                            {user.isSuspended ? <Unlock className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-orange-600" />}
                          </Button>
                          <Button 
                            size="icon" variant="ghost" className="h-8 w-8"
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
                    <Label className="text-sm">Maintenance Mode</Label>
                    <Switch checked={settings?.maintenanceMode || false} onCheckedChange={(val) => handleUpdateSettings({ maintenanceMode: val })} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="text-lg">Payment Info</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">UPI ID for Members</Label>
                    <Input defaultValue={settings?.upiId} className="h-10" onBlur={(e) => handleUpdateSettings({ upiId: e.target.value })} />
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
