import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, Users, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState<'welcome' | 'connect' | 'complete'>('welcome');
  const [companyName, setCompanyName] = useState('');
  const [lumaApiKey, setLumaApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveProfile = async (skipLuma = false) => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: session.user.id,
          company_name: companyName,
          luma_api_key: skipLuma ? null : lumaApiKey,
          onboarding_completed: true
        });

      if (error) throw error;

      toast({
        title: "Profile saved",
        description: "Your onboarding is complete!",
      });

      setStep('complete');
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadContacts = async (file: File) => {
    try {
      setLoading(true);
      
      const text = await file.text();
      const lines = text.split('\n').slice(1); // Skip header
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const contacts = lines
        .filter(line => line.trim())
        .map((line, index) => {
          const [name, email, company, title] = line.split(',').map(s => s.trim());
          return {
            name: name || `Contact ${index + 1}`,
            email: email,
            company: company || '',
            title: title || '',
            user_id: session.user.id,
            event_id: `upload-${Date.now()}`,
            registered_at: new Date().toISOString()
          };
        });

      const { error } = await supabase
        .from('attendees')
        .insert(contacts);

      if (error) throw error;

      toast({
        title: "Contacts uploaded",
        description: `Successfully uploaded ${contacts.length} contacts`,
      });

      // Trigger enrichment for uploaded contacts
      await supabase.functions.invoke('enrich-and-score', {
        body: { contacts: contacts.slice(0, 5) } // Limit to first 5 for testing
      });

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'welcome') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Welcome to Event Intelligence</CardTitle>
          <CardDescription className="text-lg">
            Let's set up your account to start enriching leads and tracking events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              placeholder="Enter your company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <Button 
            onClick={() => setStep('connect')} 
            className="w-full" 
            size="lg"
            disabled={!companyName.trim()}
          >
            Continue Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'connect') {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connect Your Data Sources</CardTitle>
          <CardDescription>
            Choose how you'd like to import your event attendees for enrichment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="luma" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="luma" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Connect Luma
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload CSV
              </TabsTrigger>
            </TabsList>

            <TabsContent value="luma" className="mt-6 space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Connect to Luma</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter your Luma API key to automatically sync event registrations
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="luma-key">Luma API Key</Label>
                    <Input
                      id="luma-key"
                      type="password"
                      placeholder="Enter your Luma API key"
                      value={lumaApiKey}
                      onChange={(e) => setLumaApiKey(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleSaveProfile()} 
                    disabled={loading || !lumaApiKey.trim()}
                    className="flex-1"
                  >
                    {loading ? "Connecting..." : "Connect Luma"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleSaveProfile(true)}
                    disabled={loading}
                  >
                    Skip for Now
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-6 space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Upload Contact List</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV file with columns: Name, Email, Company, Title
                  </p>
                  
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drop your CSV file here or click to browse
                    </p>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadContacts(file);
                      }}
                      className="hidden"
                      id="csv-upload"
                    />
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <Button variant="outline" type="button">
                        Choose File
                      </Button>
                    </Label>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => handleSaveProfile(true)}
                  disabled={loading}
                  className="w-full"
                >
                  Skip and Complete Setup
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto text-center">
      <CardContent className="pt-8">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h3 className="text-2xl font-bold mb-2">Setup Complete!</h3>
        <p className="text-muted-foreground mb-6">
          Your Event Intelligence dashboard is ready to use
        </p>
        <Button onClick={onComplete} size="lg">
          Go to Dashboard
        </Button>
      </CardContent>
    </Card>
  );
};

export default OnboardingFlow;