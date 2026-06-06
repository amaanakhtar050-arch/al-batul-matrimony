'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirestore, useUser, useStorage } from '@/firebase';
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
import { Camera, Save, ArrowLeft, Plus, ShieldCheck, Upload, Star, ArrowUp, ArrowDown, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { compressImage, dataURLToBlob } from '@/lib/image-utils';

export default function SetupProfilePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const storage = useStorage();
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
  const [existingProfileData, setExistingProfileData] = useState<any>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingID, setIsUploadingID] = useState(false);
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);

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
          
          const initialPhotos = data.photos || (data.photoUrl ? [data.photoUrl] : []);
          const initialPrimary = data.photoUrl || (initialPhotos.length > 0 ? initialPhotos[0] : '');

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
            photoUrl: initialPrimary,
            photos: initialPhotos,
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
        console.error("Error loading profile:", err);
      } finally {
        setCheckingProfile(false);
      }
    }
    checkExistingProfile();
  }, [user, authLoading, db, router]);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !user) return;

    if (formData.photos.length >= planLimit) {
      toast({
        variant: "destructive",
        title: "Photo Limit Reached",
        description: `Your ${existingProfileData?.membership?.plan || 'Free'} plan allows up to ${planLimit} photos.`,
      });
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const rawBase64 = reader.result as string;
        const compressed = await compressImage(rawBase64);
        const blob = await dataURLToBlob(compressed);
        
        const fileRef = ref(storage, `users/${user.uid}/photos/${Date.now()}.jpg`);
        await uploadBytes(fileRef, blob);
        const downloadURL = await getDownloadURL(fileRef);
        
        const newPhotos = [...formData.photos, downloadURL];
        const newPrimary = formData.photoUrl || downloadURL;
        
        setFormData(prev => ({ ...prev, photos: newPhotos, photoUrl: newPrimary }));
      } catch (err: any) {
        toast({ variant: "destructive", title: "Upload Failed", description: err.message });
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVerificationUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'idPhotoUrl' | 'selfiePhotoUrl') => {
    const file = e.target.files?.[0];
    if (!file || !storage || !user) return;

    field === 'idPhotoUrl' ? setIsUploadingID(true) : setIsUploadingSelfie(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const rawBase64 = reader.result as string;
        const compressed = await compressImage(rawBase64, 1000, 0.6);
        const blob = await dataURLToBlob(compressed);
        
        const fileName = field === 'idPhotoUrl' ? 'id_proof.jpg' : 'selfie.jpg';
        const fileRef = ref(storage, `users/${user.uid}/verification/${fileName}`);
        await uploadBytes(fileRef, blob);
        const downloadURL = await getDownloadURL(fileRef);
        
        setFormData(prev => ({ ...prev, [field]: downloadURL }));
      } catch (err: any) {
        toast({ variant: "destructive", title: "Verification Upload Failed", description: err.message });
      } finally {
        field === 'idPhotoUrl' ? setIsUploadingID(false) : setIsUploadingSelfie(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const setAsPrimary = (photo: string) => {
    setFormData(prev => ({ ...prev, photoUrl: photo }));
    toast({ title: "Primary Photo Updated" });
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

    setDoc(userDocRef, profileData, { merge: true })
      .then(() => {
        toast({ title: isEditing ? "Profile Updated" : "Profile Submitted" });
        router.push('/dashboard');
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'write',
          requestResourceData: profileData,
        }));
      })
      .finally(() => setSaving(false));
  };

  if (authLoading || checkingProfile) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

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
            <h1 className="text-4xl font-bold font-headline mb-2 text-primary">{isEditing ? "Update Profile" : "Complete Your Profile"}</h1>
            <p className="text-lg text-muted-foreground">Manage your identity and mandatory verification details.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <aside className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-md overflow-hidden bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-primary flex items-center justify-between">
                      Profile Gallery
                      <Badge variant="outline" className="text-[10px]">{formData.photos.length}/{planLimit}</Badge>
                    </CardTitle>
                    <CardDescription>Optimized up to {planLimit} photos.</CardDescription>
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
                               <Button type="button" size="icon" variant={formData.photoUrl === photo ? "default" : "secondary"} title="Set as primary" className="h-7 w-7 rounded-full" onClick={() => setAsPrimary(photo)}><Star className={cn("h-3 w-3", formData.photoUrl === photo && "fill-current")} /></Button>
                               <Button type="button" size="icon" variant="destructive" title="Delete photo" className="h-7 w-7 rounded-full" onClick={() => deletePhoto(idx)}><Trash2 className="h-3 w-3" /></Button>
                             </div>
                          </div>
                        </div>
                      ))}
                      {formData.photos.length < planLimit && (
                        <button 
                          type="button" 
                          onClick={() => galleryInputRef.current?.click()}
                          className="aspect-[3/4] rounded-xl border-2 border-dashed border-muted hover:border-primary/50 flex flex-col items-center justify-center text-muted-foreground/40 hover:text-primary/40"
                          disabled={isUploadingPhoto}
                        >
                          {isUploadingPhoto ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                          <span className="text-[10px] font-bold mt-1 uppercase">{isUploadingPhoto ? "Uploading..." : "Add Photo"}</span>
                        </button>
                      )}
                    </div>
                    <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-accent/20">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                      <ShieldCheck className="h-5 w-5" /> Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">ID Proof</Label>
                      <div className="relative aspect-video rounded-xl bg-white border-2 border-dashed border-primary/20 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => idInputRef.current?.click()}>
                        {isUploadingID ? <Loader2 className="h-6 w-6 animate-spin" /> : formData.idPhotoUrl ? <Image src={formData.idPhotoUrl} alt="ID" fill className="object-cover" /> : <Upload className="h-6 w-6 text-primary/40" />}
                      </div>
                      <input type="file" ref={idInputRef} className="hidden" accept="image/*" onChange={(e) => handleVerificationUpload(e, 'idPhotoUrl')} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Selfie</Label>
                      <div className="relative aspect-square rounded-xl bg-white border-2 border-dashed border-primary/20 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => selfieInputRef.current?.click()}>
                        {isUploadingSelfie ? <Loader2 className="h-6 w-6 animate-spin" /> : formData.selfiePhotoUrl ? <Image src={formData.selfiePhotoUrl} alt="Selfie" fill className="object-cover" /> : <Camera className="h-6 w-6 text-primary/40" />}
                      </div>
                      <input type="file" ref={selfieInputRef} className="hidden" accept="image/*" onChange={(e) => handleVerificationUpload(e, 'selfiePhotoUrl')} />
                    </div>
                  </CardContent>
                </Card>
              </aside>

              <div className="lg:col-span-2 space-y-8">
                <Card className="border-none shadow-md">
                  <CardHeader><CardTitle className="font-headline text-2xl text-primary">Biographical Details</CardTitle></CardHeader>
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
                    <div className="space-y-2">
                      <Label htmlFor="sect">Religious Sect</Label>
                      <Select value={formData.sect} onValueChange={(v) => setFormData({...formData, sect: v})} required>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sunni">Sunni</SelectItem>
                          <SelectItem value="Shia">Shia</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Current City</Label>
                      <Input id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                  <CardHeader><CardTitle className="font-headline text-2xl text-primary">About Me</CardTitle></CardHeader>
                  <CardContent>
                    <Textarea 
                      id="about" 
                      placeholder="Share your values and aspirations..." 
                      className="min-h-[150px]"
                      value={formData.about}
                      onChange={(e) => setFormData({...formData, about: e.target.value})}
                      required
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end pt-4">
                    <Button type="submit" size="lg" className="gap-2 font-bold px-12 h-14 shadow-lg" disabled={saving || isUploadingPhoto || isUploadingID || isUploadingSelfie}>
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Profile'}
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
