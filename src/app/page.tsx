import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, Heart, Users, Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-bg');

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <header className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-white px-4 pt-16 md:px-6 lg:px-12">
        <div className="absolute inset-0 z-0 opacity-[0.03]">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover scale-110"
              data-ai-hint={heroImage.imageHint}
            />
          )}
        </div>
        
        <div className="container relative z-10 mx-auto max-w-6xl text-center">
          <div className="flex justify-center mb-8 md:mb-12 animate-fade-in">
            <Logo variant="icon" size={100} className="shadow-[0_40px_100px_rgba(8,112,84,0.15)] rounded-[2.5rem] md:rounded-[3.5rem] p-4 bg-white md:size-[140px]" />
          </div>
          
          <div className="space-y-4 mb-8">
            <Badge variant="outline" className="px-4 py-1.5 md:px-6 md:py-2 border-primary/20 text-primary uppercase font-bold tracking-[0.2em] md:tracking-[0.4em] text-[10px] bg-primary/5 rounded-full">
              Trusted by Thousands
            </Badge>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold leading-[1.1] font-headline text-primary tracking-tight">
              Honoring <br />
              <span className="italic text-primary-foreground/0 bg-clip-text bg-gradient-to-r from-primary to-secondary">Intentions</span>
            </h1>
          </div>
          
          <p className="mx-auto mb-10 md:mb-12 max-w-3xl text-lg md:text-2xl text-muted-foreground/80 font-medium leading-relaxed">
            Al Batul provides a refined sanctuary for the global Muslim community to discover life partners through sincere connection and shared faith.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="h-14 md:h-16 px-8 md:px-12 text-lg md:text-xl font-bold shadow-2xl rounded-[1.5rem] md:rounded-[2rem] w-full sm:w-auto hover:scale-105 transition-transform group">
                Join Al Batul <ArrowRight className="ml-3 h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-14 md:h-16 px-8 md:px-12 text-lg md:text-xl font-bold bg-white/50 backdrop-blur-sm rounded-[1.5rem] md:rounded-[2rem] border-2 border-primary/10 w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-12 opacity-20 hidden lg:flex">
          <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6" /> <span className="font-bold text-xs uppercase tracking-widest">Verified Members</span></div>
          <div className="flex items-center gap-3"><Heart className="h-6 w-6" /> <span className="font-bold text-xs uppercase tracking-widest">Meaningful Matches</span></div>
          <div className="flex items-center gap-3"><Sparkles className="h-6 w-6" /> <span className="font-bold text-xs uppercase tracking-widest">AI Discovery</span></div>
        </div>
      </header>

      {/* Modern Features Grid */}
      <section className="bg-background py-16 md:py-32">
        <div className="container mx-auto px-4 lg:px-12">
          <div className="mb-16 md:mb-24 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold font-headline text-primary leading-tight mb-6">Designed for Purpose</h2>
            <p className="text-base md:text-lg text-muted-foreground/80 font-medium leading-relaxed">We combine traditional values with 2026-grade technology to facilitate marriages that last a lifetime.</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Curated Verification", desc: "A rigorous, manual review process ensures every profile is authentic and sincere.", bg: "bg-primary text-primary-foreground" },
              { icon: Search, title: "Intelligent Search", desc: "Filter through deep attributes like sect, education, and lifestyle with AI precision.", bg: "bg-secondary text-secondary-foreground" },
              { icon: Users, title: "Protected Interest", desc: "Conversations only occur when both parties express mutual interest, ensuring respect.", bg: "bg-white text-primary" }
            ].map((feature, i) => (
              <div key={i} className="group flex flex-col items-center text-center p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] bg-white border border-border/50 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 hover:-translate-y-4">
                <div className={cn("mb-6 md:mb-10 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-3xl shadow-xl transition-all group-hover:scale-110", feature.bg)}>
                  <feature.icon className="h-8 w-8 md:h-10 md:w-10" />
                </div>
                <h3 className="mb-3 md:mb-4 text-xl md:text-2xl font-bold font-headline text-primary">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive CTA Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 lg:px-12">
          <div className="rounded-[2.5rem] md:rounded-[4rem] bg-primary p-8 md:p-24 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl transition-all group-hover:bg-white/10" />
            
            <div className="relative z-10 text-center space-y-8 md:space-y-12">
              <h2 className="text-3xl md:text-7xl font-bold font-headline tracking-tight">Your Journey <br />Begins Here</h2>
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                <div className="space-y-2">
                  <p className="text-4xl md:text-6xl font-bold font-headline leading-none">12k+</p>
                  <p className="text-primary-foreground/60 text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em]">Verified Active Members</p>
                </div>
                <div className="h-12 w-px bg-white/20 hidden md:block" />
                <div className="space-y-2">
                  <p className="text-4xl md:text-6xl font-bold font-headline leading-none">100%</p>
                  <p className="text-primary-foreground/60 text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em]">Privacy Guaranteed</p>
                </div>
              </div>
              <Link href="/register" className="inline-block w-full sm:w-auto">
                <Button size="lg" className="h-16 md:h-20 px-8 md:px-16 text-xl md:text-2xl font-bold bg-white text-primary hover:bg-white/90 shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] hover:scale-105 transition-transform w-full">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-16 md:py-24 text-center">
        <div className="container mx-auto px-4 lg:px-12">
          <Logo variant="icon" size={48} className="mx-auto mb-8 md:mb-10 opacity-30 md:size-[60px]" />
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.4em] md:tracking-[0.6em] mb-8 md:mb-12">Al Batul Matrimony &copy; 2026</p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm font-bold text-muted-foreground/60">
             <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
             <Link href="/support" className="hover:text-primary transition-colors">Safety</Link>
             <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}