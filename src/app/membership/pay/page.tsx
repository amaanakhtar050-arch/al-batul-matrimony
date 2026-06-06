"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Copy, 
  QrCode, 
  ArrowLeft, 
  ArrowRight,
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  Camera
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PLANS = [
  { id: "basic", name: "Basic", price: 99 },
  { id: "silver", name: "Silver", price: 199 },
  { id: "gold", name: "Gold", price: 299 },
  { id: "premium", name: "Premium", price: 499 },
];

export default function PaymentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  
  const planId = searchParams.get('plan');
  const selectedPlan = useMemo(() => PLANS.find(p => p.id === planId), [planId]);

  const userRef = useMemoFirebase(() => user ? doc(db!, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userRef);

  const platformSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'platform') : null, [db]);
  const { data: settings } = useDoc(platformSettingsRef);

  const activeUpiId = settings?.upiId || "amaanakhtar050-1@oksbi";

  useEffect(() => {
    if (!planId || !selectedPlan) {
      router.replace('/membership');
    }
  }, [planId, selectedPlan, router]);

  const upiUrl = useMemo(() => {
    if (!selectedPlan) return "";
    const name = encodeURIComponent("Al Batul Matrimony");
    const note = encodeURIComponent(`Membership Upgrade - ${selectedPlan.name}`);
    return `upi://pay?pa=${activeUpiId}&pn=${name}&am=${selectedPlan.price}&cu=INR&tn=${note}`;
  }, [activeUpiId, selectedPlan]);

  const qrCodeUrl = useMemo(() => {
    if (!upiUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;
  }, [upiUrl]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to Clipboard", description: "You can now paste the UPI ID in your payment app." });
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !selectedPlan) return;

    if (!transactionId || transactionId.length < 8) {
      toast({ 
        variant: "destructive", 
        title: "Invalid Transaction ID", 
        description: "Please enter a valid 12-digit UTR or Transaction ID." 
      });
      return;
    }

    setIsSubmitting(true);
    
    const paymentData = {
      userId: user.uid,
      userName: profile?.fullName || user.email,
      plan: selectedPlan.name,
      amount: selectedPlan.price,
      transactionId: transactionId.trim(),
      screenshotUrl: `https://picsum.photos/seed/${transactionId}/800/600`, // Placeholder
      status: "pending",
      createdAt: serverTimestamp()
    };

    try {
      const paymentsRef = collection(db, "payments");
      await addDoc(paymentsRef, paymentData);
      
      toast({
        title: "Payment Submitted Successfully",
        description: "Membership will be activated after verification (usually within 12-24 hours).",
      });
      
      router.push("/dashboard");
    } catch (error: any) {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: "payments",
        operation: "create",
        requestResourceData: paymentData
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedPlan) return null;

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 md:py-12 lg:px-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 md:mb-12 text-[10px] md:text-sm font-bold uppercase tracking-widest text-muted-foreground/60 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/membership" className="hover:text-primary transition-colors">Membership</Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-primary">Checkout</span>
        </nav>

        <div className="grid gap-8 md:gap-12 lg:grid-cols-5">
          {/* Summary Section */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <Card className="border-none shadow-xl rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white">
              <CardHeader className="bg-primary p-6 md:p-10 text-primary-foreground text-center sm:text-left">
                <CardTitle className="text-xl md:text-2xl font-headline">Order Summary</CardTitle>
                <CardDescription className="text-white/60">Review your chosen plan details.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 space-y-6">
                 <div className="flex justify-between items-center pb-4 md:pb-6 border-b">
                   <span className="text-sm md:text-base text-muted-foreground font-medium">Selected Plan</span>
                   <span className="font-bold text-lg md:text-xl text-primary">{selectedPlan.name}</span>
                 </div>
                 <div className="flex justify-between items-center pb-4 md:pb-6 border-b">
                   <span className="text-sm md:text-base text-muted-foreground font-medium">Validity</span>
                   <span className="font-bold">30 Days</span>
                 </div>
                 <div className="flex justify-between items-center pt-4">
                   <span className="text-base md:text-lg font-bold text-primary">Total Payable</span>
                   <span className="text-2xl md:text-3xl font-bold text-primary">₹{selectedPlan.price}</span>
                 </div>
              </CardContent>
            </Card>

            <div className="p-6 md:p-8 bg-white/50 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] border border-white/40 space-y-6 shadow-sm">
              <div className="flex items-center gap-4 text-primary">
                 <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 shrink-0" />
                 <div>
                   <p className="font-bold text-sm md:text-base">Secure Transactions</p>
                   <p className="text-[10px] md:text-xs text-muted-foreground font-medium">All payments are manually verified for your security.</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 text-primary">
                 <Clock className="h-6 w-6 md:h-8 md:w-8 shrink-0" />
                 <div>
                   <p className="font-bold text-sm md:text-base">Activation Time</p>
                   <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Verified within 12-24 hours of submission.</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="lg:col-span-3">
            <Card className="border-none shadow-2xl rounded-[2.5rem] md:rounded-[3.5rem] bg-white overflow-hidden p-1 md:p-2">
              <form onSubmit={handleSubmitPayment}>
                <div className="p-6 md:p-10 space-y-8 md:space-y-10">
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold font-headline text-primary mb-2">Step 1: Scan & Pay</h2>
                    <p className="text-sm md:text-base text-muted-foreground font-medium">Pay the exact amount using any UPI app.</p>
                  </div>

                  <div className="flex flex-col items-center gap-6 md:gap-8 py-4">
                    <div className="relative h-48 w-48 md:h-64 md:w-64 p-3 md:p-4 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.1)] border-2 border-muted/20">
                      <Image 
                        src={qrCodeUrl} 
                        alt="Payment QR" 
                        fill 
                        className="object-contain p-3 md:p-4"
                        unoptimized
                      />
                      <div className="absolute -bottom-3 md:-bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-xl whitespace-nowrap">
                        Scan with any UPI
                      </div>
                    </div>
                    
                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-between p-4 md:p-6 bg-muted/30 rounded-[1.5rem] md:rounded-[2rem] border border-border group overflow-hidden">
                        <div className="space-y-0.5 overflow-hidden">
                          <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Merchant UPI ID</p>
                          <p className="font-mono font-bold text-primary text-sm md:text-lg truncate">{activeUpiId}</p>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl hover:bg-primary hover:text-white transition-all shrink-0"
                          onClick={() => copyToClipboard(activeUpiId)}
                        >
                          <Copy className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 md:space-y-8">
                    <div className="text-center sm:text-left">
                      <h2 className="text-2xl md:text-3xl font-bold font-headline text-primary mb-2">Step 2: Verification</h2>
                      <p className="text-sm md:text-base text-muted-foreground font-medium">Share your payment details to activate benefits.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2 md:space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">UTR / Transaction ID</label>
                        <Input 
                          placeholder="Enter 12-digit UTR Number" 
                          className="h-14 md:h-16 rounded-xl md:rounded-[1.5rem] border-muted/30 bg-muted/10 focus-visible:bg-white transition-all px-4 md:px-6 font-mono text-base md:text-lg"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2 md:space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Payment Screenshot</label>
                        <div className="h-28 md:h-32 rounded-xl md:rounded-[1.5rem] border-2 border-dashed border-muted/40 hover:border-primary/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-muted/5 group">
                           <Camera className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/30 group-hover:text-primary/30 transition-colors" />
                           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Upload Screenshot</span>
                        </div>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground leading-relaxed italic ml-1">
                          * Ensure the Transaction ID and Amount are clearly visible in the screenshot.
                        </p>
                      </div>
                    </div>
                  </div>

                  {isSubmitting && (
                    <div className="flex items-center gap-3 p-4 md:p-6 bg-accent/30 text-primary rounded-[1.5rem] md:rounded-[2rem] border border-primary/5 animate-fade-in">
                       <AlertCircle className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                       <p className="text-[11px] md:text-sm font-medium">Submitting details. Please do not close this window.</p>
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-8 pt-0">
                  <Button 
                    type="submit" 
                    className="w-full h-16 md:h-20 text-lg md:text-xl font-bold rounded-2xl md:rounded-[2.5rem] shadow-2xl bg-primary hover:scale-[1.02] transition-all disabled:opacity-50"
                    disabled={isSubmitting || !transactionId}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 md:gap-3">
                        Submit Payment Proof <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}