import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, AlertCircle, Play, Eye, Database, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { 
  simulateLumaWebhook, 
  getAttendees, 
  getEventKPIs,
  getNotifications,
  pullBrexExpenses
} from "@/lib/server-actions";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  data?: any;
  timestamp?: string;
  duration?: number;
}

interface TestCase {
  name: string;
  email: string;
  title: string;
  company: string;
  expectedScore?: number;
  description: string;
}

const TEST_CASES: TestCase[] = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@stripe.com",
    title: "VP Engineering", 
    company: "Stripe",
    expectedScore: 9,
    description: "High-value fintech executive - should score 8+"
  },
  {
    name: "Michael Rodriguez", 
    email: "m.rodriguez@github.com",
    title: "Senior Product Manager",
    company: "GitHub",
    expectedScore: 7,
    description: "Mid-level tech company PM - should score 6-8"
  },
  {
    name: "Jane Smith",
    email: "jane@startupxyz.com", 
    title: "Founder & CEO",
    company: "StartupXYZ",
    expectedScore: 6,
    description: "Startup founder - should score 5-7"
  }
];

export function ComprehensiveTestRunner() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [isRunningFull, setIsRunningFull] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase>(TEST_CASES[0]);
  const [currentStep, setCurrentStep] = useState(0);
  const [databaseData, setDatabaseData] = useState<any>(null);
  const { toast } = useToast();

  const updateResult = (id: string, update: Partial<TestResult>) => {
    setResults(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        id,
        ...update,
        timestamp: new Date().toLocaleTimeString()
      }
    }));
  };

  const checkDatabaseState = async () => {
    try {
      const [attendees, kpis, notifications] = await Promise.all([
        supabase.from('attendees').select('*').order('registered_at', { ascending: false }).limit(5),
        supabase.from('enrichment').select('*').limit(5),
        supabase.from('lead_scores').select('*').limit(5),
        supabase.from('notifications').select('*').limit(5)
      ]);

      setDatabaseData({
        attendees: attendees.data || [],
        enrichment: (await supabase.from('enrichment').select('*').limit(5)).data || [],
        lead_scores: (await supabase.from('lead_scores').select('*').limit(5)).data || [],
        notifications: (await supabase.from('notifications').select('*').limit(5)).data || []
      });
    } catch (error) {
      console.error('Error checking database:', error);
    }
  };

  const runFullPipelineTest = async (testCase: TestCase) => {
    setIsRunningFull(true);
    setCurrentStep(0);
    const startTime = Date.now();

    try {
      // Step 1: Luma Webhook Simulation
      setCurrentStep(1);
      updateResult('step-1', { 
        name: 'Luma Webhook Simulation',
        status: 'running', 
        message: `Registering ${testCase.name}...` 
      });

      const webhookResult = await simulateLumaWebhook(testCase);
      if (!webhookResult.success) {
        throw new Error(`Webhook failed: ${webhookResult.error}`);
      }

      updateResult('step-1', {
        name: 'Luma Webhook Simulation',
        status: 'success',
        message: `✅ ${testCase.name} registered successfully`,
        data: webhookResult.data,
        duration: Date.now() - startTime
      });

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Check Database State
      setCurrentStep(2);
      updateResult('step-2', {
        name: 'Database Verification',
        status: 'running',
        message: 'Checking if attendee was saved...'
      });

      await checkDatabaseState();
      const attendeesResult = await getAttendees();
      
      if (attendeesResult.success && attendeesResult.data?.length > 0) {
        updateResult('step-2', {
          name: 'Database Verification', 
          status: 'success',
          message: `✅ Found ${attendeesResult.data.length} attendees in database`,
          data: attendeesResult.data[0]
        });
      } else {
        throw new Error('No attendees found in database');
      }

      // Step 3: Check Enrichment
      setCurrentStep(3);
      updateResult('step-3', {
        name: 'Enrichment Check',
        status: 'running',
        message: 'Checking if enrichment was triggered...'
      });

      // Wait for enrichment to process
      await new Promise(resolve => setTimeout(resolve, 3000));

      const enrichmentCheck = await supabase
        .from('enrichment')
        .select('*')
        .order('enriched_at', { ascending: false })
        .limit(1);

      if (enrichmentCheck.data && enrichmentCheck.data.length > 0) {
        updateResult('step-3', {
          name: 'Enrichment Check',
          status: 'success', 
          message: `✅ Enrichment data found`,
          data: enrichmentCheck.data[0]
        });
      } else {
        updateResult('step-3', {
          name: 'Enrichment Check',
          status: 'error',
          message: `⚠️ No enrichment data found - check API keys and function logs`
        });
      }

      // Step 4: Check Lead Scoring
      setCurrentStep(4);
      updateResult('step-4', {
        name: 'Lead Scoring Check',
        status: 'running',
        message: 'Checking lead score calculation...'
      });

      const scoringCheck = await supabase
        .from('lead_scores')
        .select('*')
        .order('attendee_id', { ascending: false })
        .limit(1);

      if (scoringCheck.data && scoringCheck.data.length > 0) {
        const score = scoringCheck.data[0];
        updateResult('step-4', {
          name: 'Lead Scoring Check',
          status: 'success',
          message: `✅ Lead score: ${score.score}/10 ${score.is_key_lead ? '(Key Lead!)' : ''}`,
          data: score
        });
      } else {
        updateResult('step-4', {
          name: 'Lead Scoring Check', 
          status: 'error',
          message: `⚠️ No lead score found - scoring function may have failed`
        });
      }

      // Step 5: Check Notifications  
      setCurrentStep(5);
      updateResult('step-5', {
        name: 'Notification Check',
        status: 'running',
        message: 'Checking if notifications were sent...'
      });

      const notificationCheck = await supabase
        .from('notifications')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(1);

      if (notificationCheck.data && notificationCheck.data.length > 0) {
        updateResult('step-5', {
          name: 'Notification Check',
          status: 'success',
          message: `✅ Notification sent via ${notificationCheck.data[0].channel}`,
          data: notificationCheck.data[0]
        });
      } else {
        updateResult('step-5', {
          name: 'Notification Check',
          status: 'error', 
          message: `⚠️ No notifications found - check Pylon API key`
        });
      }

      toast({
        title: "Pipeline Test Complete",
        description: `Tested ${testCase.name} - check results above`,
      });

    } catch (error: any) {
      updateResult(`step-${currentStep}`, {
        name: `Step ${currentStep}`,
        status: 'error',
        message: `❌ ${error.message}`
      });
      
      toast({
        title: "Test Failed", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunningFull(false);
      setCurrentStep(0);
      await checkDatabaseState();
    }
  };

  const clearAllData = async () => {
    try {
      await Promise.all([
        supabase.from('notifications').delete().gte('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('lead_scores').delete().gte('attendee_id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('enrichment').delete().gte('attendee_id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('attendees').delete().gte('id', '00000000-0000-0000-0000-000000000000')
      ]);
      
      setDatabaseData(null);
      setResults({});
      toast({
        title: "Database Cleared",
        description: "All test data removed"
      });
    } catch (error: any) {
      toast({
        title: "Clear Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Case Selection */}
      <Card className="gradient-card shadow-dashboard">
        <CardHeader>
          <CardTitle className="dashboard-subheading flex items-center justify-between">
            Pipeline Test Runner
            <div className="flex gap-2">
              <Button
                onClick={() => runFullPipelineTest(selectedTestCase)}
                disabled={isRunningFull}
                size="sm"
              >
                {isRunningFull ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Test Full Pipeline
              </Button>
              <Button
                onClick={clearAllData}
                disabled={isRunningFull}
                variant="outline"
                size="sm"
              >
                Clear Data
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {TEST_CASES.map((testCase, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTestCase === testCase 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:bg-secondary/30'
                }`}
                onClick={() => setSelectedTestCase(testCase)}
              >
                <div className="font-medium">{testCase.name}</div>
                <div className="text-sm text-muted-foreground">{testCase.title}</div>
                <div className="text-sm text-muted-foreground">{testCase.company}</div>
                <div className="text-xs text-muted-foreground mt-1">{testCase.description}</div>
              </div>
            ))}
          </div>
          
          {isRunningFull && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Step {currentStep}/5</span>
                <span>{Math.round((currentStep / 5) * 100)}%</span>
              </div>
              <Progress value={(currentStep / 5) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card className="gradient-card shadow-dashboard">
        <CardHeader>
          <CardTitle className="dashboard-subheading">Pipeline Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(stepNum => {
              const result = results[`step-${stepNum}`];
              const stepNames = {
                1: 'Luma Webhook Simulation',
                2: 'Database Verification', 
                3: 'Enrichment Check',
                4: 'Lead Scoring Check',
                5: 'Notification Check'
              };

              return (
                <div key={stepNum} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center">
                    {result?.status === 'success' && <CheckCircle className="h-5 w-5 text-dashboard-success" />}
                    {result?.status === 'error' && <AlertCircle className="h-5 w-5 text-dashboard-danger" />} 
                    {result?.status === 'running' && <Loader2 className="h-5 w-5 animate-spin" />}
                    {!result?.status && <span className="text-sm">{stepNum}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{stepNames[stepNum as keyof typeof stepNames]}</h4>
                      {result?.status && (
                        <Badge variant={
                          result.status === 'success' ? 'default' :
                          result.status === 'error' ? 'destructive' : 'secondary'
                        }>
                          {result.status}
                        </Badge>
                      )}
                    </div>
                    {result?.message && (
                      <p className="text-sm mt-1 font-mono">{result.message}</p>
                    )}
                    {result?.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.timestamp} {result.duration && `(${result.duration}ms)`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Database State */}
      <Card className="gradient-card shadow-dashboard">
        <CardHeader>
          <CardTitle className="dashboard-subheading flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database State
            <Button
              onClick={checkDatabaseState}
              variant="outline"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{databaseData?.attendees?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Attendees</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{databaseData?.enrichment?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Enrichments</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{databaseData?.lead_scores?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Lead Scores</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{databaseData?.notifications?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Notifications</div>
            </div>
          </div>

          {databaseData?.attendees?.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium mb-2">Latest Attendee:</h5>
              <pre className="text-xs bg-secondary/30 p-2 rounded overflow-auto">
                {JSON.stringify(databaseData.attendees[0], null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="gradient-card shadow-dashboard">
        <CardHeader>
          <CardTitle className="dashboard-subheading">Debug Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://supabase.com/dashboard/project/vrgmphxnizephwqyduak/functions/luma-webhook/logs', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Webhook Logs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://supabase.com/dashboard/project/vrgmphxnizephwqyduak/functions/enrich-and-score/logs', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Enrichment Logs
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
              onClick={() => window.open('https://supabase.com/dashboard/project/vrgmphxnizephwqyduak/settings/functions', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Function Secrets
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}