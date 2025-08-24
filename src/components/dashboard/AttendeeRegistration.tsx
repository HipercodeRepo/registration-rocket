import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RegistrationStep {
  step: string;
  status: 'pending' | 'success' | 'error' | 'running';
  message: string;
  data?: any;
  timestamp?: string;
}

export function AttendeeRegistration() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<RegistrationStep[]>([]);
  const { toast } = useToast();

  const updateStep = (stepName: string, status: 'pending' | 'success' | 'error' | 'running', message: string, data?: any) => {
    setSteps(prev => {
      const existingIndex = prev.findIndex(s => s.step === stepName);
      const newStep: RegistrationStep = {
        step: stepName,
        status,
        message,
        data,
        timestamp: new Date().toLocaleTimeString()
      };
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newStep;
        return updated;
      } else {
        return [...prev, newStep];
      }
    });
  };

  const registerAttendee = async () => {
    if (!name || !email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setSteps([]);

    try {
      // Step 1: Ensure user is authenticated
      updateStep("Authentication", 'running', "Verifying user authentication...");
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        updateStep("Authentication", 'error', "User not authenticated. Please log in first.", userError);
        throw new Error('User not authenticated. Please log in first.');
      }

      updateStep("Authentication", 'success', `✅ Authenticated as ${user.email}`);

      // Step 2: Register attendee via webhook (now requires authentication)
      updateStep("Registration", 'running', "Registering new attendee...");
      
      const attendeeData = {
        event_id: "agentjam-2025",
        registration_id: `reg_${Date.now()}`,
        name,
        email,
        company: company || null,
        title: title || null,
        timestamp: new Date().toISOString()
      };

      console.log('Registering attendee with data:', attendeeData);
      console.log('User authenticated:', user.id);

      // The supabase client automatically includes auth headers for authenticated users
      const { data: webhookResult, error: webhookError } = await supabase.functions.invoke('luma-webhook', {
        body: attendeeData
      });

      console.log('Webhook result:', webhookResult, 'Error:', webhookError);

      if (webhookError) {
        updateStep("Registration", 'error', `Registration failed: ${webhookError.message}`, webhookError);
        throw new Error(`Registration failed: ${webhookError.message}`);
      }

      if (!webhookResult?.success || !webhookResult?.attendee_id) {
        updateStep("Registration", 'error', "Registration failed: Invalid response from webhook", webhookResult);
        throw new Error("Registration failed: Invalid response from webhook");
      }

      updateStep("Registration", 'success', `✅ ${name} registered successfully!`, webhookResult);
      
      const attendeeId = webhookResult.attendee_id;

      // Step 3: Enrichment should auto-trigger from the webhook, let's wait and check
      updateStep("Auto-Enrichment", 'running', "Waiting for automatic enrichment to complete...");
      
      // Wait 3 seconds for enrichment to process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if enrichment completed
      const { data: enrichmentData, error: enrichmentError } = await supabase
        .from('enrichment')
        .select(`
          *,
          lead_scores(*)
        `)
        .eq('attendee_id', attendeeId)
        .single();

      if (enrichmentError || !enrichmentData) {
        updateStep("Auto-Enrichment", 'error', "Enrichment not found, manually triggering...");
        
        // Manually trigger enrichment if it didn't auto-run
        const { data: manualEnrichResult, error: manualEnrichError } = await supabase.functions.invoke('enrich-and-score', {
          body: { attendee_id: attendeeId }
        });

        if (manualEnrichError) {
          updateStep("Auto-Enrichment", 'error', `Manual enrichment failed: ${manualEnrichError.message}`);
          throw new Error(`Enrichment failed: ${manualEnrichError.message}`);
        }

        updateStep("Auto-Enrichment", 'success', `✅ Manual enrichment completed`, manualEnrichResult);
      } else {
        const hasExternalData = enrichmentData.person_json || enrichmentData.company_json || enrichmentData.mixrank_json;
        const leadScores = Array.isArray(enrichmentData.lead_scores) ? enrichmentData.lead_scores : [];
        const leadScore = leadScores[0];
        
        updateStep("Auto-Enrichment", 'success', 
          `✅ Auto-enrichment completed! Score: ${leadScore?.score || 0}/10${hasExternalData ? ' (with external data)' : ' (basic data only)'}`, 
          { enrichmentData, hasExternalData }
        );
      }

      // Step 4: Check for notifications
      updateStep("Notifications", 'running', "Checking if notification was sent...");
      
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('attendee_id', attendeeId)
        .order('sent_at', { ascending: false });

      if (notifications && notifications.length > 0) {
        updateStep("Notifications", 'success', `✅ ${notifications.length} notification(s) sent to sales team`, notifications);
      } else {
        updateStep("Notifications", 'success', "No notifications sent (lead score < 8)", null);
      }

      // Success toast
      toast({
        title: "Registration Complete!",
        description: `${name} has been registered and enriched successfully`,
      });

      // Clear form
      setName("");
      setEmail("");
      setCompany("");
      setTitle("");

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Registration Form */}
      <Card className="gradient-card shadow-dashboard">
        <CardHeader>
          <CardTitle className="dashboard-subheading flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-blue-500" />
            Event Registration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Simulate event registration with automatic enrichment pipeline
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                disabled={isProcessing}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                type="email"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Company</label>
              <Input 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
                disabled={isProcessing}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Job title"
                disabled={isProcessing}
              />
            </div>
          </div>

          <Button 
            onClick={registerAttendee} 
            disabled={isProcessing || !name || !email}
            className="w-full"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Register & Auto-Enrich
          </Button>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Pipeline Flow:</h5>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <div className="flex items-center">
                1. Registration → 
                <ArrowRight className="h-3 w-3 mx-1" />
                2. Auto-Enrichment →
                <ArrowRight className="h-3 w-3 mx-1" />
                3. Lead Scoring →
                <ArrowRight className="h-3 w-3 mx-1" />
                4. Notifications
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Status */}
      <Card className="gradient-card shadow-dashboard">
        <CardHeader>
          <CardTitle className="dashboard-subheading">Pipeline Status</CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time status of the registration and enrichment pipeline
          </p>
        </CardHeader>
        
        <CardContent>
          {steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Fill out the form and register an attendee to see the pipeline in action
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-secondary/20 rounded-md">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">{step.step}</Badge>
                      <Badge variant={
                        step.status === 'success' ? 'default' : 
                        step.status === 'error' ? 'destructive' : 
                        step.status === 'running' ? 'secondary' : 'outline'
                      }>
                        {step.status}
                      </Badge>
                      {step.timestamp && (
                        <span className="text-xs text-muted-foreground">{step.timestamp}</span>
                      )}
                    </div>
                    <p className="text-sm mt-1">{step.message}</p>
                    {step.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">View details</summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-24">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}