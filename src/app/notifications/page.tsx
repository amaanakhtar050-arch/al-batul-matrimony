'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, CheckCircle2, Heart, MessageSquare, ShieldCheck, User, Clock, CreditCard, Eye } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [db, user]);

  const { data: notifications, loading: loadingNotifications } = useCollection(notificationsQuery);

  // Debug logging as requested
  useEffect(() => {
    if (notifications.length > 0) {
      console.log('Al Batul Notifications Data:', notifications);
    }
  }, [notifications]);

  const handleMarkAsRead = (id: string) => {
    if (!db || !user) return;
    const notificationRef = doc(db, 'users', user.uid, 'notifications', id);
    updateDoc(notificationRef, { read: true });
  };

  const handleDelete = (id: string) => {
    if (!db || !user) return;
    const notificationRef = doc(db, 'users', user.uid, 'notifications', id);
    deleteDoc(notificationRef);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'interest_received':
      case 'interest_accepted':
      case 'match_created':
        return <Heart className="h-4 w-4 text-primary" />;
      case 'interest_rejected':
        return <Heart className="h-4 w-4 text-muted-foreground" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'profile_approved':
      case 'verification_approved':
        return <ShieldCheck className="h-4 w-4 text-green-600" />;
      case 'membership_upgraded':
        return <CreditCard className="h-4 w-4 text-primary" />;
      case 'profile_viewed':
        return <Eye className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (authLoading || loadingNotifications) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 lg:px-8 max-w-4xl">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2">Notification Hub</h1>
            <p className="text-muted-foreground">Stay updated on your matrimonial journey.</p>
          </div>
          <Badge variant="outline" className="h-8 px-4 font-bold border-primary/20 bg-primary/5 text-primary">
            {notifications.filter(n => !n.read).length} Unread
          </Badge>
        </header>

        <Card className="border-none shadow-xl overflow-hidden rounded-[2rem] bg-white/50 backdrop-blur-md">
          <CardContent className="p-0">
            {notifications.length > 0 ? (
              <div className="divide-y divide-border/50">
                {notifications.map((notification: any) => (
                  <div 
                    key={notification.id} 
                    className={cn(
                      "flex items-start gap-4 p-6 transition-all hover:bg-muted/30 cursor-pointer",
                      !notification.read ? "bg-primary/[0.03] border-l-4 border-l-primary" : "bg-transparent"
                    )}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  >
                    <div className="mt-1 h-10 w-10 shrink-0 rounded-2xl bg-muted flex items-center justify-center">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className={cn("text-sm font-bold", !notification.read ? "text-foreground" : "text-muted-foreground")}>
                        {notification.title || "Notification"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notification.message || notification.description || "View details in your profile activity stream."}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider pt-1">
                        <Clock className="h-3 w-3" />
                        {notification.createdAt?.toDate() ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/10" 
                            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                       )}
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                        onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <Bell className="h-16 w-16 text-muted-foreground/10 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Your activity stream is empty.</p>
                <p className="text-xs text-muted-foreground mt-2">Interact with members to see notifications here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
