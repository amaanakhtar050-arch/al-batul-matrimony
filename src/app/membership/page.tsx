
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Upload, Clock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function MembershipPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload your UPI payment screenshot.",
        variant: "destructive"
      });
      return;
    }
    // Mock upload success
    toast({
      title: "Payment Submitted",
      description: "Our admin team will verify your payment within 24 hours.",
    });
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
            <Card className="relative border-primary bg-primary/5">
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
                  <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-secondary" /> Ad-free Experience</li>
                </ul>
              </CardContent>
            </Card>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-bold">How it works:</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary text-sm font-bold">1</div>
                  <p className="text-sm text-muted-foreground">Scan our UPI QR code or pay to <span className="font-bold text-foreground">albatul@upi</span></p>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary text-sm font-bold">2</div>
                  <p className="text-sm text-muted-foreground">Take a screenshot of the successful transaction</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary text-sm font-bold">3</div>
                  <p className="text-sm text-muted-foreground">Upload the screenshot here for manual admin verification</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Payment Proof
              </CardTitle>
              <CardDescription>Select your plan and upload the transaction screenshot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction ID / UTR Number</label>
                <Input placeholder="Enter 12-digit transaction ID" />
              </div>
              
              <div className="rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50">
                <input 
                  type="file" 
                  className="hidden" 
                  id="screenshot" 
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="screenshot" className="cursor-pointer">
                  <div className="mb-2 flex justify-center">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">{selectedFile ? selectedFile.name : 'Click to upload screenshot'}</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG or PDF (Max 5MB)</p>
                </label>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-accent p-4 text-primary">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs">Manual verification usually takes 12-24 hours. You will receive a notification once your premium status is active.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleUpload}>Submit for Verification</Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
