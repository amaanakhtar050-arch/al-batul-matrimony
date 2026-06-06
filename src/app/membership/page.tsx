
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Upload, Clock, AlertCircle, Copy, CheckCircle2, QrCode } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import Image from "next/image";

const PLANS = [
  { 
    name: "Free", 
    price: 0, 
    duration: "Lifetime", 
    features: ["Create profile", "Browse profiles", "Receive interests", "Limited daily views"] 
  },
  { 
    name: "Basic", 
    price: 99, 
    duration: "Monthly", 
    features: ["Send 10 interests/mo", "Basic profile visibility", "View limited contact requests"] 
  },
  { 
    name: "Silver", 
    price: 199, 
    duration: "Monthly", 
    features: ["Send 30 interests/mo", "Chat with matches", "View profile visitors", "Increased visibility"] 
  },
  { 
    name: "Gold", 
    price: 299, 
    duration: "Monthly", 
    features: ["Send 75 interests/mo", "Unlimited chat", "Priority ranking", "Advanced filters"] 
  },
  { 
    name: "Premium", 
    price: 499, 
    duration: "Monthly", 
    features: ["Unlimited interests", "Unlimited chat", "Top search placement", "Premium badge", "Priority review"] 
  },
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

  const activeUpiId = settings?.upiId || "amaanakhtar050-1@oksbi";

  // Generate UPI Payment URL for QR Code
  const upiUrl = useMemo(() => {
    if (!selectedPlan) return "";
    const name = encodeURIComponent("Al Batul Matrimony");
    const note = encodeURIComponent(`Membership Upgrade - ${selectedPlan.name}`);
    return `upi://pay?pa=${activeUpiId}&pn=${name}&am=${selectedPlan.price}&cu=INR&tn=${note}`;
  }, [activeUpiId, selectedPlan]);

  const qrCodeUrl = useMemo(() => {
    if (!upiUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(upiUrl)}`;
  }, [upiUrl]);

  const handleSelectPlan = (name: string, price: number) => {
    if (price === 0) {
        toast({ title: "Free Plan", description: "This is your default plan. No payment needed." });
        return;
    }
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
      userName: profile?.fullName || user.email,
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
          <h1 className="mb-4 text-4xl font-bold font-headline text-primary">Find Your Life Partner</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Registration is free! Upgrade to access premium features like direct chat and contact details.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              1. Choose a Plan
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <Card 
                  key={plan.name}
                  className={`relative cursor-pointer transition-all border-2 h-full flex flex-col ${selectedPlan?.name === plan.name ? 'border-primary bg-primary/5 ring-1 ring-primary' : (profile?.membership?.plan === plan.name ? 'border-green-500 bg-green-50/50' : 'border-transparent hover:border-muted shadow-sm')}`}
                  onClick={() => handleSelectPlan(plan.name, plan.price)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div className="text-[10px] font-bold text-primary mb-1 uppercase">{plan.duration}</div>
                        {profile?.membership?.plan === plan.name && <Badge className="bg-green-600 h-5 text-[9px]">Active</Badge>}
                    </div>
                    <CardTitle className="text-xl font-headline">{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <div className="text-2xl font-bold">₹{plan.price.toLocaleString()}</div>
                    <ul className="space-y-2 text-[11px] text-muted-foreground">
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
                    <span className="font-bold text-primary">{activeUpiId}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(activeUpiId)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-sm text-muted-foreground">Account Holder</span>
                  <span className="font-bold text-right">Al Batul Matrimony</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              3. Scan & Pay
            </h2>
            <Card className="border-none shadow-xl bg-card overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg">Insta-QR Payment</CardTitle>
                <CardDescription>
                  {selectedPlan ? (
                    <div className="mt-1">
                      Pay <span className="font-bold text-primary">₹{selectedPlan.price}</span> for {selectedPlan.name} Plan
                    </div>
                  ) : "Select a plan to see payment QR code."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {selectedPlan ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative h-48 w-48 overflow-hidden rounded-2xl border-4 border-white shadow-2xl bg-white p-2">
                      <Image 
                        src={qrCodeUrl} 
                        alt="Payment QR Code" 
                        fill 
                        className="object-contain"
                        unoptimized // QR code API returns dynamic images
                      />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                      Scan with any UPI App <br /> (GPay, PhonePe, Paytm)
                    </p>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center rounded-2xl bg-muted/20 border-2 border-dashed border-muted/50">
                    <QrCode className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                )}
                
                <div className="space-y-2 pt-4">
                  <label className="text-sm font-semibold">Transaction ID / UTR</label>
                  <Input 
                    placeholder="Enter 12-digit UTR after payment" 
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="h-12 font-mono"
                    disabled={!selectedPlan}
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    * UTR is required to verify your payment manually.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-accent/30 p-4 text-primary text-[11px] font-medium">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="leading-relaxed">
                    Once submitted, our team will verify the UTR. Your plan will be activated within 24 hours.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pb-8">
                <Button 
                  className="w-full h-14 text-lg font-bold shadow-lg" 
                  onClick={handleSubmitProof} 
                  disabled={isSubmitting || !selectedPlan || !transactionId}
                >
                  {isSubmitting ? "Processing..." : "Submit for Approval"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
