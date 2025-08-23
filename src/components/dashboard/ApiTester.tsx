import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, AlertCircle, Play, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { 
  simulateLumaWebhook, 
  triggerEnrichment, 
  pullBrexExpenses, 
  sendNotification,
  getAttendees 
} from "@/lib/server-actions";

interface ApiTestResult {
  name: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  data?: any;
  timestamp?: string;
}

const API_TESTS = [
  {
    id: 'luma-webhook',
    name: 'Luma Webhook',
    description: 'Simulate event registration',
    icon: '📝'
  },
  {
    id: 'sixtyfour-enrichment', 
    name: 'SixtyFour + MixRank',
    description: 'Test person & company enrichment',
    icon: '🔍'
  },
  {
    id: 'brex-expenses',
    name: 'Brex API',
    description: 'Pull expense data',
    icon: '💰'
  },
  {
    id: 'pylon-notifications',
    name: 'Pylon Notifications',
    description: 'Test Slack/Teams alerts',
    icon: '🔔'
  }
];

const TEST_ATTENDEE = {
  name: "Sarah Chen",
  email: "sarah.chen@stripe.com", 
  title: "VP Engineering",
  company: "Stripe"
};

export function ApiTester() {
  const [results, setResults] = useState<Record<string, ApiTestResult>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [currentAttendeeId, setCurrentAttendeeId] = useState<string | null>(null);
  const { toast } = useToast();

  const updateResult = (testId: string, update: Partial<ApiTestResult>) => {
    setResults(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        name: API_TESTS.find(t => t.id === testId)?.name || testId,
        ...update,
        timestamp: new Date().toLocaleTimeString()
      }
    }));
  };

  const runSingleTest = async (testId: string) => {
    updateResult(testId, { status: 'loading', message: 'Running...' });

    try {
      switch (testId) {
        case 'luma-webhook':
          const webhookResult = await simulateLumaWebhook(TEST_ATTENDEE);
          if (webhookResult.success) {
            setCurrentAttendeeId(webhookResult.data?.attendee_id);
            updateResult(testId, {
              status: 'success',
              message: `✅ Registration processed for ${TEST_ATTENDEE.name}`,
              data: webhookResult.data
            });
          } else {
            throw new Error(webhookResult.error || 'Unknown error');
          }
          break;

        case 'sixtyfour-enrichment':
          if (!currentAttendeeId) {
            // First try to get the latest attendee
            const attendeesResult = await getAttendees();
            if (attendeesResult.success && attendeesResult.data?.[0]) {
              setCurrentAttendeeId(attendeesResult.data[0].id);
            } else {
              throw new Error('No attendee found. Run Luma Webhook test first.');
            }
          }

          const enrichmentResult = await triggerEnrichment(currentAttendeeId);
          if (enrichmentResult.success) {
            updateResult(testId, {
              status: 'success',
              message: '🔍 Enrichment triggered → SixtyFour + MixRank + AI scoring',
              data: enrichmentResult.data
            });
          } else {
            throw new Error(enrichmentResult.error || 'Enrichment failed');
          }
          break;

        case 'brex-expenses':
          const expensesResult = await pullBrexExpenses('agentjam-2025');
          if (expensesResult.success) {
            updateResult(testId, {
              status: 'success',
              message: `💰 Pulled $${expensesResult.data?.total_spent || 0} from ${expensesResult.data?.transaction_count || 0} transactions`,
              data: expensesResult.data
            });
          } else {
            throw new Error(expensesResult.error || 'Brex API failed');
          }
          break;

        case 'pylon-notifications':
          if (!currentAttendeeId) {
            throw new Error('No attendee found. Run previous tests first.');
          }

          const notificationResult = await sendNotification(currentAttendeeId);
          if (notificationResult.success) {
            updateResult(testId, {
              status: 'success',
              message: '🔔 Notification sent via Pylon → Slack/Teams',
              data: notificationResult.data
            });
          } else {
            throw new Error(notificationResult.error || 'Notification failed');
          }
          break;

        default:
          throw new Error(`Unknown test: ${testId}`);
      }
    } catch (error: any) {
      updateResult(testId, {
        status: 'error',
        message: `❌ ${error.message}`
      });
      
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    toast({
      title: "Starting Full API Test",
      description: "Testing complete event intelligence pipeline...",
    });

    // Run tests sequentially to maintain proper flow
    for (const test of API_TESTS) {
      await runSingleTest(test.id);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsRunningAll(false);
    
    const successCount = Object.values(results).filter(r => r.status === 'success').length;
    toast({
      title: "All Tests Complete",
      description: `${successCount}/${API_TESTS.length} tests passed`,
      variant: successCount === API_TESTS.length ? "default" : "destructive"
    });
  };

  const getOverallProgress = () => {
    const completed = Object.values(results).filter(r => r.status !== 'idle' && r.status !== 'loading').length;
    return Math.round((completed / API_TESTS.length) * 100);
  };

  return (
    <Card className="gradient-card shadow-dashboard">
      <CardHeader>
        <CardTitle className="dashboard-subheading flex items-center justify-between">
          API Integration Tester
          <Button
            onClick={runAllTests}
            disabled={isRunningAll}
            variant="default"
            size="sm"
          >
            {isRunningAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Test All APIs
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the complete Event Intelligence pipeline: Registration → Enrichment → Scoring → Notifications
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{getOverallProgress()}%</span>
          </div>
          <Progress value={getOverallProgress()} className="h-2" />
        </div>

        {/* Test Sample Info */}
        <div className="bg-secondary/30 p-3 rounded-md">
          <div className="text-sm font-medium mb-1">Test Sample:</div>
          <div className="text-xs text-muted-foreground">
            {TEST_ATTENDEE.name} • {TEST_ATTENDEE.email} • {TEST_ATTENDEE.title} @ {TEST_ATTENDEE.company}
          </div>
        </div>

        {/* Individual API Tests */}
        <div className="grid gap-4">
          {API_TESTS.map((test) => {
            const result = results[test.id];
            const status = result?.status || 'idle';
            
            return (
              <div key={test.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="text-2xl">{test.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{test.name}</h4>
                    <Badge variant={
                      status === 'success' ? 'default' : 
                      status === 'error' ? 'destructive' : 
                      status === 'loading' ? 'secondary' : 'outline'
                    }>
                      {status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{test.description}</p>
                  {result?.message && (
                    <p className="text-sm mt-1 font-mono">{result.message}</p>
                  )}
                  {result?.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last run: {result.timestamp}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {status === 'success' && <CheckCircle className="h-4 w-4 text-dashboard-success" />}
                  {status === 'error' && <AlertCircle className="h-4 w-4 text-dashboard-danger" />}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runSingleTest(test.id)}
                    disabled={status === 'loading' || isRunningAll}
                  >
                    Test
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://supabase.com/dashboard/project/vrgmphxnizephwqyduak/functions', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View Function Logs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://supabase.com/dashboard/project/vrgmphxnizephwqyduak/editor', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Database Editor
          </Button>
          <Button
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            🔄 Refresh Dashboard
          </Button>
        </div>

        {/* Data Flow Diagram */}
        <div className="bg-secondary/20 p-4 rounded-lg">
          <h5 className="font-medium mb-2">Data Flow:</h5>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>1. 📝 Luma Webhook → Store attendee in database</div>
            <div>2. 🔍 Auto-trigger SixtyFour + MixRank enrichment</div>
            <div>3. 🧠 AI scoring based on enriched profile</div>
            <div>4. 🔔 If key lead (score ≥ 8) → Pylon notification to sales</div>
            <div>5. 💰 Brex expense sync for cost-per-lead calculation</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}