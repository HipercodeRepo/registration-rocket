import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, MessageSquare, Slack, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "@/lib/server-actions";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
    refetchInterval: 30000,
  });

  const notifications = notificationsData?.data || [];

  if (isLoading) {
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
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card shadow-dashboard">
      <CardHeader>
        <CardTitle className="dashboard-subheading">Notifications Log</CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time alerts sent to sales teams ({notifications.length} total)
        </p>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No notifications sent yet. High-scoring leads will trigger automatic alerts.
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-secondary/30 transition-dashboard">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.channel)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {notification.message}
                    </p>
                    <Badge variant="outline" className="ml-2 text-xs">
                      Delivered
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Sent to {notification.destination}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.sent_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}