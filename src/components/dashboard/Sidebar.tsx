import { BarChart3, Users, Bell, CreditCard, Home, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const navigation = [
  { name: "Overview", tab: "overview", icon: Home },
  { name: "Attendees", tab: "attendees", icon: Users },
  { name: "Notifications", tab: "notifications", icon: Bell },
  { name: "Expenses", tab: "expenses", icon: CreditCard },
  { name: "Sales Team", tab: "sales-reps", icon: UserCheck },
  { name: "Analytics", tab: "reports", icon: BarChart3 },
];

export function Sidebar({ activeTab = "attendees", onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-gradient-card border-r shadow-dashboard flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Event Intelligence</h1>
            <p className="text-sm text-muted-foreground">AgentJam 2025</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => onTabChange?.(item.tab)}
                className={cn(
                  "w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-dashboard",
                  activeTab === item.tab
                    ? "bg-primary text-primary-foreground shadow-dashboard"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          Last sync: 2 min ago
        </div>
      </div>
    </div>
  );
}