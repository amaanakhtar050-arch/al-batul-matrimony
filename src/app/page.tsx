
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, Heart, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";

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
          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-7xl">
            Find Your Half with <br />
            <span className="text-primary italic">Grace & Tradition</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Al Batul Matrimony offers a serene, trusted, and respectful environment for the Muslim community to find compatible life partners through shared values and modern technology.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/discover">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold">
                Start Searching
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold">
              Learn Our Values
            </Button>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold">A Safe Harbor for Marriage</h2>
            <p className="text-muted-foreground">Everything you need for a successful and respectful search.</p>
          </div>
          
          <div className="grid gap-12 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold">Verified Profiles</h3>
              <p className="text-muted-foreground">Every profile undergoes a manual verification process to ensure trust and authenticity within our community.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold">Advanced Matching</h3>
              <p className="text-muted-foreground">Filter by sect, education, lifestyle, and city with our intelligent matchmaker tool powered by GenAI.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold">Private & Respectful</h3>
              <p className="text-muted-foreground">Our interest exchange protocol ensures mutual respect, allowing conversations only after both parties agree.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Numbers */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="rounded-3xl bg-primary p-12 text-white md:p-16">
            <div className="grid gap-8 text-center md:grid-cols-4">
              <div>
                <p className="text-4xl font-bold">10k+</p>
                <p className="text-primary-foreground/80">Active Members</p>
              </div>
              <div>
                <p className="text-4xl font-bold">2.5k+</p>
                <p className="text-primary-foreground/80">Successful Matches</p>
              </div>
              <div>
                <p className="text-4xl font-bold">100%</p>
                <p className="text-primary-foreground/80">Private Chat</p>
              </div>
              <div>
                <p className="text-4xl font-bold">24/7</p>
                <p className="text-primary-foreground/80">Admin Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="bg-white py-16 text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <Heart className="mx-auto mb-6 h-12 w-12 text-secondary" />
          <h2 className="mb-8 text-3xl font-bold">Ready to complete your deen?</h2>
          <Button size="lg" className="h-14 px-12 text-lg font-bold">
            Create Your Profile Today
          </Button>
        </div>
      </footer>
    </div>
  );
}
