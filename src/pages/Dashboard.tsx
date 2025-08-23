import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { AttendeesTable } from "@/components/dashboard/AttendeesTable";
import { NotificationsLog } from "@/components/dashboard/NotificationsLog";
import { WebhookTester } from "@/components/dashboard/WebhookTester";
import { ExpensesView } from "@/components/dashboard/ExpensesView";
import { ReportGenerator } from "@/components/dashboard/ReportGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, Session } from '@supabase/supabase-js';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (!session) {
          navigate('/auth');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <DashboardHeader />
        
        <KPICards />
        
        <Tabs defaultValue="attendees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="tester">Test Webhook</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendees" className="space-y-6">
            <AttendeesTable />
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <NotificationsLog />
          </TabsContent>
          
          <TabsContent value="expenses" className="space-y-6">
            <ExpensesView />
          </TabsContent>
          
          <TabsContent value="tester" className="space-y-6">
            <WebhookTester />
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-6">
            <ReportGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;