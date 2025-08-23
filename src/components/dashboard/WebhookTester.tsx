import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { simulateLumaWebhook, pullBrexExpenses, triggerEnrichment } from "@/lib/server-actions";

interface TestResult {
  status: 'success' | 'error';
  message: string;
  attendee_id?: string;
}

const sampleAttendees = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@stripe.com",
    title: "VP Engineering", 
    company: "Stripe"
  },
  {
    name: "Brian Chesky", 
    email: "brian@airbnb.com",
    title: "Co-founder & CEO",
    company: "Airbnb"
  },
  {
    name: "Satya Nadella",
    email: "satya@microsoft.com", 
    title: "CEO",
    company: "Microsoft"
  },
  {
    name: "Jensen Huang",
    email: "jensen@nvidia.com",
    title: "Founder & CEO", 
    company: "NVIDIA"
  }
];

export function WebhookTester() {
  const [formData, setFormData] = useState({
    name: "",
    email: "", 
    title: "",
    company: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await simulateLumaWebhook(formData);
      
      if (result.success) {
        const newResult: TestResult = {
          status: 'success',
          message: `Registration processed for ${formData.name}`,
          attendee_id: result.data?.attendee_id
        };
        setResults(prev => [newResult, ...prev.slice(0, 4)]);
        
        toast({
          title: "Registration Successful",
          description: "Attendee added and enrichment triggered",
        });
        
        // Clear form
        setFormData({ name: "", email: "", title: "", company: "" });
      } else {
        const newResult: TestResult = {
          status: 'error',
          message: result.error || 'Registration failed'
        };
        setResults(prev => [newResult, ...prev.slice(0, 4)]);
        
        toast({
          title: "Registration Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      const newResult: TestResult = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      setResults(prev => [newResult, ...prev.slice(0, 4)]);
      
      toast({
        title: "Error",
        description: "Failed to process registration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTest = async (attendee: any) => {
    setIsLoading(true);
    
    try {
      const result = await simulateLumaWebhook(attendee);
      
      if (result.success) {
        const newResult: TestResult = {
          status: 'success',
          message: `✅ ${attendee.name} registered → SixtyFour + MixRank enrichment triggered`,
          attendee_id: result.data?.attendee_id
        };
        setResults(prev => [newResult, ...prev.slice(0, 4)]);
        
        toast({
          title: "Full Pipeline Test Successful",
          description: `${attendee.name} → Enrichment → Scoring → Notifications`,
        });
      } else {
        const newResult: TestResult = {
          status: 'error',
          message: `❌ Test failed: ${result.error}`
        };
        setResults(prev => [newResult, ...prev.slice(0, 4)]);
        
        toast({
          title: "Quick Test Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      const newResult: TestResult = {
        status: 'error',
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      setResults(prev => [newResult, ...prev.slice(0, 4)]);
      
      toast({
        title: "Error",
        description: "Quick test failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testBrexExpenses = async () => {
    setIsLoading(true);
    try {
      const result = await pullBrexExpenses('agentjam-2025');
      
      if (result.success) {
        const newResult: TestResult = {
          status: 'success',
          message: `💰 Brex API: $${result.data?.total_spent || 0} from ${result.data?.transaction_count || 0} transactions`
        };
        setResults(prev => [newResult, ...prev.slice(0, 4)]);
        toast({
          title: "Brex Test Successful",
          description: `Pulled expense data from Brex API`,
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: any) {
      const newResult: TestResult = {
        status: 'error',
        message: `❌ Brex API failed: ${error.message}`
      };
      setResults(prev => [newResult, ...prev.slice(0, 4)]);
      toast({
        title: "Brex Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="gradient-card shadow-dashboard">
      <CardHeader>
        <CardTitle className="dashboard-subheading">Webhook Tester</CardTitle>
        <p className="text-sm text-muted-foreground">
          Simulate Luma event registrations to test the enrichment flow
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manual Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@company.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Software Engineer"
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Tech Corp"
              />
            </div>
          </div>
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Simulate Registration
          </Button>
        </form>

        {/* API Integration Tests */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Quick Registration Tests</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Tests full flow: Webhook → SixtyFour → MixRank → Scoring → Notifications
            </p>
            <div className="grid grid-cols-2 gap-2">
              {sampleAttendees.map((attendee, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickTest(attendee)}
                  disabled={isLoading}
                  className="justify-start text-left"
                >
                  <div className="truncate">
                    <div className="font-medium">{attendee.name}</div>
                    <div className="text-xs text-muted-foreground">{attendee.company}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">API Tests</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={testBrexExpenses}
                disabled={isLoading}
              >
                💰 Test Brex
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard/project/vrgmphxnizephwqyduak/functions', '_blank')}
              >
                📊 View Logs
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                🔄 Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Results Log */}
        {results.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Recent Tests</Label>
            <div className="space-y-2 mt-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 rounded-md bg-secondary/30"
                >
                  {result.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-dashboard-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-dashboard-danger" />
                  )}
                  <span className="text-sm flex-1">{result.message}</span>
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}