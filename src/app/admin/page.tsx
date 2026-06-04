
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  X, 
  Search, 
  Settings, 
  Users, 
  Ban, 
  Trash2, 
  Unlock,
  Lock,
  UserX,
  CreditCard,
  UserCheck,
  Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { format } from "date-fns";

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
    expiryDate.setMonth(expiryDate.getMonth() + 3);

    updateDoc(userRef, {
      "membership.plan": plan,
      "membership.expiresAt": expiryDate.toISOString(),
      status: "approved"
    }).then(() => {
      toast({ title: "Payment Approved", description: `${plan} membership activated for user.` });
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
      toast({ title: "Profile Updated" });
    }).catch(e => errorEmitter.emit("permission-error", new FirestorePermissionError({ path: userRef.path, operation: "update" })));
  };

  const handleDeleteUser = (userId: string) => {
    if (!db || !confirm("Are you sure you want to delete this user? This action is irreversible.")) return;
    const userRef = doc(db, "users", userId);
    deleteDoc(userRef).then(() => {
      toast({ title: "User Deleted", variant: "destructive" });
    });
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
    u.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Super-Admin Panel</h1>
            <p className="text-muted-foreground">Comprehensive platform management & auditing.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by name or city..." 
                className="w-64 pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6 h-auto p-1 bg-muted/50">
            <TabsTrigger value="users" className="gap-2 px-4 py-2">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2 px-4 py-2">
              <UserCheck className="h-4 w-4" /> Profile Verification
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2 px-4 py-2">
              <CreditCard className="h-4 w-4" /> Payment Queue
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 px-4 py-2">
              <Settings className="h-4 w-4" /> Platform Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-none shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Member Details</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead className="text-right">Management</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20">Loading members...</TableCell></TableRow>
                  ) : filteredUsers?.map((user: any) => (
                    <TableRow key={user.id} className={`${user.isBanned ? "bg-red-50/50" : user.isSuspended ? "bg-orange-50/50" : ""} transition-colors`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                            {user.fullName?.charAt(0) || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{user.fullName}</span>
                            <span className="text-xs text-muted-foreground">{user.city}, {user.country}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex gap-1.5">
                            <Badge variant={user.status === 'approved' ? 'default' : user.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
                              {user.status}
                            </Badge>
                            {user.role === 'admin' && <Badge className="text-[10px] h-5 bg-indigo-600">Admin</Badge>}
                          </div>
                          {user.isSuspended && <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-[10px] h-5 w-fit">Suspended</Badge>}
                          {user.isBanned && <Badge variant="destructive" className="text-[10px] h-5 w-fit">Banned</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge variant="outline" className="w-fit text-primary border-primary/20 bg-primary/5">{user.membership?.plan || 'Free'}</Badge>
                          {user.membership?.expiresAt && (
                            <span className="text-[10px] text-muted-foreground mt-1">Exp: {format(new Date(user.membership.expiresAt), 'MMM dd, yyyy')}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/profiles/${user.id}`}>
                            <Button size="icon" variant="ghost" title="View Profile">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button size="icon" variant="ghost" title={user.isSuspended ? "Unsuspend" : "Suspend"} onClick={() => handleUpdateUserStatus(user.id, { isSuspended: !user.isSuspended })}>
                            {user.isSuspended ? <Unlock className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-orange-600" />}
                          </Button>
                          <Button size="icon" variant="ghost" title={user.isBanned ? "Unban" : "Ban"} onClick={() => handleUpdateUserStatus(user.id, { isBanned: !user.isBanned })}>
                            <Ban className={`h-4 w-4 ${user.isBanned ? "text-primary" : "text-destructive"}`} />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
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

          <TabsContent value="approvals">
            <Card className="border-none shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>User Information</TableHead>
                    <TableHead>Demographics</TableHead>
                    <TableHead className="text-right">Verification Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers?.filter(u => u.status === 'pending').map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                         <div className="flex flex-col">
                            <span className="font-semibold">{user.fullName}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.age}Y • {user.gender} • {user.sect}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateUserStatus(user.id, { status: 'approved' })}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/5" onClick={() => handleUpdateUserStatus(user.id, { status: 'rejected' })}>
                            <UserX className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {allUsers?.filter(u => u.status === 'pending').length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center py-20 text-muted-foreground">No pending profile verifications.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-none shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Payer Name</TableHead>
                    <TableHead>Subscription Plan</TableHead>
                    <TableHead>UTR / Transaction ID</TableHead>
                    <TableHead>Submission Status</TableHead>
                    <TableHead className="text-right">Manual Verification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-semibold">{payment.userName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none">{payment.plan} (₹{payment.amount})</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs select-all bg-muted/50 p-2 rounded">{payment.transactionId}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'approved' ? 'default' : payment.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {payment.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                             <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprovePayment(payment.id, payment.userId, payment.plan)}>
                               Verify & Activate
                             </Button>
                             <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRejectPayment(payment.id)}>
                               Reject
                             </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Processed {payment.processedAt ? format(payment.processedAt.toDate(), 'MMM dd, HH:mm') : 'N/A'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments?.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No payment records found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Global Access Controls</CardTitle>
                  <CardDescription>Manage how users interact with the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-xs text-muted-foreground">Force users to a "Under Maintenance" screen.</p>
                    </div>
                    <Switch 
                      checked={settings?.maintenanceMode || false} 
                      onCheckedChange={(val) => handleUpdateSettings({ maintenanceMode: val })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Open Registrations</Label>
                      <p className="text-xs text-muted-foreground">Allow new users to create accounts.</p>
                    </div>
                    <Switch 
                      checked={settings?.registrationEnabled !== false} 
                      onCheckedChange={(val) => handleUpdateSettings({ registrationEnabled: val })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Configuration</CardTitle>
                  <CardDescription>Update payment gateway details for manual transfers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Platform UPI ID</Label>
                    <Input 
                      placeholder="e.g. albatul@upi" 
                      defaultValue={settings?.upiId || "albatul@upi"} 
                      onBlur={(e) => handleUpdateSettings({ upiId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Account Details (Markdown supported)</Label>
                    <Input 
                      placeholder="Account Number, IFSC, etc." 
                      defaultValue={settings?.bankDetails} 
                      onBlur={(e) => handleUpdateSettings({ bankDetails: e.target.value })}
                    />
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
