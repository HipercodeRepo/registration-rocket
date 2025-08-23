import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, RefreshCw, Settings, User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function DashboardHeader() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="dashboard-heading">Event Intelligence Agent</h1>
        <div className="flex items-center space-x-4 mt-2">
          <p className="text-muted-foreground">AgentJam 2025 • Real-time Analytics</p>
          <Badge className="bg-dashboard-success/10 text-dashboard-success border-dashboard-success/20">
            Live Event
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <ThemeToggle />
        <Button variant="outline" size="sm" className="border-border/50">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Data
        </Button>
        <Button variant="outline" size="sm" className="border-border/50">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button className="bg-dashboard-primary hover:bg-dashboard-primary/90 text-white shadow-dashboard hover:shadow-dashboard-hover">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-sm">{user?.email || 'User'}</p>
                <p className="w-[200px] truncate text-xs text-muted-foreground">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}