
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
import { Camera, Save, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
    weight: '',
    maritalStatus: '',
    sect: '',
    education: '',
    occupation: '',
    income: '',
    city: '',
    state: '',
    country: '',
    languagesSpoken: '',
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
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    async function checkExistingProfile() {
      if (!db || !user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsEditing(true);
          setFormData(prev => ({
            ...prev,
            ...data,
            fullName: data.fullName || '',
            dob: data.dob || '',
            age: data.age?.toString() || '',
            height: data.height || '',
            weight: data.weight || '',
            maritalStatus: data.maritalStatus || '',
            sect: data.sect || '',
            education: data.education || '',
            occupation: data.occupation || '',
            income: data.income || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || '',
            languagesSpoken: data.languagesSpoken?.join(', ') || '',
            photoUrl: data.photoUrl || '',
            about: data.about || '',
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
  }, [user, authLoading, db, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setSaving(true);

    const userDocRef = doc(db, 'users', user.uid);
    const languagesArray = formData.languagesSpoken.split(',').map(l => l.trim()).filter(l => l.length > 0);
    
    const profileData = {
      fullName: formData.fullName,
      dob: formData.dob,
      age: parseInt(formData.age),
      gender: formData.gender,
      height: formData.height,
      weight: formData.weight,
      maritalStatus: formData.maritalStatus,
      sect: formData.sect,
      education: formData.education,
      occupation: formData.occupation,
      income: formData.income,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      languagesSpoken: languagesArray,
      photoUrl: formData.photoUrl || `https://picsum.photos/seed/${user.uid}/600/800`,
      about: formData.about,
      status: isEditing ? 'pending' : 'pending', // Re-submit for approval on edit as standard practice
      lastActiveAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      partnerPreferences: {
        minAge: parseInt(formData.minAgePref),
        maxAge: parseInt(formData.maxAgePref),
        sect: formData.sectPref || formData.sect,
        education: formData.eduPref,
        location: formData.locPref,
      }
    };

    // Only set createdAt if it's a new profile
    const finalData = isEditing ? profileData : { ...profileData, createdAt: serverTimestamp(), membership: { plan: 'Free' }, role: 'user' };

    setDoc(userDocRef, finalData, { merge: true })
      .then(() => {
        toast({
          title: isEditing ? "Profile Updated" : "Profile Submitted",
          description: "Your profile details have been saved and sent for admin verification.",
        });
        router.push('/dashboard');
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'write',
          requestResourceData: finalData,
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
          <header className="mb-10 text-center flex flex-col items-center">
            <Link href="/dashboard" className="mb-4 self-start text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold font-headline mb-2">{isEditing ? "Edit Your Profile" : "Complete Your Profile"}</h1>
            <p className="text-lg text-muted-foreground">Keep your details up to date for better matches.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <aside className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold">Profile Photo</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-6">
                    <div className="group relative h-48 w-48 overflow-hidden rounded-3xl bg-muted shadow-inner">
                      {formData.photoUrl ? (
                        <Image src={formData.photoUrl} alt="Profile Preview" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/40">
                          <Camera className="h-14 w-14 mb-2" />
                          <span className="text-xs text-center px-4">Upload a clear photo to increase visibility</span>
                        </div>
                      )}
                    </div>
                    <div className="w-full space-y-3">
                      <Label htmlFor="photoUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Photo URL</Label>
                      <Input 
                        id="photoUrl" 
                        placeholder="Paste image link here..." 
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
                        <SelectTrigger><SelectValue placeholder="Select Sect" /></SelectTrigger>
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
                      <Label className="text-xs">Preferred Region</Label>
                      <Input placeholder="City or Country" value={formData.locPref} onChange={(e) => setFormData({...formData, locPref: e.target.value})} />
                    </div>
                  </CardContent>
                </Card>
              </aside>

              <div className="lg:col-span-2 space-y-8">
                <Card className="border-none shadow-md">
                  <CardHeader><CardTitle className="font-headline text-2xl">Personal Information</CardTitle></CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" placeholder="Full name as per ID" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input id="dob" type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input id="age" type="number" placeholder="Enter age" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="height">Height</Label>
                        <Input id="height" placeholder="e.g. 5'7\"" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight</Label>
                        <Input id="weight" placeholder="e.g. 70 kg" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} />
                      </div>
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
                        <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widow/Widower</SelectItem>
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
                    <div className="space-y-2">
                      <Label htmlFor="languagesSpoken">Languages Spoken</Label>
                      <Input id="languagesSpoken" placeholder="English, Urdu, etc." value={formData.languagesSpoken} onChange={(e) => setFormData({...formData, languagesSpoken: e.target.value})} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader><CardTitle className="font-headline text-2xl">Professional & Location</CardTitle></CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="education">Education</Label>
                      <Input id="education" placeholder="e.g. MBA, MBBS" value={formData.education} onChange={(e) => setFormData({...formData, education: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input id="occupation" placeholder="e.g. Software Engineer" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="income">Annual Income</Label>
                      <Input id="income" placeholder="e.g. ₹12,0,000" value={formData.income} onChange={(e) => setFormData({...formData, income: e.target.value})} />
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
                      placeholder="Tell us about yourself, your family values, and what you seek in a life partner..." 
                      className="min-h-[150px]"
                      value={formData.about}
                      onChange={(e) => setFormData({...formData, about: e.target.value})}
                      required
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end gap-4 border-t py-4">
                    <Button type="submit" size="lg" className="gap-2 font-bold" disabled={saving}>
                      <Save className="h-4 w-4" />
                      {saving ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Profile' : 'Complete Profile')}
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
