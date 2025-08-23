import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getEventKPIs } from "@/lib/server-actions";
import { Skeleton } from "@/components/ui/skeleton";

export function KPICards() {
  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['event-kpis'],
    queryFn: () => getEventKPIs(),
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const kpis = [
    {
      title: "Total Attendees",
      value: kpiData?.data?.totalAttendees?.toString() || "0",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: Users,
      description: "Registered attendees"
    },
    {
      title: "Key Leads",
      value: kpiData?.data?.keyLeads?.toString() || "0",
      change: "+8.2%", 
      changeType: "positive" as const,
      icon: Target,
      description: "High-quality prospects"
    },
    {
      title: "Total Spend",
      value: kpiData?.data?.totalSpend ? `$${(kpiData.data.totalSpend / 100).toLocaleString()}` : "$0",
      change: "-2.1%",
      changeType: "negative" as const,
      icon: DollarSign,
      description: "Event expenses"
    },
    {
      title: "Cost per Lead",
      value: kpiData?.data?.costPerLead ? `$${Math.round(kpiData.data.costPerLead / 100)}` : "$0",
      change: "-5.8%",
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "CPL efficiency"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="gradient-card shadow-dashboard">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="gradient-card shadow-dashboard hover:shadow-dashboard-hover transition-dashboard">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="h-4 w-4 text-dashboard-primary" />
          </CardHeader>
          <CardContent>
            <div className="dashboard-metric">{kpi.value}</div>
            <div className="flex items-center space-x-1 text-xs mt-1">
              {kpi.changeType === "positive" ? (
                <ArrowUpRight className="h-3 w-3 text-dashboard-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-dashboard-danger" />
              )}
              <span className={kpi.changeType === "positive" ? "text-dashboard-success" : "text-dashboard-danger"}>
                {kpi.change}
              </span>
              <span className="text-muted-foreground">{kpi.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}