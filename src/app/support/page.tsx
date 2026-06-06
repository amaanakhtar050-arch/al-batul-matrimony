
'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Clock, 
  Send, 
  HelpCircle, 
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SupportPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const supportPhone = "8928370782";
  const supportEmail = "amaanakhtar050@gmail.com";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast({
        title: "Request Received",
        description: "Our support team will get back to you within 24 hours.",
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 lg:px-8 max-w-6xl">
        <header className="mb-16 text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-primary/5 rounded-[2.5rem] flex items-center justify-center shadow-xl">
              <HelpCircle className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold font-headline text-primary tracking-tight">Help & Support</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg font-medium leading-relaxed">
            If you have any questions, payment issues, profile verification issues, or need assistance, we are here to guide you with sincerity.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-12">
          {/* Contact Methods Sidebar */}
          <div className="lg:col-span-5 space-y-8">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-headline text-primary px-2">Quick Contact</h2>
              
              <div className="grid gap-4">
                <a href={`tel:${supportPhone}`} className="group">
                  <Card className="border-none shadow-sm hover:shadow-xl transition-all rounded-[2rem] bg-white group-hover:-translate-y-1">
                    <CardContent className="p-6 flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                        <Phone className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Call Us</p>
                        <p className="text-xl font-bold text-primary font-headline">{supportPhone}</p>
                      </div>
                    </CardContent>
                  </Card>
                </a>

                <a href={`mailto:${supportEmail}`} className="group">
                  <Card className="border-none shadow-sm hover:shadow-xl transition-all rounded-[2rem] bg-white group-hover:-translate-y-1">
                    <CardContent className="p-6 flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-secondary/10 text-secondary-foreground flex items-center justify-center shadow-inner group-hover:bg-secondary transition-all">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Email Support</p>
                        <p className="text-lg font-bold text-primary font-headline truncate">{supportEmail}</p>
                      </div>
                    </CardContent>
                  </Card>
                </a>

                <a href={`https://wa.me/${supportPhone}`} target="_blank" rel="noopener noreferrer" className="group">
                  <Card className="border-none shadow-sm hover:shadow-xl transition-all rounded-[2rem] bg-white group-hover:-translate-y-1">
                    <CardContent className="p-6 flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-inner group-hover:bg-green-600 group-hover:text-white transition-all">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">WhatsApp Chat</p>
                        <p className="text-xl font-bold text-green-700 font-headline">Fast Support</p>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </div>
            </section>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-primary text-primary-foreground overflow-hidden">
              <CardHeader className="p-10 pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-headline">
                  <Clock className="h-6 w-6 text-secondary" /> Support Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="opacity-70 font-medium">Monday – Sunday</span>
                  <span className="font-bold">Active</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="opacity-70 font-medium">Standard Hours</span>
                  <span className="font-bold">9:00 AM – 9:00 PM IST</span>
                </div>
                <p className="text-xs text-white/50 pt-4 italic">
                  * Urgent payment verifications are prioritized during active hours.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden p-2">
              {isSubmitted ? (
                <div className="p-20 text-center space-y-8 animate-fade-in">
                  <div className="h-24 w-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-headline font-bold text-primary">Message Sent Successfully</h3>
                    <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                      Thank you for contacting us. Our support team will review your request and get back to you shortly.
                    </p>
                  </div>
                  <Button variant="outline" className="h-14 px-10 rounded-2xl font-bold border-2" onClick={() => setIsSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold font-headline text-primary tracking-tight">Send a Request</h2>
                    <p className="text-muted-foreground font-medium">Complete the form below and we will respond via email.</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest ml-1 opacity-70">Full Name</Label>
                      <Input 
                        id="name" 
                        required 
                        className="h-14 rounded-2xl bg-muted/30 border-none focus-visible:bg-white transition-all px-6" 
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest ml-1 opacity-70">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        required 
                        className="h-14 rounded-2xl bg-muted/30 border-none focus-visible:bg-white transition-all px-6" 
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-widest ml-1 opacity-70">Subject</Label>
                    <Input 
                      id="subject" 
                      required 
                      className="h-14 rounded-2xl bg-muted/30 border-none focus-visible:bg-white transition-all px-6" 
                      placeholder="e.g., Payment Verification Issue"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="message" className="text-xs font-bold uppercase tracking-widest ml-1 opacity-70">Message</Label>
                    <Textarea 
                      id="message" 
                      required 
                      className="min-h-[180px] rounded-[1.5rem] bg-muted/30 border-none focus-visible:bg-white transition-all p-6 text-base" 
                      placeholder="Describe your issue or question in detail..."
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>

                  <Button type="submit" className="w-full h-20 text-xl font-bold rounded-[2rem] shadow-2xl bg-primary hover:scale-[1.02] transition-all" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending Request...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        Submit Support Request <Send className="h-6 w-6" />
                      </div>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-20 mt-12 bg-white/50 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xl font-headline font-bold text-primary mb-2">Al Batul Matrimony Support Team</p>
          <p className="text-muted-foreground font-medium">We're here to help.</p>
        </div>
      </footer>
    </div>
  );
}
