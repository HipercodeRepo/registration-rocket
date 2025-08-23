import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Building, Mail, Briefcase, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnrichedData {
  person: any;
  company: any;
  mixrank: any;
  score: number;
}

const ContactEnrichmentTest = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrichedData, setEnrichedData] = useState<EnrichedData | null>(null);
  const { toast } = useToast();

  // Test data samples
  const testContacts = [
    { name: "Sarah Chen", email: "sarah@stripe.com", company: "Stripe" },
    { name: "Alex Rodriguez", email: "alex@airbnb.com", company: "Airbnb" },
    { name: "Jamie Wilson", email: "jamie@notion.so", company: "Notion" }
  ];

  const handleEnrich = async () => {
    if (!name || !email) {
      toast({
        title: "Missing information",
        description: "Please provide both name and email",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setEnrichedData(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to test enrichment",
          variant: "destructive"
        });
        return;
      }

      // First, create the attendee record
      const { data: attendee, error: attendeeError } = await supabase
        .from('attendees')
        .insert({
          name,
          email,
          company: company || null,
          user_id: session.user.id,
          event_id: `test-${Date.now()}`,
          registered_at: new Date().toISOString()
        })
        .select()
        .single();

      if (attendeeError) throw attendeeError;

      // Then trigger enrichment
      const { data, error } = await supabase.functions.invoke('enrich-and-score', {
        body: { 
          attendee_id: attendee.id,
          name,
          email,
          company: company || null
        }
      });

      if (error) throw error;

      // Fetch the enriched data
      const { data: enrichment } = await supabase
        .from('enrichment')
        .select('*')
        .eq('attendee_id', attendee.id)
        .single();

      const { data: leadScore } = await supabase
        .from('lead_scores')
        .select('*')
        .eq('attendee_id', attendee.id)
        .single();

      if (enrichment || leadScore) {
        setEnrichedData({
          person: enrichment?.person_json || {},
          company: enrichment?.company_json || {},
          mixrank: enrichment?.mixrank_json || {},
          score: leadScore?.score || 0
        });

        toast({
          title: "Enrichment complete",
          description: "Contact data has been enriched successfully",
        });
      }

    } catch (error: any) {
      console.error('Enrichment error:', error);
      toast({
        title: "Enrichment failed",
        description: error.message || "Failed to enrich contact data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fillTestData = (contact: typeof testContacts[0]) => {
    setName(contact.name);
    setEmail(contact.email);
    setCompany(contact.company);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Test Contact Enrichment
          </CardTitle>
          <CardDescription>
            Test the SixtyFour and MixRank enrichment APIs with real contact data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                placeholder="Enter company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Quick fill:</span>
            {testContacts.map((contact, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => fillTestData(contact)}
              >
                {contact.name}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleEnrich}
            disabled={loading || !name || !email}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enriching Contact...
              </>
            ) : (
              "Enrich Contact Data"
            )}
          </Button>
        </CardContent>
      </Card>

      {enrichedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Enrichment Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Lead Score */}
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">
                {enrichedData.score}/10
              </div>
              <div className="text-sm text-muted-foreground">Lead Score</div>
            </div>

            <Separator />

            {/* Person Data */}
            {enrichedData.person && Object.keys(enrichedData.person).length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Person Information (SixtyFour)
                </h4>
                <div className="grid gap-3">
                  {enrichedData.person.title && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{enrichedData.person.title}</span>
                    </div>
                  )}
                  {enrichedData.person.linkedin_url && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={enrichedData.person.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {enrichedData.person.bio && (
                    <p className="text-sm text-muted-foreground">
                      {enrichedData.person.bio}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Company Data */}
            {enrichedData.company && Object.keys(enrichedData.company).length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Company Information (SixtyFour)
                </h4>
                <div className="grid gap-2">
                  {enrichedData.company.name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{enrichedData.company.name}</span>
                      {enrichedData.company.employee_count && (
                        <Badge variant="secondary">
                          {enrichedData.company.employee_count} employees
                        </Badge>
                      )}
                    </div>
                  )}
                  {enrichedData.company.industry && (
                    <p className="text-sm text-muted-foreground">
                      Industry: {enrichedData.company.industry}
                    </p>
                  )}
                  {enrichedData.company.description && (
                    <p className="text-sm text-muted-foreground">
                      {enrichedData.company.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* MixRank Data */}
            {enrichedData.mixrank && Object.keys(enrichedData.mixrank).length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Firmographic Data (MixRank)
                </h4>
                <div className="grid gap-2">
                  {enrichedData.mixrank.revenue && (
                    <p className="text-sm">
                      <span className="font-medium">Revenue:</span> {enrichedData.mixrank.revenue}
                    </p>
                  )}
                  {enrichedData.mixrank.funding && (
                    <p className="text-sm">
                      <span className="font-medium">Funding:</span> {enrichedData.mixrank.funding}
                    </p>
                  )}
                  {enrichedData.mixrank.tech_stack && (
                    <div>
                      <span className="text-sm font-medium">Tech Stack:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {enrichedData.mixrank.tech_stack.slice(0, 5).map((tech: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContactEnrichmentTest;