
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, ShieldAlert, CreditCard, UserCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Admin Moderation Suite</h1>
            <p className="text-muted-foreground">Manage approvals, payments, and community safety.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search logs..." className="w-64 pl-10" />
            </div>
            <Button variant="outline">Export Data</Button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-4 mb-8">
           <Card className="bg-white">
             <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Pending Profiles</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold">14</div>
             </CardContent>
           </Card>
           <Card className="bg-white">
             <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Pending Payments</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold">8</div>
             </CardContent>
           </Card>
           <Card className="bg-white">
             <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Open Reports</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold text-destructive">2</div>
             </CardContent>
           </Card>
           <Card className="bg-white">
             <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Verified Total</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold">1,248</div>
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
              Reports & Blocks
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
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Ahmed Khan</TableCell>
                      <TableCell>Gold (3mo)</TableCell>
                      <TableCell className="font-mono text-xs">TXN123456789</TableCell>
                      <TableCell>₹1,499</TableCell>
                      <TableCell>Oct 24, 2023</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-primary hover:bg-primary/10">View Screenshot</Button>
                          <Button size="icon" className="h-8 w-8 bg-secondary hover:bg-secondary/90"><Check className="h-4 w-4" /></Button>
                          <Button size="icon" variant="destructive" className="h-8 w-8"><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Add more mock rows if needed */}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles">
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <UserCheck className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p>All profile verification requests have been processed.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
             <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <ShieldAlert className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p>No active security reports to review.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
