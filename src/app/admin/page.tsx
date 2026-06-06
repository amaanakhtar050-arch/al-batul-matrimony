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
  AlertCircle,
  Loader2
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
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";

const PLANS_LIST = ["Free", "Basic", "Silver", "Gold", "Premium"];

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

  useEffect(() => {
    if (!authLoading && !profileLoading && user && db) {
      const userEmail = user.email?.toLowerCase() || "";
      const currentRole = profile?.role?.toLowerCase();
      
      const isSuperAdmin = SUPER_ADMIN_EMAILS.some(email => userEmail === email.toLowerCase());
      const isActuallyAdmin = currentRole === "admin" || isSuperAdmin;

      if (!isActuallyAdmin) {
        router.replace("/dashboard");
      } else {
        if (isSuperAdmin && currentRole !== "admin" && userProfileRef) {
          updateDoc(userProfileRef, { 
            role: "admin", 
            status: "approved",
            updatedAt: serverTimestamp() 
          }).then(() => {
            toast({ title: "Admin Access Initialized" });
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

    const payUpdate = { status: "approved", processedAt: serverTimestamp() };
    updateDoc(paymentRef, payUpdate).catch(async (e) => errorEmitter.emit("permission-error", new FirestorePermissionError({ path: paymentRef.path, operation: "update", requestResourceData: payUpdate })));

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const userUpdate = { "membership.plan": plan, "membership.expiresAt": expiryDate.toISOString() };
    updateDoc(userRef, userUpdate).then(() => {
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
    }).catch(async (e) => errorEmitter.emit("permission-error", new FirestorePermissionError({ path: userRef.path, operation: "update", requestResourceData: userUpdate })));
  };

  const handleRejectPayment = (paymentId: string, userId: string) => {
    if (!db) return;
    const paymentRef = doc(db, "payments", paymentId);
    const update = { status: "rejected", processedAt: serverTimestamp() };
    updateDoc(paymentRef, update).then(() => {
      toast({ title: "Payment Rejected" });
      addDoc(collection(db, 'users', userId, 'notifications'), {
        type: 'membership_rejected',
        title: '❌ Payment Failed',
        message: `Your payment verification failed. Please check details.`,
        senderId: 'admin',
        receiverId: userId,
        read: false,
        createdAt: serverTimestamp()
      });
    }).catch(async (e) => errorEmitter.emit("permission-error", new FirestorePermissionError({ path: paymentRef.path, operation: "update", requestResourceData: update })));
  };

  const handleUpdateUserStatus = (userId: string, updates: any) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    updateDoc(userRef, updates).then(() => {
      toast({ title: "User Updated" });
      if (updates.status) {
        addDoc(collection(db, 'users', userId, 'notifications'), {
          type: updates.status === 'approved' ? 'verification_approved' : 'verification_rejected',
          title: updates.status === 'approved' ? '✅ Profile Verified' : '❌ Verification Rejected',
          message: updates.status === 'approved' ? 'Your profile is now live.' : 'Verification failed.',
          senderId: 'admin',
          receiverId: userId,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    }).catch(async (e) => errorEmitter.emit("permission-error", new FirestorePermissionError({ path: userRef.path, operation: "update", requestResourceData: updates })));
  };

  const handleDeleteUser = (userId: string) => {
    if (!db || !confirm("Delete this user?")) return;
    const userRef = doc(db, "users", userId);
    deleteDoc(userRef).then(() => {
      toast({ title: "User Deleted" });
    }).catch(async (e) => errorEmitter.emit("permission-error", new FirestorePermissionError({ path: userRef.path, operation: "delete" })));
  };

  const filteredUsers = allUsers?.filter(u => 
    (u.fullName || u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingVerifications = allUsers?.filter(u => u.status === 'pending' && u.isProfileComplete);

  if (authLoading || profileLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const isActuallyAdmin = profile?.role?.toLowerCase() === "admin" || SUPER_ADMIN_EMAILS.some(e => user?.email?.toLowerCase() === e.toLowerCase());

  if (!user || !isActuallyAdmin) return <div className="flex h-screen items-center justify-center p-4 text-center">Unauthorized</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Administration</h1>
            <p className="text-muted-foreground text-sm">Control center for Al Batul.</p>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </header>

        <Tabs defaultValue="payments">
          <TabsList className="mb-6">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="approvals">Verifications ({pendingVerifications?.length || 0})</TabsTrigger>
            <TabsTrigger value="users">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card className="border-none shadow-sm">
              <Table>
                <TableHeader>
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
                      <TableCell>{payment.userName}</TableCell>
                      <TableCell><Badge variant="outline">{payment.plan}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{payment.transactionId}</TableCell>
                      <TableCell>₹{payment.amount}</TableCell>
                      <TableCell><Badge>{payment.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {payment.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                             <Button size="sm" className="bg-green-600" onClick={() => handleApprovePayment(payment.id, payment.userId, payment.plan)}>Approve</Button>
                             <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRejectPayment(payment.id, payment.userId)}>Reject</Button>
                          </div>
                        )}
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
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Docs</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingVerifications?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-semibold">{user.fullName}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild><Button variant="outline" size="sm">ID Scan</Button></DialogTrigger>
                            <DialogContent className="max-w-3xl">
                                <Image src={user.idPhotoUrl || "https://picsum.photos/seed/id/800/600"} alt="ID" width={800} height={600} className="object-contain" />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" className="bg-green-600" onClick={() => handleUpdateUserStatus(user.id, { status: 'approved' })}>Approve</Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleUpdateUserStatus(user.id, { status: 'rejected' })}>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-none shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.fullName || user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'approved' ? 'default' : 'secondary'}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleUpdateUserStatus(user.id, { isBanned: !user.isBanned })}>
                            <Ban className={cn("h-4 w-4", user.isBanned ? "text-primary" : "text-destructive")} />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteUser(user.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
