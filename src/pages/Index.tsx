import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { AttendeesTable } from "@/components/dashboard/AttendeesTable";
import { NotificationsLog } from "@/components/dashboard/NotificationsLog";
import { ExpensesView } from "@/components/dashboard/ExpensesView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <DashboardHeader />
        
        <KPICards />
        
        <Tabs defaultValue="attendees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Index;
