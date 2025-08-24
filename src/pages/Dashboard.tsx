import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { AttendeesTable } from "@/components/dashboard/AttendeesTable";
import { NotificationsLog } from "@/components/dashboard/NotificationsLog";
import { WebhookTester } from "@/components/dashboard/WebhookTester";
import { ApiTester } from "@/components/dashboard/ApiTester";
import { ComprehensiveTestRunner } from "@/components/dashboard/ComprehensiveTestRunner";
import { DevelopmentPlan } from "@/components/dashboard/DevelopmentPlan";
import { AttendeeRegistration } from "@/components/dashboard/AttendeeRegistration";
import SalesRepManager from "@/components/sales/SalesRepManager";
import { ExpensesView } from "@/components/dashboard/ExpensesView";
import { ReportGenerator } from "@/components/dashboard/ReportGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, Session } from '@supabase/supabase-js';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("attendees");
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/auth');
        } else {
          // Defer profile fetching to avoid conflicts
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      } else {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      setProfile(profileData);
    } catch (error) {
      console.log('No profile found, will show onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    if (user) {
      fetchProfile(user.id);
    }
  };

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

  // Show onboarding if user hasn't completed it
  if (!profile?.onboarding_completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center p-4">
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-8">
        <DashboardHeader />
        
        <KPICards />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 lg:w-[1100px]">
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="enrichment-test">Add Attendee</TabsTrigger>
            <TabsTrigger value="sales-reps">Sales Team</TabsTrigger>
            <TabsTrigger value="tester">Test Webhook</TabsTrigger>
            <TabsTrigger value="api-tester">API Tests</TabsTrigger>
            <TabsTrigger value="pipeline-test">Pipeline Test</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab />
          </TabsContent>
          
          <TabsContent value="attendees" className="space-y-6">
            <AttendeesTable />
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <NotificationsLog />
          </TabsContent>
          
          <TabsContent value="expenses" className="space-y-6">
            <ExpensesView />
          </TabsContent>
          
          <TabsContent value="enrichment-test" className="space-y-6">
            <AttendeeRegistration />
          </TabsContent>
          
          <TabsContent value="sales-reps" className="space-y-6">
            <SalesRepManager />
          </TabsContent>
          
          <TabsContent value="tester" className="space-y-6">
            <WebhookTester />
          </TabsContent>
          
          <TabsContent value="api-tester" className="space-y-6">
            <ApiTester />
          </TabsContent>
          
          <TabsContent value="pipeline-test" className="space-y-6">
            <ComprehensiveTestRunner />
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