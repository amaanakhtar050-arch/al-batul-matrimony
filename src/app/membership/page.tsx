
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Upload, Clock, ShieldCheck, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
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

  const platformSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'platform') : null, [db]);
  const { data: settings } = useDoc(platformSettingsRef);

  const [transactionId, setTransactionId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPlan = (name: string, price: number) => {
    setSelectedPlan({ name, price });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Payment detail copied to clipboard." });
  };

  const handleSubmitProof = () => {
    if (!user || !db) return;
    if (!selectedPlan) {
      toast({ title: "Select a Plan", description: "Please select a membership plan first.", variant: "destructive" });
      return;
    }
    if (!transactionId || transactionId.length < 6) {
      toast({ title: "Invalid UTR", description: "Please enter a valid 12-digit UTR or Transaction ID.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const paymentData = {
      userId: user.uid,
      userName: profile?.fullName || profile?.name || user.email,
      plan: selectedPlan.name,
      amount: selectedPlan.price,
      transactionId: transactionId,
      screenshotUrl: `https://picsum.photos/seed/${transactionId}/800/600`,
      status: "pending",
      createdAt: serverTimestamp()
    };

    const paymentsRef = collection(db, "payments");
    addDoc(paymentsRef, paymentData)
      .then(() => {
        toast({
          title: "Payment Submitted",
          description: "Our admin team will verify your payment and activate your benefits within 12-24 hours.",
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
          <Badge variant="outline" className="mb-4 px-4 py-1 border-primary/20 text-primary">MEMBERSHIP UPGRADE</Badge>
          <h1 className="mb-4 text-4xl font-bold font-headline">Find Your Match Faster</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Choose a premium plan to unlock unlimited interests, direct contact access, and a verified profile badge.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Plans Selection */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              1. Select Your Plan
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card 
                className={`relative cursor-pointer transition-all border-2 h-full ${selectedPlan?.name === 'Gold' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-transparent hover:border-muted'}`}
                onClick={() => handleSelectPlan('Gold', 1499)}
              >
                <CardHeader className="pb-2">
                  <div className="text-xs font-bold text-primary mb-1 uppercase">3 Months</div>
                  <CardTitle className="text-2xl font-headline">Gold</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">₹1,499</div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Unlimited Interests</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Priority Verification</li>
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className={`relative cursor-pointer transition-all border-2 h-full ${selectedPlan?.name === 'Platinum' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-transparent hover:border-muted'}`}
                onClick={() => handleSelectPlan('Platinum', 2999)}
              >
                <div className="absolute -top-3 right-4 rounded-full bg-secondary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">BEST VALUE</div>
                <CardHeader className="pb-2">
                  <div className="text-xs font-bold text-primary mb-1 uppercase">6 Months</div>
                  <CardTitle className="text-2xl font-headline">Platinum</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">₹2,999</div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Gold Features + More</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Relationship Manager</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm mt-8">
              <h3 className="mb-4 font-bold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                2. Admin Payment Details
              </h3>
              <div className="space-y-4 rounded-xl bg-muted/30 p-5 border border-border">
                <div className="flex justify-between items-center group">
                  <span className="text-sm text-muted-foreground">UPI ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{settings?.upiId || "albatul@upi"}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(settings?.upiId || "albatul@upi")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-sm text-muted-foreground">Bank A/C Name</span>
                  <span className="font-bold">Al Batul Foundation</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-sm text-muted-foreground">IFSC Code</span>
                  <span className="font-bold">ALB0001234</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-sm text-muted-foreground">Account Number</span>
                  <span className="font-bold font-mono">9876 5432 1012</span>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <p className="text-xs text-muted-foreground italic">Follow these steps:</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">1</span>
                    Transfer the exact amount via any UPI app or NetBanking.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">2</span>
                    Keep a screenshot of the successful transaction.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">3</span>
                    Enter the UTR / Ref ID in the form to the right.
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Payment Proof Submission */}
          <div className="space-y-6">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              3. Submit Verification
            </h2>
            <Card className="border-none shadow-xl bg-card">
              <CardHeader className="bg-primary/5 rounded-t-lg">
                <CardTitle className="text-lg">Proof of Payment</CardTitle>
                <CardDescription>
                  {selectedPlan ? (
                    <span className="font-bold text-primary">Plan: {selectedPlan.name} (₹{selectedPlan.price})</span>
                  ) : "Please select a plan first."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Transaction ID / UTR (12 Digits)</label>
                  <Input 
                    placeholder="Enter the UTR from your bank app" 
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="h-12 font-mono text-lg"
                  />
                  <p className="text-[10px] text-muted-foreground">Example: 425689012345</p>
                </div>
                
                <div className="rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:border-primary/50 bg-accent/5">
                  <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-bold text-muted-foreground mb-1">Click to upload screenshot</p>
                  <p className="text-[10px] text-muted-foreground">JPG, PNG up to 5MB</p>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-secondary/10 p-4 text-primary">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-xs font-medium leading-relaxed">
                    Our team manually audits every UTR. Activation usually occurs within 24 hours of submission.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pb-8">
                <Button 
                  className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20" 
                  onClick={handleSubmitProof} 
                  disabled={isSubmitting || !selectedPlan || !transactionId}
                >
                  {isSubmitting ? "Processing..." : "Submit for Verification"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
