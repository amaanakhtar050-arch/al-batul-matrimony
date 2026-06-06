'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Logo } from '@/components/brand/Logo';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Mismatch",
        description: "The passwords you entered do not match.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password should be at least 6 characters long.",
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create initial user profile in Firestore immediately
      const userDocRef = doc(db, 'users', user.uid);
      const initialProfile = {
        email: user.email,
        status: 'pending',
        role: 'user',
        isProfileComplete: false,
        isSuspended: false,
        isBanned: false,
        membership: { plan: 'Free' },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, initialProfile, { merge: true })
        .catch(async (e) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: initialProfile
          }));
        });

      await sendEmailVerification(user);
      setVerificationSent(true);
      toast({
        title: "Account created!",
        description: "A verification email has been sent to your address. Please verify it to continue.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred during signup.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto flex items-center justify-center px-4 py-20">
          <Card className="w-full max-w-md text-center border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardHeader className="pt-12">
              <div className="mx-auto mb-8">
                <Logo variant="app-icon" size={80} className="shadow-2xl animate-pulse" />
              </div>
              <CardTitle className="text-3xl font-headline font-bold text-primary">Check Your Inbox</CardTitle>
              <CardDescription className="text-base font-medium mt-4">
                We've sent a verification link to <br /><strong className="text-foreground">{email}</strong>. <br /><br />
                Please verify your email address to continue setting up your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-8 px-10">
              <div className="flex items-center gap-4 rounded-2xl bg-primary/5 p-6 text-sm text-left border border-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                <p className="font-medium text-primary/80">Email verification helps us maintain a secure and trustworthy community for all members.</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-6 px-10 pb-12">
              <Button onClick={() => router.push('/login')} className="w-full h-14 text-lg font-bold shadow-xl rounded-2xl transition-transform active:scale-95">
                Go to Login Page
              </Button>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Didn't receive the email? Check your spam folder.
              </p>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto flex items-center justify-center px-4 py-20">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="space-y-1 text-center pt-10 px-8">
            <div className="mx-auto mb-6">
              <Logo variant="app-icon" size={64} className="shadow-xl" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-primary">Join Al Batul</CardTitle>
            <CardDescription className="text-sm font-medium">Start your journey towards finding a compatible life partner</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-5 px-10">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest opacity-70">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="h-12 rounded-xl bg-muted/30 border-none focus-visible:bg-white transition-all"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" title="Minimum 6 characters" className="text-xs font-bold uppercase tracking-widest opacity-70">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="h-12 rounded-xl bg-muted/30 border-none focus-visible:bg-white transition-all"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-widest opacity-70">Confirm Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  className="h-12 rounded-xl bg-muted/30 border-none focus-visible:bg-white transition-all"
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-6 px-10 pb-12 pt-8">
              <Button type="submit" className="w-full h-14 text-lg font-bold shadow-xl rounded-2xl transition-transform active:scale-95" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : 'Create Account'}
              </Button>
              <div className="relative w-full text-center">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted"></span></div>
                <span className="relative bg-white px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Already have an account?</span>
              </div>
              <Link href="/login" className="w-full">
                <Button variant="outline" type="button" className="w-full h-12 rounded-xl border-2 font-bold" disabled={loading}>
                  Sign in here
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
