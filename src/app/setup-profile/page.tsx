
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/layout/Navbar';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Camera, Save, ArrowLeft, Plus, Heart, ShieldCheck, Upload, User, X, Loader2, Star, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
    photoUrl: '', // Primary Photo
    photos: [] as string[], // Gallery
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
  const [existingProfileData, setExistingProfileData] = useState<any>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const planLimit = existingProfileData?.membership?.plan === 'Premium' ? 6 : 2;

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
          setExistingProfileData(data);
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

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db || !user) return;

    if (formData.photos.length >= planLimit) {
      toast({
        variant: "destructive",
        title: "Photo Limit Reached",
        description: `Your ${existingProfileData?.membership?.plan || 'Free'} plan allows up to ${planLimit} photos. Upgrade to Premium for 6 slots.`,
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 2MB.",
      });
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newPhotos = [...formData.photos, base64String];
      // If it's the first photo, set it as primary too
      const newPrimary = formData.photoUrl || base64String;
      
      setFormData(prev => ({ ...prev, photos: newPhotos, photoUrl: newPrimary }));
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'idPhotoUrl' | 'selfiePhotoUrl') => {
    const file = e.target.files?.[0];
    if (!file || !db || !user) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, [field]: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const setAsPrimary = (photo: string) => {
    setFormData(prev => ({ ...prev, photoUrl: photo }));
    toast({ title: "Primary Photo Updated", description: "This photo will be displayed in search results." });
  };

  const deletePhoto = (index: number) => {
    const photoToDelete = formData.photos[index];
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    let newPrimary = formData.photoUrl;
    
    if (photoToDelete === formData.photoUrl) {
      newPrimary = newPhotos.length > 0 ? newPhotos[0] : '';
    }
    
    setFormData(prev => ({ ...prev, photos: newPhotos, photoUrl: newPrimary }));
  };

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...formData.photos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPhotos.length) return;
    
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIndex];
    newPhotos[targetIndex] = temp;
    
    setFormData(prev => ({ ...prev, photos: newPhotos }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setSaving(true);

    const userDocRef = doc(db, 'users', user.uid);
    const languagesArray = formData.languagesSpoken.split(',').map(l => l.trim()).filter(l => l.length > 0);
    
    const currentStatus = existingProfileData?.status || 'pending';
    const nextStatus = (currentStatus === 'approved') ? 'approved' : 'pending';

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
      status: nextStatus,
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
          title: isEditing ? "Profile Updated" : "Profile Submitted",
          description: "Your changes have been saved successfully.",
        });
        router.push('/dashboard');
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'write',
          requestResourceData: finalData,
        }));
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
            <p className="text-lg text-muted-foreground">Manage your photos and mandatory verification details.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <aside className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-primary flex items-center justify-between">
                      Profile Gallery
                      <Badge variant="outline" className="text-[10px]">{formData.photos.length}/{planLimit}</Badge>
                    </CardTitle>
                    <CardDescription>Upload up to {planLimit} photos. Mark one as primary.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {formData.photos.map((photo, idx) => (
                        <div key={idx} className={cn("group relative aspect-[3/4] overflow-hidden rounded-xl border-2 transition-all", formData.photoUrl === photo ? "border-primary shadow-md" : "border-muted")}>
                          <Image src={photo} alt={`Gallery ${idx}`} fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                             <div className="flex gap-1">
                               <Button type="button" size="icon" variant="secondary" className="h-7 w-7 rounded-full" onClick={() => movePhoto(idx, 'up')} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button>
                               <Button type="button" size="icon" variant="secondary" className="h-7 w-7 rounded-full" onClick={() => movePhoto(idx, 'down')} disabled={idx === formData.photos.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                             </div>
                             <div className="flex gap-1">
                               <Button type="button" size="icon" variant={formData.photoUrl === photo ? "default" : "secondary"} className="h-7 w-7 rounded-full" onClick={() => setAsPrimary(photo)}><Star className={cn("h-3 w-3", formData.photoUrl === photo && "fill-current")} /></Button>
                               <Button type="button" size="icon" variant="destructive" className="h-7 w-7 rounded-full" onClick={() => deletePhoto(idx)}><Trash2 className="h-3 w-3" /></Button>
                             </div>
                          </div>
                          {formData.photoUrl === photo && (
                            <div className="absolute top-2 left-2 bg-primary text-white p-1 rounded-full shadow-sm"><Star className="h-3 w-3 fill-current" /></div>
                          )}
                        </div>
                      ))}
                      {formData.photos.length < planLimit && (
                        <button 
                          type="button" 
                          onClick={() => galleryInputRef.current?.click()}
                          className="aspect-[3/4] rounded-xl border-2 border-dashed border-muted hover:border-primary/50 transition-colors flex flex-col items-center justify-center text-muted-foreground/40 hover:text-primary/40"
                        >
                          {isUploadingPhoto ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                          <span className="text-[10px] font-bold mt-1 uppercase">Add Photo</span>
                        </button>
                      )}
                    </div>
                    <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleGalleryUpload} />
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
                      {saving ? 'Saving Changes...' : (isEditing ? 'Save Profile' : 'Submit Profile for Approval')}
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
