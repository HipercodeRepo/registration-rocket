import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  GitBranch,
  Target,
  Zap,
  Database,
  Cloud,
  Users,
  DollarSign,
  Bell
} from "lucide-react";

interface FeatureStatus {
  name: string;
  description: string;
  status: 'complete' | 'partial' | 'pending' | 'issue';
  progress: number;
  issues?: string[];
  nextSteps?: string[];
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

const FEATURES: FeatureStatus[] = [
  {
    name: "Database Schema",
    description: "Core tables for attendees, enrichment, lead scores, notifications",
    status: 'complete',
    progress: 100,
    priority: 'high',
    icon: <Database className="h-5 w-5" />
  },
  {
    name: "Luma Webhook Handler", 
    description: "Receives and processes event registrations",
    status: 'complete',
    progress: 100,
    issues: ["Need to test with real Luma webhooks", "Error handling could be improved"],
    priority: 'high',
    icon: <Cloud className="h-5 w-5" />
  },
  {
    name: "SixtyFour Enrichment",
    description: "Person data enrichment via SixtyFour API",
    status: 'partial',
    progress: 70,
    issues: ["API key needs verification", "Response format needs validation", "Rate limiting not implemented"],
    nextSteps: ["Test with real API key", "Add response validation", "Add retry logic"],
    priority: 'high',
    icon: <Users className="h-5 w-5" />
  },
  {
    name: "MixRank Company Data",
    description: "Company enrichment via MixRank API", 
    status: 'partial',
    progress: 70,
    issues: ["API key needs verification", "Domain extraction logic needed", "Error handling incomplete"],
    nextSteps: ["Test domain extraction", "Add company matching logic", "Handle API failures"],
    priority: 'high',
    icon: <Target className="h-5 w-5" />
  },
  {
    name: "Lead Scoring Algorithm",
    description: "AI-powered lead scoring based on enriched data",
    status: 'complete',
    progress: 90,
    issues: ["Scoring weights need tuning based on real data"],
    nextSteps: ["Test with diverse attendee profiles", "Fine-tune scoring algorithm"],
    priority: 'medium',
    icon: <Zap className="h-5 w-5" />
  },
  {
    name: "Pylon Notifications", 
    description: "Real-time Slack/Teams notifications for key leads",
    status: 'partial',
    progress: 60,
    issues: ["API key needs verification", "Message formatting needs improvement", "Channel routing not implemented"],
    nextSteps: ["Test notification delivery", "Add message templates", "Support multiple channels"],
    priority: 'high', 
    icon: <Bell className="h-5 w-5" />
  },
  {
    name: "Brex Expense Integration",
    description: "Sync event expenses and calculate cost-per-lead",
    status: 'partial',
    progress: 50,
    issues: ["API key needs verification", "Event tagging logic incomplete", "Fondo integration missing"],
    nextSteps: ["Test Brex API connectivity", "Implement expense filtering", "Add Fondo sync"],
    priority: 'medium',
    icon: <DollarSign className="h-5 w-5" />
  },
  {
    name: "Dashboard & Analytics",
    description: "Real-time dashboard with KPIs and attendee management",
    status: 'complete',
    progress: 95,
    issues: ["Real-time updates need optimization"],
    nextSteps: ["Add WebSocket for live updates", "Optimize query performance"],
    priority: 'low',
    icon: <GitBranch className="h-5 w-5" />
  }
];

const NEXT_MILESTONES = [
  {
    title: "Phase 1: Core API Testing (This Week)",
    tasks: [
      "Verify all API keys are working",
      "Test SixtyFour enrichment with real profiles", 
      "Validate MixRank company lookup",
      "Test Pylon notification delivery",
      "Fix any critical integration issues"
    ],
    deadline: "End of Week 1"
  },
  {
    title: "Phase 2: Production Readiness (Week 2)",  
    tasks: [
      "Add proper error handling and retries",
      "Implement rate limiting for all APIs",
      "Add comprehensive logging", 
      "Create production webhook endpoint",
      "Test with high-volume scenarios"
    ],
    deadline: "End of Week 2"
  },
  {
    title: "Phase 3: Advanced Features (Week 3-4)",
    tasks: [
      "Add Fondo expense categorization",
      "Implement advanced lead scoring",
      "Add email notifications as backup",
      "Create event-specific customization",
      "Add bulk import/export features"
    ],
    deadline: "End of Month"
  }
];

export function DevelopmentPlan() {
  const overallProgress = Math.round(
    FEATURES.reduce((sum, feature) => sum + feature.progress, 0) / FEATURES.length
  );

  const completedFeatures = FEATURES.filter(f => f.status === 'complete').length;
  const issuesCount = FEATURES.reduce((sum, f) => sum + (f.issues?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className="gradient-card shadow-dashboard">
        <CardHeader>
          <CardTitle className="dashboard-subheading">Project Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-dashboard-success">{overallProgress}%</div>
              <div className="text-sm text-muted-foreground">Overall Complete</div>
              <Progress value={overallProgress} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{completedFeatures}/{FEATURES.length}</div>
              <div className="text-sm text-muted-foreground">Features Complete</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-dashboard-warning">{issuesCount}</div>
              <div className="text-sm text-muted-foreground">Known Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Status */}
      <Card className="gradient-card shadow-dashboard">
        <CardHeader>
          <CardTitle className="dashboard-subheading">Feature Development Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {FEATURES.map((feature, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {feature.icon}
                    <div>
                      <h4 className="font-medium flex items-center space-x-2">
                        {feature.name}
                        <Badge variant={
                          feature.status === 'complete' ? 'default' :
                          feature.status === 'partial' ? 'secondary' :
                          feature.status === 'issue' ? 'destructive' : 'outline'
                        }>
                          {feature.status}
                        </Badge>
                        <Badge variant={
                          feature.priority === 'high' ? 'destructive' :
                          feature.priority === 'medium' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {feature.priority}
                        </Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{feature.progress}%</div>
                  </div>
                </div>
                
                <Progress value={feature.progress} className="mb-3" />
                
                {feature.issues && feature.issues.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-dashboard-warning" />
                      <span className="text-sm font-medium text-dashboard-warning">Known Issues:</span>
                    </div>
                    <ul className="text-sm space-y-1 ml-6">
                      {feature.issues.map((issue, i) => (
                        <li key={i} className="text-muted-foreground">• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {feature.nextSteps && feature.nextSteps.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-dashboard-info" />
                      <span className="text-sm font-medium">Next Steps:</span>
                    </div>
                    <ul className="text-sm space-y-1 ml-6">
                      {feature.nextSteps.map((step, i) => (
                        <li key={i} className="text-muted-foreground">• {step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Development Roadmap */}
      <Card className="gradient-card shadow-dashboard">
        <CardHeader>
          <CardTitle className="dashboard-subheading">Development Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {NEXT_MILESTONES.map((milestone, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{milestone.title}</h4>
                  <Badge variant="outline">{milestone.deadline}</Badge>
                </div>
                
                <ul className="space-y-2">
                  {milestone.tasks.map((task, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span className="text-sm">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Immediate Action Items */}
      <Card className="gradient-card shadow-dashboard border-l-4 border-l-dashboard-warning">
        <CardHeader>
          <CardTitle className="dashboard-subheading text-dashboard-warning">
            🚨 Immediate Action Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-dashboard-warning/10 rounded-lg">
              <h5 className="font-medium mb-2">Critical: API Keys Verification</h5>
              <p className="text-sm text-muted-foreground mb-2">
                Before full testing, we need to verify all external API keys are working:
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• SixtyFour API key - test person enrichment</li>
                <li>• MixRank API key - test company lookup</li>
                <li>• Pylon API key - test notification delivery</li>
                <li>• Brex API key - test expense retrieval</li>
              </ul>
            </div>
            
            <div className="p-3 bg-dashboard-info/10 rounded-lg">
              <h5 className="font-medium mb-2">Next: Run Pipeline Test</h5>
              <p className="text-sm text-muted-foreground">
                Use the "Pipeline Test" tab to run end-to-end testing with the Sarah Chen test case. 
                This will reveal which integrations are working and which need attention.
              </p>
            </div>
            
            <div className="p-3 bg-dashboard-success/10 rounded-lg">
              <h5 className="font-medium mb-2">Success Criteria</h5>
              <p className="text-sm text-muted-foreground">
                For demo readiness: Webhook → Database → Enrichment → Scoring → Dashboard display. 
                Notifications can be simulated if Pylon isn't working.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}