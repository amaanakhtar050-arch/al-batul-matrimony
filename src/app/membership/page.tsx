
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Crown, ShieldCheck, Zap, Star } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const PLANS = [
  { 
    id: "free",
    name: "Free", 
    price: 0, 
    duration: "Lifetime", 
    icon: Zap,
    color: "text-muted-foreground",
    features: ["Create professional profile", "Browse verified profiles", "Receive interests", "Limited daily views"] 
  },
  { 
    id: "basic",
    name: "Basic", 
    price: 99, 
    duration: "Monthly", 
    icon: ShieldCheck,
    color: "text-blue-500",
    features: ["Send 10 interests/mo", "Basic profile visibility", "View limited contact requests"] 
  },
  { 
    id: "silver",
    name: "Silver", 
    price: 199, 
    duration: "Monthly", 
    icon: Star,
    color: "text-slate-400",
    features: ["Send 30 interests/mo", "Chat with matches", "View profile visitors", "Increased visibility"] 
  },
  { 
    id: "gold",
    name: "Gold", 
    price: 299, 
    duration: "Monthly", 
    icon: Crown,
    color: "text-yellow-500",
    features: ["Send 75 interests/mo", "Unlimited chat", "Priority ranking", "Advanced filters"] 
  },
  { 
    id: "premium",
    name: "Premium", 
    price: 499, 
    duration: "Monthly", 
    icon: Crown,
    color: "text-primary",
    features: ["Unlimited interests", "Unlimited chat", "Top search placement", "Premium badge", "Priority review"] 
  },
];

export default function MembershipPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  
  const userRef = useMemoFirebase(() => user ? doc(db!, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userRef);

  const currentPlan = profile?.membership?.plan || 'Free';

  const handleUpgrade = (planId: string, price: number) => {
    if (price === 0) return;
    router.push(`/membership/pay?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16 lg:px-12 max-w-7xl">
        <header className="mb-20 text-center space-y-4">
          <Badge variant="outline" className="px-6 py-2 border-primary/20 text-primary bg-primary/5 rounded-full font-bold tracking-widest text-[10px]">
            AL BATUL MEMBERSHIP
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary tracking-tight">Invest in Your Future</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl font-medium leading-relaxed">
            Choose a plan that fits your journey. Our verified platform ensures your path to marriage is handled with sincerity and respect.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PLANS.map((plan) => {
            const isActive = currentPlan === plan.name;
            const isFree = plan.price === 0;
            
            return (
              <Card 
                key={plan.id}
                className={cn(
                  "relative flex flex-col border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden transition-all duration-500 hover:-translate-y-4",
                  isActive ? "bg-primary text-primary-foreground shadow-primary/20 ring-4 ring-white" : "bg-white"
                )}
              >
                {isActive && (
                  <div className="absolute top-6 right-6">
                    <Badge className="bg-white text-primary font-bold">CURRENT PLAN</Badge>
                  </div>
                )}
                
                <CardHeader className="p-10 pb-6">
                  <div className={cn("h-16 w-16 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner", isActive ? "bg-white/10" : "bg-muted")}>
                    <plan.icon className={cn("h-8 w-8", isActive ? "text-white" : plan.color)} />
                  </div>
                  <div className="space-y-1">
                    <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", isActive ? "text-white/60" : "text-muted-foreground")}>{plan.duration}</p>
                    <CardTitle className="text-3xl font-headline">{plan.name}</CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="p-10 pt-0 flex-1 flex flex-col">
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-bold">₹{plan.price}</span>
                    <span className={cn("text-sm opacity-60", isActive ? "text-white" : "text-muted-foreground")}>/mo</span>
                  </div>
                  
                  <ul className="space-y-5 mb-10 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-3 text-xs font-medium leading-relaxed">
                        <Check className={cn("h-4 w-4 shrink-0 mt-0.5", isActive ? "text-secondary" : "text-primary")} />
                        <span className={isActive ? "text-white/90" : "text-muted-foreground"}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {!isFree && (
                    <Button 
                      onClick={() => handleUpgrade(plan.id, plan.price)}
                      disabled={isActive}
                      className={cn(
                        "w-full h-14 rounded-2xl font-bold text-base transition-all",
                        isActive 
                          ? "bg-white/20 text-white cursor-default" 
                          : "bg-primary text-white shadow-xl hover:scale-105"
                      )}
                    >
                      {isActive ? "Active Plan" : "Upgrade Now"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <section className="mt-32 p-12 md:p-20 bg-primary rounded-[4rem] text-primary-foreground relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold font-headline leading-tight">Need custom <br /> assistance?</h2>
              <p className="text-xl text-white/70 font-medium leading-relaxed">Our dedicated support team is available to help you with payment verification or custom membership queries.</p>
            </div>
            <div className="flex justify-start md:justify-end">
               <Button variant="secondary" className="h-16 px-12 text-lg font-bold rounded-[2rem] shadow-2xl bg-white text-primary hover:bg-white/90">
                 Contact Support
               </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
