
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Upload, Clock, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const PLANS = [
  { name: "Registration", price: 200, duration: "One-time", features: ["Profile Verification", "Basic Search"] },
  { name: "Silver", price: 1500, duration: "3 Months", features: ["Advanced Filters", "Send Interests"] },
  { name: "Gold", price: 2500, duration: "6 Months", features: ["See Contact Details", "Priority Listing"] },
  { name: "Premium", price: 3000, duration: "12 Months", features: ["Relationship Manager", "Profile Spotlight"] },
  { name: "Prime", price: 4000, duration: "Unlimited", features: ["VIP Matchmaking", "Privacy Controls"] },
];

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
      toast({ title: "Invalid UTR", description: "Please enter a valid Transaction ID / UTR.", variant: "destructive" });
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
          <h1 className="mb-4 text-4xl font-bold font-headline text-primary">Find Your Match Faster</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Choose from our specialized plans to unlock advanced features and start your matrimonial journey today.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-3">
          {/* Plans Selection */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              1. Select Your Plan
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <Card 
                  key={plan.name}
                  className={`relative cursor-pointer transition-all border-2 h-full flex flex-col ${selectedPlan?.name === plan.name ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-transparent hover:border-muted shadow-sm'}`}
                  onClick={() => handleSelectPlan(plan.name, plan.price)}
                >
                  <CardHeader className="pb-2">
                    <div className="text-xs font-bold text-primary mb-1 uppercase">{plan.duration}</div>
                    <CardTitle className="text-xl font-headline">{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <div className="text-2xl font-bold">₹{plan.price.toLocaleString()}</div>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2"><Check className="h-3 w-3 text-secondary shrink-0" /> {f}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-bold flex items-center gap-2 text-primary">
                <AlertCircle className="h-5 w-5" />
                2. Payment Details
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
                  <span className="font-bold text-right">Al Batul Matrimony Services</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-sm text-muted-foreground">Bank A/C Number</span>
                  <span className="font-bold font-mono">1234 5678 9012 3456</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-sm text-muted-foreground">IFSC Code</span>
                  <span className="font-bold">ALB0000001</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Form */}
          <div className="space-y-6">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              3. Verify Payment
            </h2>
            <Card className="border-none shadow-xl bg-card overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg">Proof Submission</CardTitle>
                <CardDescription>
                  {selectedPlan ? (
                    <div className="mt-1">
                      Selected: <span className="font-bold text-primary">{selectedPlan.name} (₹{selectedPlan.price.toLocaleString()})</span>
                    </div>
                  ) : "Please select a plan to proceed."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Transaction ID / UTR</label>
                  <Input 
                    placeholder="Enter the 12-digit UTR number" 
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="h-12 font-mono"
                    disabled={!selectedPlan}
                  />
                </div>
                
                <div className="rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50 bg-muted/5">
                  <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-bold text-muted-foreground">Upload Screenshot</p>
                  <p className="text-[10px] text-muted-foreground">JPG/PNG only</p>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-accent/30 p-4 text-primary text-xs font-medium">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="leading-relaxed">
                    Our verification team will audit your UTR. Access is typically granted within 12-24 hours.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pb-8">
                <Button 
                  className="w-full h-14 text-lg font-bold shadow-lg" 
                  onClick={handleSubmitProof} 
                  disabled={isSubmitting || !selectedPlan || !transactionId}
                >
                  {isSubmitting ? "Submitting..." : "Submit Proof"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
