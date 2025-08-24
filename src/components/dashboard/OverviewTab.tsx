import { KPICards } from "./KPICards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Users, Bell } from "lucide-react";

export function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Event Status
            </CardTitle>
            <CardDescription>Real-time event intelligence overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Data Enrichment</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Lead Scoring</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Notifications</span>
                <span className="text-sm text-green-600">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expense Tracking</span>
                <span className="text-sm text-blue-600">Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common event management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-left">
                <Users className="h-4 w-4" />
                <span className="text-sm">View All Attendees</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-left">
                <Bell className="h-4 w-4" />
                <span className="text-sm">Send Bulk Notification</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-left">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Generate Report</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}