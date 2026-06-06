'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function PrivacyPolicyPage() {
  const lastUpdated = "June 10, 2026";

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 py-12 lg:px-8 max-w-4xl">
        <header className="mb-12">
          <Link href="/settings" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Settings
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">Privacy Policy</h1>
              <p className="text-muted-foreground font-medium text-sm">Last Updated: {lastUpdated}</p>
            </div>
            <div className="h-16 w-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center text-primary shadow-inner shrink-0">
               <Shield className="h-8 w-8" />
            </div>
          </div>
        </header>

        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-xl border border-white/20 p-8 md:p-12">
          <CardContent className="p-0 space-y-12 text-muted-foreground leading-relaxed font-medium">
            <section className="space-y-4">
              <p className="text-lg">Welcome to Al Batul Matrimony. Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your information when you use our application.</p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-headline text-primary">1. Information We Collect</h2>
              <div className="space-y-6 pl-6 border-l-2 border-primary/20">
                <div className="space-y-2">
                   <h3 className="font-bold text-foreground uppercase tracking-widest text-xs">Account Information</h3>
                   <ul className="list-disc pl-5 space-y-1">
                      <li>Name, Email address, Mobile number</li>
                      <li>Gender, Date of birth, Marital status</li>
                      <li>Education details, Occupation, Location</li>
                   </ul>
                </div>
                <div className="space-y-2">
                   <h3 className="font-bold text-foreground uppercase tracking-widest text-xs">Profile Information</h3>
                   <ul className="list-disc pl-5 space-y-1">
                      <li>Profile photos</li>
                      <li>About me section</li>
                      <li>Partner preferences</li>
                   </ul>
                </div>
                <div className="space-y-2">
                   <h3 className="font-bold text-foreground uppercase tracking-widest text-xs">Communication Data</h3>
                   <ul className="list-disc pl-5 space-y-1">
                      <li>Interests sent and received</li>
                      <li>Messages exchanged through the platform</li>
                      <li>Notifications</li>
                   </ul>
                </div>
                <div className="space-y-2">
                   <h3 className="font-bold text-foreground uppercase tracking-widest text-xs">Membership and Payment Information</h3>
                   <ul className="list-disc pl-5 space-y-1">
                      <li>Membership plan details</li>
                      <li>Payment transaction references</li>
                      <li>Payment screenshots submitted for verification</li>
                   </ul>
                </div>
              </div>
              <div className="bg-destructive/5 text-destructive p-4 rounded-xl text-sm italic font-bold">
                * We do not store your bank account passwords, UPI PINs, card numbers, or other sensitive payment credentials.
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-primary">2. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Create and manage your account securely</li>
                <li>Display your profile to potential matches based on compatibility</li>
                <li>Facilitate communication between members via mutual interest</li>
                <li>Verify profiles to maintain community standards</li>
                <li>Process membership upgrade requests and verify payments</li>
                <li>Improve our matchmaking services and AI algorithms</li>
                <li>Provide dedicated customer support</li>
                <li>Prevent fraud, abuse, and platform misuse</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-primary">3. Profile Visibility</h2>
              <p>Information you choose to place on your profile may be visible to other members according to your individual privacy settings and membership permissions. You can control visibility of photos and last active status within the application settings.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-primary">4. Data Security</h2>
              <p>We take reasonable technical and organizational steps to protect user information from unauthorized access, misuse, or disclosure. We use encrypted storage and secure protocols; however, no online platform can guarantee absolute security.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-primary">5. User Safety</h2>
              <p>Member safety is our priority. Users may block other users, report suspicious profiles, or report inappropriate behavior. We reserve the right to suspend or remove accounts that violate our community standards or privacy policies without prior notice.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-primary">6. Information Sharing</h2>
              <p>We do not sell personal information to third parties. Information may be shared only when required by law, to investigate fraud/security issues, or with verified service providers necessary for standard app operations.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-primary">7. Account Deletion</h2>
              <p>Users may request permanent deletion of their account and associated data through the application settings or by contacting our support team directly. Deletion is irreversible.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-primary">8. Children's Privacy</h2>
              <p>Al Batul Matrimony is strictly intended only for adults who meet the legal age requirements for marriage in their respective jurisdiction. We do not knowingly collect data from minors.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-primary">9. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons. Updated versions with the date of revision will be posted within the application.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-headline text-primary">10. Contact Us</h2>
              <p>For privacy concerns, data requests, or general support:</p>
              <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 space-y-2">
                <p className="font-bold text-primary">Email: <span className="text-foreground">amaanakhtar050@gmail.com</span></p>
                <p className="font-bold text-primary">Phone: <span className="text-foreground">8928370782</span></p>
                <p className="mt-4 text-[10px] uppercase font-bold tracking-widest opacity-60">Al Batul Matrimony Support Team</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>

      <footer className="py-16 md:py-24 text-center">
        <div className="container mx-auto px-4">
          <Logo variant="icon" size={48} className="mx-auto mb-8 opacity-20" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em]">Al Batul Matrimony &copy; 2026</p>
        </div>
      </footer>
    </div>
  );
}