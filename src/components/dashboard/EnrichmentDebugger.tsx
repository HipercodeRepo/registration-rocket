import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DebugResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export function EnrichmentDebugger() {
  const [email, setEmail] = useState("alex@airbnb.com");
  const [name, setName] = useState("Alex Rodriguez");
  const [company, setCompany] = useState("Airbnb");
  const [isDebugging, setIsDebugging] = useState(false);
  const [results, setResults] = useState<DebugResult[]>([]);
  const { toast } = useToast();

  const addResult = (step: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    setResults(prev => [...prev, { step, status, message, data }]);
  };

  const debugEnrichment = async () => {
    setIsDebugging(true);
    setResults([]);

    try {
      // Step 1: Test direct API call to enrichment function
      addResult("API Call", 'pending', "Calling enrich-and-score function...");
      
      const { data: enrichResult, error: enrichError } = await supabase.functions.invoke('enrich-and-score', {
        body: {
          name,
          email,
          company,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (enrichError) {
        addResult("API Call", 'error', `Edge function error: ${enrichError.message}`, enrichError);
        return;
      }

      addResult("API Call", 'success', `Function executed successfully`, enrichResult);

      // Step 2: Check what data was actually stored
      addResult("Database Check", 'pending', "Checking stored enrichment data...");
      
      const { data: dbData, error: dbError } = await supabase
        .from('enrichment')
        .select('*')
        .eq('attendee_id', enrichResult.attendee_id)
        .single();

      if (dbError) {
        addResult("Database Check", 'error', `Database error: ${dbError.message}`, dbError);
        return;
      }

      // Step 3: Analyze what external APIs returned
      const hasPersonData = dbData.person_json !== null;
      const hasCompanyData = dbData.company_json !== null;
      const hasMixRankData = dbData.mixrank_json !== null;

      if (!hasPersonData && !hasCompanyData && !hasMixRankData) {
        addResult("API Analysis", 'error', "❌ ALL external APIs failed - no enrichment data", {
          person_data: hasPersonData,
          company_data: hasCompanyData,
          mixrank_data: hasMixRankData
        });
      } else {
        addResult("API Analysis", 'success', `✅ Partial success - Person: ${hasPersonData}, Company: ${hasCompanyData}, MixRank: ${hasMixRankData}`, {
          person_json: dbData.person_json,
          company_json: dbData.company_json,
          mixrank_json: dbData.mixrank_json
        });
      }

      // Step 4: Check lead scoring
      const { data: scoreData } = await supabase
        .from('lead_scores')
        .select('*')
        .eq('attendee_id', enrichResult.attendee_id)
        .single();

      if (scoreData) {
        addResult("Lead Scoring", 'success', `Score: ${scoreData.score}/10 - ${scoreData.reason}`, scoreData);
      } else {
        addResult("Lead Scoring", 'error', "No lead score found", null);
      }

    } catch (error: any) {
      addResult("Debug Error", 'error', error.message, error);
      toast({
        title: "Debug Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <Card className="gradient-card shadow-dashboard">
      <CardHeader>
        <CardTitle className="dashboard-subheading flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
          Enrichment Debugger
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Debug why SixtyFour and MixRank APIs aren't returning data
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@company.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Company</label>
            <Input 
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
            />
          </div>
        </div>

        <Button 
          onClick={debugEnrichment} 
          disabled={isDebugging || !email || !name}
          className="w-full"
        >
          {isDebugging ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4 mr-2" />
          )}
          Debug Enrichment Process
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Debug Results:</h4>
            {results.map((result, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-secondary/20 rounded-md">
                <div className="flex-shrink-0 mt-0.5">
                  {result.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {result.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {result.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">{result.step}</Badge>
                    <Badge variant={
                      result.status === 'success' ? 'default' : 
                      result.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {result.status}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1">{result.message}</p>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">Show data</summary>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
          <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-1">Common Issues:</h5>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li>• Missing or invalid SixtyFour API key</li>
            <li>• Missing or invalid MixRank API key</li>
            <li>• API rate limits exceeded</li>
            <li>• Network connectivity issues</li>
            <li>• API endpoint changes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}