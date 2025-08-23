import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, Settings } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="dashboard-heading">Event Intelligence Dashboard</h1>
        <div className="flex items-center space-x-4 mt-2">
          <p className="text-muted-foreground">AgentJam 2025 • San Francisco</p>
          <Badge className="bg-dashboard-success/10 text-dashboard-success">
            Live Event
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Data
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button className="gradient-primary text-white shadow-dashboard hover:shadow-dashboard-hover">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );
}