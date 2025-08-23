import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, MessageSquare, Slack, Users } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "slack",
    message: "New high-value lead: Sarah Chen (VP Engineering @ TechCorp)",
    recipient: "#sales-team", 
    timestamp: "2 minutes ago",
    leadName: "Sarah Chen",
    status: "delivered"
  },
  {
    id: 2,
    type: "slack",
    message: "Key prospect alert: Marcus Rodriguez (CEO @ Startup AI)",
    recipient: "#founders-channel",
    timestamp: "15 minutes ago", 
    leadName: "Marcus Rodriguez",
    status: "delivered"
  },
  {
    id: 3,
    type: "teams",
    message: "Follow-up reminder: David Kim (CTO @ Enterprise Solutions)",
    recipient: "Sales Team",
    timestamp: "1 hour ago",
    leadName: "David Kim", 
    status: "delivered"
  },
  {
    id: 4,
    type: "slack",
    message: "Lead enrichment complete for batch #247",
    recipient: "#operations",
    timestamp: "2 hours ago",
    leadName: "Batch Processing",
    status: "delivered"
  }
];

function getNotificationIcon(type: string) {
  switch (type) {
    case "slack":
      return <Slack className="h-4 w-4 text-[#4A154B]" />;
    case "teams":
      return <Users className="h-4 w-4 text-[#6264A7]" />;
    default:
      return <MessageSquare className="h-4 w-4 text-dashboard-primary" />;
  }
}

export function NotificationsLog() {
  return (
    <Card className="gradient-card shadow-dashboard">
      <CardHeader>
        <CardTitle className="dashboard-subheading">Notifications Log</CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time alerts sent to sales teams
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-secondary/30 transition-dashboard">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {notification.message}
                  </p>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {notification.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Sent to {notification.recipient}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {notification.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}