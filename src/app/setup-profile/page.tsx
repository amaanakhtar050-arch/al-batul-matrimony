
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
import { Camera, Save, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function SetupProfilePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    age: '',
    gender: '',
    height: '',
    maritalStatus: '',
    sect: '',
    education: '',
    occupation: '',
    income: '',
    city: '',
    state: '',
    country: '',
    photoUrl: '',
    about: '',
    minAgePref: '18',
    maxAgePref: '40',
    sectPref: '',
    eduPref: '',
    locPref: '',
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

    async function checkExistingProfile() {
      if (!db || !user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().status === 'approved') {
          router.push('/dashboard');
        } else if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(prev => ({
            ...prev,
            ...data,
            fullName: data.fullName || data.name || '',
            minAgePref: data.partnerPreferences?.minAge?.toString() || '18',
            maxAgePref: data.partnerPreferences?.maxAge?.toString() || '40',
            sectPref: data.partnerPreferences?.sect || '',
            eduPref: data.partnerPreferences?.education || '',
            locPref: data.partnerPreferences?.location || '',
          }));
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
      fullName: formData.fullName,
      dob: formData.dob,
      age: parseInt(formData.age),
      gender: formData.gender,
      height: formData.height,
      maritalStatus: formData.maritalStatus,
      sect: formData.sect,
      education: formData.education,
      occupation: formData.occupation,
      income: formData.income,
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
      lastActiveAt: serverTimestamp(),
      partnerPreferences: {
        minAge: parseInt(formData.minAgePref),
        maxAge: parseInt(formData.maxAgePref),
        sect: formData.sectPref || formData.sect,
        education: formData.eduPref,
        location: formData.locPref,
      }
    };

    setDoc(userDocRef, profileData, { merge: true })
      .then(() => {
        toast({
          title: "Profile Submitted",
          description: "Your profile is now pending admin approval.",
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="mb-10 text-center">
            <h1 className="text-4xl font-bold font-headline mb-2">Create Your Profile</h1>
            <p className="text-lg text-muted-foreground">Please provide accurate information for a better matching experience.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <aside className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold">Display Photo</CardTitle>
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
                    </div>
                    <div className="w-full space-y-3">
                      <Label htmlFor="photoUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Portrait URL</Label>
                      <Input 
                        id="photoUrl" 
                        placeholder="Link to your portrait..." 
                        value={formData.photoUrl}
                        onChange={(e) => setFormData({...formData, photoUrl: e.target.value})}
                        className="bg-muted/50"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-primary">Partner Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Min Age</Label>
                        <Input type="number" value={formData.minAgePref} onChange={(e) => setFormData({...formData, minAgePref: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Age</Label>
                        <Input type="number" value={formData.maxAgePref} onChange={(e) => setFormData({...formData, maxAgePref: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Preferred Sect</Label>
                      <Select value={formData.sectPref} onValueChange={(v) => setFormData({...formData, sectPref: v})}>
                        <SelectTrigger><SelectValue placeholder="Sect" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sunni">Sunni</SelectItem>
                          <SelectItem value="Shia">Shia</SelectItem>
                          <SelectItem value="Other">No Preference</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Min. Education</Label>
                      <Input placeholder="e.g. Bachelor's" value={formData.eduPref} onChange={(e) => setFormData({...formData, eduPref: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Preferred Location</Label>
                      <Input placeholder="City or Country" value={formData.locPref} onChange={(e) => setFormData({...formData, locPref: e.target.value})} />
                    </div>
                  </CardContent>
                </Card>
              </aside>

              <div className="lg:col-span-2 space-y-8">
                <Card className="border-none shadow-md">
                  <CardHeader><CardTitle className="font-headline text-2xl">Personal Details</CardTitle></CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" placeholder="Full legal name" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input id="dob" type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input id="age" type="number" placeholder="28" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height</Label>
                      <Input id="height" placeholder="e.g. 5'8\"" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})} required>
                        <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select value={formData.maritalStatus} onValueChange={(v) => setFormData({...formData, maritalStatus: v})} required>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sect">Sect</Label>
                      <Select value={formData.sect} onValueChange={(v) => setFormData({...formData, sect: v})} required>
                        <SelectTrigger><SelectValue placeholder="Religious Sect" /></SelectTrigger>
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
                  <CardHeader><CardTitle className="font-headline text-2xl">Professional & Location</CardTitle></CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="education">Education</Label>
                      <Input id="education" placeholder="e.g. Master's in IT" value={formData.education} onChange={(e) => setFormData({...formData, education: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input id="occupation" placeholder="e.g. Software Engineer" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="income">Annual Income</Label>
                      <Input id="income" placeholder="e.g. $60,000" value={formData.income} onChange={(e) => setFormData({...formData, income: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} required />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">Bio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      id="about" 
                      placeholder="Share about yourself, your values, and life goals..." 
                      className="min-h-[120px]"
                      value={formData.about}
                      onChange={(e) => setFormData({...formData, about: e.target.value})}
                      required
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end gap-4 border-t py-4">
                    <Button type="submit" size="lg" className="gap-2 font-bold" disabled={saving}>
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Submit Profile'}
                    </Button>
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
