
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Activity, ShieldCheck, Heart, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { intelligentMatchmakerSuggestions, IntelligentMatchmakerSuggestionsOutput } from "@/ai/flows/intelligent-matchmaker-suggestions";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";

const USER_PROFILE = {
  sect: "Sunni",
  education: "Masters in Business",
  lifestyle: "Moderate, active",
  city: "Dubai",
  maritalStatus: "Single",
  age: 28
};

const AVAILABLE_PROFILES = [
  { profileId: "p1", sect: "Sunni", education: "Lawyer", lifestyle: "Religious", city: "Dubai", maritalStatus: "Single", age: 26 },
  { profileId: "p2", sect: "Sunni", education: "Doctor", lifestyle: "Moderate", city: "Abu Dhabi", maritalStatus: "Single", age: 27 },
  { profileId: "p3", sect: "Shia", education: "Engineer", lifestyle: "Active", city: "Dubai", maritalStatus: "Single", age: 25 },
];

export default function DashboardPage() {
  const [aiSuggestions, setAiSuggestions] = useState<IntelligentMatchmakerSuggestionsOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const result = await intelligentMatchmakerSuggestions({
          userProfile: USER_PROFILE,
          availableProfiles: AVAILABLE_PROFILES
        });
        setAiSuggestions(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 lg:px-8">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold font-headline">Salam, Ahmed!</h1>
            <p className="text-muted-foreground">Welcome back to your matrimonial journey.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Verified Status
            </Button>
            <Button className="gap-2 bg-secondary hover:bg-secondary/90 text-primary-foreground">
              Upgrade to Premium
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* AI Matchmaker Section */}
          <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Sparkles className="h-6 w-6 text-secondary" />
                AI Matchmaker Suggestions
              </CardTitle>
              <Badge variant="secondary">GenAI</Badge>
            </CardHeader>
            <CardContent>
              <p className="mb-6 opacity-80">Based on your preferences and lifestyle, we've found these compatible profiles for you.</p>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                  </div>
                ) : (
                  aiSuggestions?.suggestions.map((suggestion) => (
                    <div key={suggestion.profileId} className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm md:flex-row md:items-center">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/20">
                         <Image src={`https://picsum.photos/seed/${suggestion.profileId}/100/100`} fill className="object-cover" alt="Profile" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold">Match ID: {suggestion.profileId}</h4>
                        <p className="text-sm opacity-80">{suggestion.reason}</p>
                      </div>
                      <Button variant="secondary" size="sm" className="gap-2">
                        View Profile
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity & Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Interest Received</p>
                    <p className="text-xs text-muted-foreground">Fatima S. expressed interest</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Profile Verified</p>
                    <p className="text-xs text-muted-foreground">Your identity proof was approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Trust Center</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Profile Completion</span>
                  <span className="text-sm font-bold">85%</span>
                </div>
                <div className="mb-6 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[85%] bg-primary" />
                </div>
                <Button variant="outline" className="w-full">Update Profile</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
