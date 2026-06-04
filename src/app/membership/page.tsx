
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Upload, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function MembershipPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  
  const userRef = useMemoFirebase(() => user ? doc(db!, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userRef);

  const [transactionId, setTransactionId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPlan = (name: string, price: number) => {
    setSelectedPlan({ name, price });
  };

  const handleSubmitProof = () => {
    if (!user || !db) return;
    if (!selectedPlan) {
      toast({ title: "Select a Plan", description: "Please select a membership plan first.", variant: "destructive" });
      return;
    }
    if (!transactionId || transactionId.length < 6) {
      toast({ title: "Invalid Transaction ID", description: "Please enter a valid UTR or Transaction ID.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const paymentData = {
      userId: user.uid,
      userName: profile?.name || user.email,
      plan: selectedPlan.name,
      amount: selectedPlan.price,
      transactionId: transactionId,
      screenshotUrl: `https://picsum.photos/seed/${transactionId}/800/600`, // Placeholder for actual upload
      status: "pending",
      createdAt: serverTimestamp()
    };

    const paymentsRef = collection(db, "payments");
    addDoc(paymentsRef, paymentData)
      .then(() => {
        toast({
          title: "Payment Submitted",
          description: "Our admin team will verify your payment within 24 hours.",
        });
        setTransactionId("");
        setSelectedPlan(null);
        router.push("/dashboard");
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: paymentsRef.path,
          operation: "create",
          requestResourceData: paymentData,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 lg:px-8">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold font-headline">Premium Membership</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Enhance your search with advanced features, unlimited interests, and verified status.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Plans */}
          <div className="space-y-6">
            <Card 
              className={`relative cursor-pointer transition-all border-2 ${selectedPlan?.name === 'Gold' ? 'border-primary bg-primary/5' : 'border-transparent'}`}
              onClick={() => handleSelectPlan('Gold', 1499)}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-white">MOST POPULAR</div>
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Gold Plan</CardTitle>
                <CardDescription>Perfect for finding your partner quickly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">₹1,499 <span className="text-sm font-normal text-muted-foreground">/ 3 Months</span></div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-secondary" /> Unlimited Interest Requests</li>
                  <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-secondary" /> Access to All Contact Details</li>
                  <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-secondary" /> Priority Verification Badge</li>
                </ul>
              </CardContent>
            </Card>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-bold">Manual Payment Details:</h3>
              <div className="space-y-4 rounded-xl bg-muted p-4 border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bank Account Name</span>
                  <span className="font-bold">Al Batul Foundation</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">UPI ID</span>
                  <span className="font-bold text-primary underline">albatul@upi</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">IFSC Code</span>
                  <span className="font-bold">ALB0001234</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Number</span>
                  <span className="font-bold">987654321012</span>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary text-sm font-bold">1</div>
                  <p className="text-sm text-muted-foreground">Transfer the amount for your chosen plan to the details above.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary text-sm font-bold">2</div>
                  <p className="text-sm text-muted-foreground">Note down the 12-digit UTR / Transaction ID.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary text-sm font-bold">3</div>
                  <p className="text-sm text-muted-foreground">Enter the ID and submit for verification here.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Submit Verification Request
              </CardTitle>
              <CardDescription>
                {selectedPlan ? `Plan: ${selectedPlan.name} (₹${selectedPlan.price})` : "Please select a plan from the left."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction ID / UTR Number</label>
                <Input 
                  placeholder="Enter 12-digit transaction ID" 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
              
              <div className="rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50 bg-accent/10">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Screenshot upload is required for verification.</p>
                <p className="text-xs text-muted-foreground">Our system will associate your Transaction ID with the transfer.</p>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-accent p-4 text-primary">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs font-medium">Manual verification usually takes 12-24 hours. You will receive a notification once your premium status is active.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full h-12 text-lg" 
                onClick={handleSubmitProof} 
                disabled={isSubmitting || !selectedPlan || !transactionId}
              >
                {isSubmitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
