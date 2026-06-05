'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, CheckCircle2, Heart, MessageSquare, ShieldCheck, User, Clock, CreditCard, Eye, Loader2 } from "lucide-react";
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

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
  }, [db, user]);

  const { data: notifications, loading: loadingNotifications } = useCollection(notificationsQuery);

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
      case 'interest_received': case 'interest_accepted': case 'match_created': return <Heart className="h-5 w-5 text-primary" />;
      case 'message': return <MessageSquare className="h-5 w-5 text-primary" />;
      case 'verification_approved': case 'profile_approved': return <ShieldCheck className="h-5 w-5 text-green-600" />;
      case 'membership_upgraded': return <CreditCard className="h-5 w-5 text-primary" />;
      case 'profile_viewed': return <Eye className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (authLoading || loadingNotifications) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 lg:px-8 max-w-4xl">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold font-headline mb-3 text-primary">Notification Center</h1>
            <p className="text-muted-foreground font-medium">Keep track of your activity and matches.</p>
          </div>
          <Badge variant="outline" className="h-10 px-6 font-bold border-primary/20 bg-primary/5 text-primary rounded-full text-base shadow-sm">
            {notifications.filter(n => !n.read).length} Unread
          </Badge>
        </header>

        <Card className="border-none shadow-2xl overflow-hidden rounded-[3rem] bg-white/40 backdrop-blur-xl border border-white/20">
          <CardContent className="p-0">
            {notifications.length > 0 ? (
              <div className="divide-y divide-border/50">
                {notifications.map((notification: any) => (
                  <div key={notification.id} className={cn("flex items-start gap-6 p-8 transition-all hover:bg-white/60 cursor-pointer group", !notification.read ? "bg-primary/[0.03] border-l-[6px] border-l-primary" : "bg-transparent")} onClick={() => !notification.read && handleMarkAsRead(notification.id)}>
                    <div className="mt-1 h-14 w-14 shrink-0 rounded-[1.25rem] bg-white shadow-md flex items-center justify-center transition-transform group-hover:scale-110">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className={cn("text-lg", !notification.read ? "font-bold text-foreground" : "text-muted-foreground font-medium")}>{notification.title || "Notification"}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium">{notification.message || notification.description || "Interaction details available in activity stream."}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest pt-2 opacity-60">
                        <Clock className="h-3.5 w-3.5" />
                        {notification.createdAt?.toDate() ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                       {!notification.read && (
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary/10 rounded-full" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}><CheckCircle2 className="h-5 w-5" /></Button>
                       )}
                       <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive rounded-full" onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}><Trash2 className="h-5 w-5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center">
                <div className="h-24 w-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8"><Bell className="h-12 w-12 text-primary/20" /></div>
                <p className="text-2xl font-headline font-bold text-primary">Peaceful Moment</p>
                <p className="text-muted-foreground font-medium mt-2">No new notifications at the moment.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}