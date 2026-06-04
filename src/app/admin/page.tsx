
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
  ShieldAlert, 
  CreditCard, 
  UserCheck, 
  Search, 
  ExternalLink, 
  Settings, 
  Users, 
  Ban, 
  ShieldCheck, 
  Trash2, 
  Edit3,
  Unlock,
  Lock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useCollection, useFirestore, useMemoFirebase, useDoc, useUser } from "@/firebase";
import { 
  collection, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  where, 
  deleteDoc,
  setDoc 
} from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
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

  // Administrative Actions
  const handleApprovePayment = (paymentId: string, userId: string, plan: string) => {
    if (!db) return;
    const paymentRef = doc(db, "payments", paymentId);
    const userRef = doc(db, "users", userId);

    updateDoc(paymentRef, {
      status: "approved",
      processedAt: serverTimestamp(),
      notes: "Payment verified manually by super-admin."
    }).catch(e => errorEmitter.emit("permission-error", new FirestorePermissionError({ path: paymentRef.path, operation: "update" })));

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 3);

    updateDoc(userRef, {
      "membership.plan": plan,
      "membership.expiresAt": expiryDate.toISOString(),
      status: "approved"
    }).then(() => {
      toast({ title: "Payment Approved", description: `${plan} membership activated.` });
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
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Super-Admin Panel</h1>
            <p className="text-muted-foreground">Full control over Al Batul platform, members, and settings.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                className="w-64 pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4 md:w-auto">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role / Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingUsers ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10">Loading users...</TableCell></TableRow>
                    ) : filteredUsers?.map((user: any) => (
                      <TableRow key={user.id} className={user.isBanned ? "bg-red-50/50" : user.isSuspended ? "bg-orange-50/50" : ""}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.city}, {user.country}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>{user.role || 'user'}</Badge>
                            <Badge variant="secondary" className="w-fit">{user.membership?.plan || 'Free'}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={user.status === 'approved' ? 'default' : 'secondary'}>{user.status}</Badge>
                            {user.isSuspended && <Badge variant="destructive" className="bg-orange-600">Suspended</Badge>}
                            {user.isBanned && <Badge variant="destructive">Banned</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleUpdateUserStatus(user.id, { isSuspended: !user.isSuspended })}>
                              {user.isSuspended ? <Unlock className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-orange-600" />}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleUpdateUserStatus(user.id, { isBanned: !user.isBanned })}>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers?.filter(u => u.status === 'pending').map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.age} / {user.gender} • {user.sect}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleUpdateUserStatus(user.id, { status: 'approved' })}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {allUsers?.filter(u => u.status === 'pending').length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No pending approvals.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>UTR</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.userName}</TableCell>
                        <TableCell>{payment.plan}</TableCell>
                        <TableCell className="font-mono text-xs">{payment.transactionId}</TableCell>
                        <TableCell><Badge variant={payment.status === 'approved' ? 'default' : 'secondary'}>{payment.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          {payment.status === 'pending' && (
                            <Button size="sm" onClick={() => handleApprovePayment(payment.id, payment.userId, payment.plan)}>
                              Approve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Controls</CardTitle>
                  <CardDescription>Manage global site behavior and accessibility.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-xs text-muted-foreground">Restrict public access to the platform.</p>
                    </div>
                    <Switch 
                      checked={settings?.maintenanceMode || false} 
                      onCheckedChange={(val) => handleUpdateSettings({ maintenanceMode: val })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Registrations</Label>
                      <p className="text-xs text-muted-foreground">Allow new users to join the community.</p>
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
                  <CardTitle>Financial Settings</CardTitle>
                  <CardDescription>Configure payment details for manual verification.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Platform UPI ID</Label>
                    <Input 
                      placeholder="e.g. albatul@upi" 
                      defaultValue={settings?.upiId} 
                      onBlur={(e) => handleUpdateSettings({ upiId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Site Name</Label>
                    <Input 
                      placeholder="Al Batul Matrimony" 
                      defaultValue={settings?.siteName}
                      onBlur={(e) => handleUpdateSettings({ siteName: e.target.value })}
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
