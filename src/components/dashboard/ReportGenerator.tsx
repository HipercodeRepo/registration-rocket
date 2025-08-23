import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateEventReport } from "@/lib/server-actions";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Loader2 } from "lucide-react";

export const ReportGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastReport, setLastReport] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const result = await generateEventReport("agentjam-2025");
      if (result.success) {
        setLastReport(result.data);
        toast({
          title: "Report Generated",
          description: "Event intelligence report ready for review",
        });
      } else {
        throw new Error(result.error || "Failed to generate report");
      }
    } catch (error: any) {
      toast({
        title: "Report Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!lastReport) return;
    
    const reportContent = `
EVENT INTELLIGENCE REPORT
Generated: ${new Date(lastReport.generatedAt).toLocaleString()}

EVENT OVERVIEW
==============
Event ID: ${lastReport.eventId}
Total Attendees: ${lastReport.totalAttendees}
Key Leads: ${lastReport.keyLeads}
Total Spend: $${lastReport.totalSpend.toFixed(2)}
Cost Per Lead: $${lastReport.costPerLead}

TOP COMPANIES
=============
${lastReport.topCompanies.map((company: string, i: number) => `${i + 1}. ${company}`).join('\n')}

RECOMMENDATIONS
===============
${lastReport.recommendations.map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}

SUMMARY
=======
${lastReport.summary}

--
Powered by Event Intelligence Agent
Generated at ${new Date().toISOString()}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-report-${lastReport.eventId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Event report downloaded successfully",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Event Intelligence Report
          </CardTitle>
          <CardDescription>
            Generate comprehensive event summary with attendee insights and ROI metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateReport} 
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {isGenerating ? "Generating..." : "Generate Report"}
            </Button>
            
            {lastReport && (
              <Button variant="outline" onClick={downloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            )}
          </div>

          {lastReport && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{lastReport.totalAttendees}</div>
                  <div className="text-sm text-muted-foreground">Total Attendees</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{lastReport.keyLeads}</div>
                  <div className="text-sm text-muted-foreground">Key Leads</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">${lastReport.totalSpend.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Total Spend</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">${lastReport.costPerLead}</div>
                  <div className="text-sm text-muted-foreground">Cost/Lead</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Top Companies</h4>
                <div className="flex flex-wrap gap-2">
                  {lastReport.topCompanies.slice(0, 5).map((company: string, i: number) => (
                    <Badge key={i} variant="secondary">
                      {company}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">AI Recommendations</h4>
                <ul className="space-y-1 text-sm">
                  {lastReport.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};