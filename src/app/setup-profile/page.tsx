
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/layout/Navbar';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Camera, Save, ArrowRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function SetupProfilePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    maritalStatus: '',
    sect: '',
    education: '',
    occupation: '',
    city: '',
    state: '',
    country: '',
    photoUrl: '',
    about: '',
    minAgePref: '18',
    maxAgePref: '40',
    sectPref: '',
  });

  const [saving, setSaving] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (!user.emailVerified) {
       toast({
         title: "Email Not Verified",
         description: "Please verify your email address to complete your profile registration.",
         variant: "destructive"
       });
       router.push('/login');
       return;
    }

    // Check if profile already exists
    async function checkExistingProfile() {
      if (!db || !user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().status === 'approved') {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      } finally {
        setCheckingProfile(false);
      }
    }
    checkExistingProfile();
  }, [user, authLoading, db, router, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setSaving(true);

    const userDocRef = doc(db, 'users', user.uid);
    const profileData = {
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      maritalStatus: formData.maritalStatus,
      sect: formData.sect,
      education: formData.education,
      occupation: formData.occupation,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      photoUrl: formData.photoUrl || `https://picsum.photos/seed/${user.uid}/600/800`,
      about: formData.about,
      status: 'pending',
      role: 'user',
      membership: {
        plan: 'Free'
      },
      createdAt: serverTimestamp(),
      preferences: {
        minAge: parseInt(formData.minAgePref),
        maxAge: parseInt(formData.maxAgePref),
        sect: formData.sectPref || formData.sect,
      }
    };

    setDoc(userDocRef, profileData, { merge: true })
      .then(() => {
        toast({
          title: "Profile Submitted",
          description: "Your profile is now pending admin approval. You will be notified once verified.",
        });
        router.push('/dashboard');
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'write',
          requestResourceData: profileData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setSaving(false));
  };

  if (authLoading || checkingProfile) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <header className="mb-10 text-center">
            <h1 className="text-4xl font-bold font-headline mb-2">Build Your Identity</h1>
            <p className="text-lg text-muted-foreground">Complete your matrimonial profile to connect with potential matches.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <aside className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold">Profile Photo</CardTitle>
                    <CardDescription>First impressions matter.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-6">
                    <div className="group relative h-48 w-48 overflow-hidden rounded-3xl bg-muted shadow-inner">
                      {formData.photoUrl ? (
                        <Image src={formData.photoUrl} alt="Profile Preview" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/40">
                          <Camera className="h-14 w-14 mb-2" />
                          <span className="text-xs">No Photo</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="text-white h-8 w-8" />
                      </div>
                    </div>
                    <div className="w-full space-y-3">
                      <Label htmlFor="photoUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Image URL</Label>
                      <Input 
                        id="photoUrl" 
                        placeholder="Link to your portrait..." 
                        value={formData.photoUrl}
                        onChange={(e) => setFormData({...formData, photoUrl: e.target.value})}
                        className="bg-muted/50"
                      />
                      <p className="text-[10px] italic leading-tight text-muted-foreground">
                        Tip: Use a clear, front-facing portrait for higher engagement.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Preferences</CardTitle>
                    <CardDescription>What are you looking for?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minAgePref" className="text-xs">Min Age</Label>
                        <Input id="minAgePref" type="number" value={formData.minAgePref} onChange={(e) => setFormData({...formData, minAgePref: e.target.value})} className="bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxAgePref" className="text-xs">Max Age</Label>
                        <Input id="maxAgePref" type="number" value={formData.maxAgePref} onChange={(e) => setFormData({...formData, maxAgePref: e.target.value})} className="bg-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sectPref" className="text-xs">Preferred Sect</Label>
                      <Select onValueChange={(v) => setFormData({...formData, sectPref: v})}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Compatible sects" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sunni">Sunni</SelectItem>
                          <SelectItem value="Shia">Shia</SelectItem>
                          <SelectItem value="Other">No Preference</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </aside>

              <div className="lg:col-span-2 space-y-8">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Current Age</Label>
                      <Input id="age" type="number" placeholder="28" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select onValueChange={(v) => setFormData({...formData, gender: v})} required>
                        <SelectTrigger><SelectValue placeholder="Identity" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select onValueChange={(v) => setFormData({...formData, maritalStatus: v})} required>
                        <SelectTrigger><SelectValue placeholder="Current status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sect">Religious Sect</Label>
                      <Select onValueChange={(v) => setFormData({...formData, sect: v})} required>
                        <SelectTrigger><SelectValue placeholder="Background" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sunni">Sunni</SelectItem>
                          <SelectItem value="Shia">Shia</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">Professional & Location</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="education">Highest Education</Label>
                      <Input id="education" placeholder="e.g. Master's in Computer Science" value={formData.education} onChange={(e) => setFormData({...formData, education: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Current Occupation</Label>
                      <Input id="occupation" placeholder="e.g. Product Designer" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="London" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input id="state" placeholder="Ontario" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" placeholder="Canada" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} required />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">Biography</CardTitle>
                    <CardDescription>Tell your story and share your values.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      id="about" 
                      placeholder="Share a bit about your lifestyle, personality, and what you're looking for in a partner..." 
                      className="min-h-[160px] resize-none"
                      value={formData.about}
                      onChange={(e) => setFormData({...formData, about: e.target.value})}
                      required
                    />
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t bg-muted/20 py-4 px-6 rounded-b-lg">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Profiles are manually verified
                    </div>
                    <div className="flex gap-4">
                      <Button type="button" variant="ghost" onClick={() => router.back()}>Discard</Button>
                      <Button type="submit" size="lg" className="gap-2 font-bold" disabled={saving}>
                        <Save className="h-4 w-4" />
                        {saving ? 'Submitting...' : 'Complete Registration'}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
