
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Camera, Save, ArrowLeft, Plus, Heart, ShieldCheck, Upload, User, X } from 'lucide-react';
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
    mobileNumber: '',
    whatsAppNumber: '',
    height: '',
    weight: '',
    maritalStatus: '',
    sect: '',
    lifestyle: '',
    education: '',
    occupation: '',
    income: '',
    city: '',
    state: '',
    country: '',
    languagesSpoken: '',
    photoUrl: '',
    photos: [] as string[],
    idPhotoUrl: '',
    selfiePhotoUrl: '',
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

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
            mobileNumber: data.mobileNumber || '',
            whatsAppNumber: data.whatsAppNumber || '',
            height: data.height || '',
            weight: data.weight || '',
            maritalStatus: data.maritalStatus || '',
            sect: data.sect || '',
            lifestyle: data.lifestyle || '',
            education: data.education || '',
            occupation: data.occupation || '',
            income: data.income || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || '',
            languagesSpoken: data.languagesSpoken?.join(', ') || '',
            photoUrl: data.photoUrl || '',
            photos: data.photos || [],
            idPhotoUrl: data.idPhotoUrl || '',
            selfiePhotoUrl: data.selfiePhotoUrl || '',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'idPhotoUrl' | 'selfiePhotoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for base64 storage
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload an image smaller than 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setSaving(true);

    const userDocRef = doc(db, 'users', user.uid);
    const languagesArray = formData.languagesSpoken.split(',').map(l => l.trim()).filter(l => l.length > 0);
    
    const profileData = {
      fullName: formData.fullName,
      dob: formData.dob,
      age: parseInt(formData.age) || 0,
      gender: formData.gender,
      mobileNumber: formData.mobileNumber,
      whatsAppNumber: formData.whatsAppNumber,
      height: formData.height,
      weight: formData.weight,
      maritalStatus: formData.maritalStatus,
      sect: formData.sect,
      lifestyle: formData.lifestyle,
      education: formData.education,
      occupation: formData.occupation,
      income: formData.income,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      languagesSpoken: languagesArray,
      photoUrl: formData.photoUrl,
      photos: formData.photos,
      idPhotoUrl: formData.idPhotoUrl,
      selfiePhotoUrl: formData.selfiePhotoUrl,
      about: formData.about,
      status: 'pending',
      isProfileComplete: true,
      lastActiveAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      partnerPreferences: {
        minAge: parseInt(formData.minAgePref) || 18,
        maxAge: parseInt(formData.maxAgePref) || 40,
        sect: formData.sectPref || formData.sect,
        education: formData.eduPref,
        location: formData.locPref,
      }
    };

    const finalData = isEditing ? profileData : { 
      ...profileData, 
      createdAt: serverTimestamp(), 
      membership: { plan: 'Free' }, 
      role: 'user',
      isSuspended: false,
      isBanned: false
    };

    setDoc(userDocRef, finalData, { merge: true })
      .then(() => {
        toast({
          title: "Profile Submitted",
          description: "Your details and identity documents are now pending administrative review.",
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
            {isEditing && (
              <Link href="/dashboard" className="mb-4 self-start text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Link>
            )}
            <h1 className="text-4xl font-bold font-headline mb-2 text-primary">{isEditing ? "Update Profile" : "Create Your Profile"}</h1>
            <p className="text-lg text-muted-foreground">Submit your details and identity documents for mandatory verification.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <aside className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="pb-4 text-center">
                    <CardTitle className="text-lg font-bold text-primary">Profile Photo</CardTitle>
                    <CardDescription>Upload a clear photo of yourself.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 flex flex-col items-center">
                    <div className="group relative h-48 w-48 overflow-hidden rounded-3xl bg-muted shadow-inner border-2 border-primary/10">
                      {formData.photoUrl ? (
                        <>
                          <Image src={formData.photoUrl} alt="Profile Preview" fill className="object-cover" />
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, photoUrl: ''})}
                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/30">
                          <User className="h-16 w-16 mb-2" />
                          <span className="text-[10px] text-center font-bold uppercase tracking-wider">No Photo Uploaded</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full h-11 font-bold gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {formData.photoUrl ? "Change Photo" : "Upload Photo"}
                    </Button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'photoUrl')} 
                    />
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-accent/20">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                      <ShieldCheck className="h-5 w-5" /> Identity Verification
                    </CardTitle>
                    <CardDescription className="text-xs">Required for profile approval.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Government ID</Label>
                      <div className="relative aspect-video rounded-xl bg-white/50 border-2 border-dashed border-primary/20 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/80 transition-colors" onClick={() => idInputRef.current?.click()}>
                        {formData.idPhotoUrl ? (
                          <Image src={formData.idPhotoUrl} alt="ID Scan" fill className="object-cover" />
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 mx-auto mb-1 text-primary/40" />
                            <p className="text-[10px] font-bold text-primary/40 uppercase">Upload ID Scan</p>
                          </div>
                        )}
                      </div>
                      <input type="file" ref={idInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'idPhotoUrl')} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Verification Selfie</Label>
                      <div className="relative aspect-square rounded-xl bg-white/50 border-2 border-dashed border-primary/20 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/80 transition-colors" onClick={() => selfieInputRef.current?.click()}>
                        {formData.selfiePhotoUrl ? (
                          <Image src={formData.selfiePhotoUrl} alt="Selfie" fill className="object-cover" />
                        ) : (
                          <div className="text-center">
                            <Camera className="h-6 w-6 mx-auto mb-1 text-primary/40" />
                            <p className="text-[10px] font-bold text-primary/40 uppercase">Upload Selfie</p>
                          </div>
                        )}
                      </div>
                      <input type="file" ref={selfieInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'selfiePhotoUrl')} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                      <Heart className="h-5 w-5" /> Preferences
                    </CardTitle>
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
                  </CardContent>
                </Card>
              </aside>

              <div className="lg:col-span-2 space-y-8">
                <Card className="border-none shadow-md">
                  <CardHeader><CardTitle className="font-headline text-2xl text-primary">Personal Information</CardTitle></CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})} required>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input id="age" type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select value={formData.maritalStatus} onValueChange={(v) => setFormData({...formData, maritalStatus: v})} required>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader><CardTitle className="font-headline text-2xl text-primary">About Me</CardTitle></CardHeader>
                  <CardContent>
                    <Textarea 
                      id="about" 
                      placeholder="Write a sincere bio about yourself and your values..." 
                      className="min-h-[150px]"
                      value={formData.about}
                      onChange={(e) => setFormData({...formData, about: e.target.value})}
                      required
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end pt-4">
                    <Button type="submit" size="lg" className="gap-2 font-bold px-12 h-14 shadow-lg" disabled={saving}>
                      <Save className="h-4 w-4" />
                      {saving ? 'Submitting...' : 'Submit Profile for Approval'}
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
