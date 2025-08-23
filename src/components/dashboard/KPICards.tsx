import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

const kpis = [
  {
    title: "Total Attendees",
    value: "1,247",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: Users,
    description: "Registered attendees"
  },
  {
    title: "Key Leads",
    value: "89",
    change: "+8.2%", 
    changeType: "positive" as const,
    icon: Target,
    description: "High-quality prospects"
  },
  {
    title: "Total Spend",
    value: "$24,567",
    change: "-2.1%",
    changeType: "negative" as const,
    icon: DollarSign,
    description: "Event expenses"
  },
  {
    title: "Cost per Lead",
    value: "$276",
    change: "-5.8%",
    changeType: "positive" as const,
    icon: TrendingUp,
    description: "CPL efficiency"
  }
];

export function KPICards() {
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