
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, ShieldAlert, CreditCard, UserCheck, Search, ExternalLink, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, serverTimestamp, query, orderBy, where } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const paymentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "payments"), orderBy("createdAt", "desc"));
  }, [db]);

  const profilesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users"), where("status", "==", "pending"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: payments, loading: loadingPayments } = useCollection(paymentsQuery);
  const { data: pendingProfiles, loading: loadingProfiles } = useCollection(profilesQuery);

  const handleApprovePayment = async (paymentId: string, userId: string, plan: string) => {
    if (!db) return;
    
    const paymentRef = doc(db, "payments", paymentId);
    const userRef = doc(db, "users", userId);

    // Update payment status
    updateDoc(paymentRef, {
      status: "approved",
      processedAt: serverTimestamp(),
      notes: "Payment verified manually by admin."
    }).catch(async (e) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({ path: paymentRef.path, operation: "update" }));
    });

    // Activate membership for user
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 3); // 3 months for Gold

    updateDoc(userRef, {
      "membership.plan": plan,
      "membership.expiresAt": expiryDate.toISOString(),
      status: "approved" // Auto approve profile if payment is made
    }).then(() => {
      toast({ title: "Success", description: `Payment approved and ${plan} membership activated.` });
    }).catch(async (e) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({ path: userRef.path, operation: "update" }));
    });
  };

  const handleRejectPayment = (paymentId: string) => {
    if (!db) return;
    const paymentRef = doc(db, "payments", paymentId);
    updateDoc(paymentRef, {
      status: "rejected",
      processedAt: serverTimestamp(),
      notes: "Payment verification failed."
    }).then(() => {
      toast({ title: "Payment Rejected", variant: "destructive" });
    });
  };

  const handleApproveProfile = (userId: string) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    updateDoc(userRef, {
      status: "approved"
    }).then(() => {
      toast({ title: "Profile Approved" });
    });
  };

  const filteredPayments = payments?.filter(p => 
    p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.transactionId?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Admin Moderation Suite</h1>
            <p className="text-muted-foreground">Manage approvals, payments, and community safety.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by name or UTR..." 
                className="w-64 pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">Refresh</Button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-4 mb-8">
           <Card className="bg-white">
             <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending Profiles</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold">{pendingProfiles?.length || 0}</div>
             </CardContent>
           </Card>
           <Card className="bg-white">
             <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending Payments</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {payments?.filter(p => p.status === 'pending').length || 0}
                </div>
             </CardContent>
           </Card>
           <Card className="bg-white">
             <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Approved Today</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold text-secondary">
                  {payments?.filter(p => p.status === 'approved').length || 0}
                </div>
             </CardContent>
           </Card>
           <Card className="bg-white">
             <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Revenue</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold">₹{payments?.filter(p => p.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</div>
             </CardContent>
           </Card>
        </div>

        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="profiles" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Profile Verification
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              UPI Payments
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <ShieldAlert className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>UTR / Transaction ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPayments ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-10">Loading payments...</TableCell></TableRow>
                    ) : filteredPayments?.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No payments found matching criteria.</TableCell></TableRow>
                    ) : filteredPayments?.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.userName}</TableCell>
                        <TableCell><Badge variant="outline">{payment.plan}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{payment.transactionId}</TableCell>
                        <TableCell>₹{payment.amount}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {payment.createdAt?.toDate ? format(payment.createdAt.toDate(), 'MMM dd, HH:mm') : 'Recently'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.status === 'approved' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <Button size="icon" className="h-8 w-8 bg-secondary hover:bg-secondary/90" onClick={() => handleApprovePayment(payment.id, payment.userId, payment.plan)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleRejectPayment(payment.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <Button size="sm" variant="ghost" disabled><Check className="h-4 w-4 mr-1"/> Processed</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Sect</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingProfiles ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-10">Loading profiles...</TableCell></TableRow>
                    ) : pendingProfiles?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">All profiles verified.</TableCell></TableRow>
                    ) : pendingProfiles?.map((profile: any) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.name}</TableCell>
                        <TableCell>{profile.age} / {profile.gender}</TableCell>
                        <TableCell>{profile.city}, {profile.country}</TableCell>
                        <TableCell>{profile.sect}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {profile.createdAt?.toDate ? format(profile.createdAt.toDate(), 'MMM dd') : 'Recently'}
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="gap-1 h-8">
                              <ExternalLink className="h-3 w-3" /> Details
                            </Button>
                            <Button size="icon" className="h-8 w-8 bg-secondary hover:bg-secondary/90" onClick={() => handleApproveProfile(profile.id)}>
                              <Check className="h-4 w-4" />
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

          <TabsContent value="reports">
             <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <ShieldAlert className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p>Safety reports and community moderation tools.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
