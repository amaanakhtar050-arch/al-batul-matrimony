import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, Heart, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/brand/Logo";

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-bg');

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <header className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-primary/5 px-4 pt-16 lg:px-8">
        <div className="absolute inset-0 z-0 opacity-10">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
            />
          )}
        </div>
        
        <div className="container relative z-10 mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Logo variant="icon" size={120} className="shadow-2xl rounded-[2.5rem]" />
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-7xl font-headline">
            Find Your Half with <br />
            <span className="text-primary italic">Grace & Tradition</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl font-medium">
            Al Batul Matrimony offers a serene, trusted, and respectful environment for the Muslim community to find compatible life partners through shared values and modern technology.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/discover">
              <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-xl rounded-2xl">
                Start Searching
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold bg-white/50 backdrop-blur-sm rounded-2xl border-2">
              Our Values
            </Button>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4 px-4 py-1 border-primary/20 text-primary uppercase font-bold tracking-widest">Why Choose Us</Badge>
            <h2 className="text-4xl font-bold font-headline text-primary">A Safe Harbor for Marriage</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">Everything you need for a successful, sincere, and respectful search for your life partner.</p>
          </div>
          
          <div className="grid gap-12 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-8 rounded-[2.5rem] bg-background/30 border border-border/50 hover:shadow-2xl transition-all group">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg transition-transform group-hover:scale-110">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold font-headline">Verified Profiles</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Every profile undergoes a manual verification process to ensure trust and authenticity within our community.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-8 rounded-[2.5rem] bg-background/30 border border-border/50 hover:shadow-2xl transition-all group">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold font-headline">Advanced Matching</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Filter by sect, education, lifestyle, and city with our intelligent matchmaker tool powered by AI.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-8 rounded-[2.5rem] bg-background/30 border border-border/50 hover:shadow-2xl transition-all group">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg transition-transform group-hover:scale-110">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold font-headline">Private & Respectful</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Our interest exchange protocol ensures mutual respect, allowing conversations only after both parties agree.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="rounded-[3rem] bg-primary p-12 text-white md:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="grid gap-8 text-center md:grid-cols-4 relative z-10">
              <div className="space-y-1">
                <p className="text-4xl font-bold font-headline">10k+</p>
                <p className="text-primary-foreground/80 text-sm font-bold uppercase tracking-widest">Active Members</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold font-headline">2.5k+</p>
                <p className="text-primary-foreground/80 text-sm font-bold uppercase tracking-widest">Successful Matches</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold font-headline">100%</p>
                <p className="text-primary-foreground/80 text-sm font-bold uppercase tracking-widest">Private & Secure</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold font-headline">24/7</p>
                <p className="text-primary-foreground/80 text-sm font-bold uppercase tracking-widest">Admin Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="bg-white py-24 text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <Logo variant="icon" size={80} className="mx-auto mb-8" />
          <h2 className="mb-8 text-4xl font-bold font-headline text-primary">Ready to complete your deen?</h2>
          <Link href="/register">
            <Button size="lg" className="h-16 px-12 text-xl font-bold shadow-2xl rounded-2xl">
              Create Your Profile Today
            </Button>
          </Link>
          <div className="mt-12 flex justify-center gap-6 opacity-40">
             <Image src="https://picsum.photos/seed/trust1/120/40" alt="Trust" width={120} height={40} className="grayscale" />
             <Image src="https://picsum.photos/seed/trust2/120/40" alt="Trust" width={120} height={40} className="grayscale" />
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
