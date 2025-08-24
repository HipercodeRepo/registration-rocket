import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Eye, EyeOff, Key, CreditCard, ExternalLink, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ApiKeyStatus {
  luma: boolean;
  brex: boolean;
}

export function SettingsPanel() {
  const [lumaApiKey, setLumaApiKey] = useState("");
  const [brexApiKey, setBrexApiKey] = useState("");
  const [showLumaKey, setShowLumaKey] = useState(false);
  const [showBrexKey, setShowBrexKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({ luma: false, brex: false });
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('luma_api_key, brex_api_key')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        // Profile might not exist yet, that's okay
        return;
      }

      if (profile) {
        setLumaApiKey(profile.luma_api_key || "");
        setBrexApiKey(profile.brex_api_key || "");
        setApiKeyStatus({
          luma: !!profile.luma_api_key,
          brex: !!profile.brex_api_key
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          luma_api_key: lumaApiKey || null,
          brex_api_key: brexApiKey || null,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      setApiKeyStatus({
        luma: !!lumaApiKey,
        brex: !!brexApiKey
      });

      toast({
        title: "Settings Saved",
        description: "Your API keys have been updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">API Settings</h2>
        <p className="text-muted-foreground">
          Configure your API keys to enable event data synchronization and expense tracking.
        </p>
      </div>

      {/* Luma API Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle>Luma API Integration</CardTitle>
              {apiKeyStatus.luma && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Connect your Luma account to automatically sync event registrations and attendee data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 rounded-lg">
            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to find your Luma API Key:
            </h5>
            <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Go to your Luma Account</li>
              <li>Under Profile - select the Calendar you want to integrate</li>
              <li>Go to Settings → Options</li>
              <li>Click to copy the API KEY</li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open('https://lu.ma/account', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Luma Account
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="luma-key">Luma API Key</Label>
            <div className="relative">
              <Input
                id="luma-key"
                type={showLumaKey ? "text" : "password"}
                placeholder="Enter your Luma API key"
                value={lumaApiKey}
                onChange={(e) => setLumaApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowLumaKey(!showLumaKey)}
              >
                {showLumaKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brex API Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Brex API Integration</CardTitle>
              {apiKeyStatus.brex && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Connect your Brex account to automatically track event-related expenses and calculate ROI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 border border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800 rounded-lg">
            <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
              How to find your Brex API Key:
            </h5>
            <ol className="text-xs text-purple-800 dark:text-purple-200 space-y-1 list-decimal list-inside">
              <li>Log in to your Brex Dashboard</li>
              <li>Go to Settings → Developers</li>
              <li>Create a new API token with "Read" permissions</li>
              <li>Copy the generated token</li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open('https://dashboard.brex.com/settings/developer', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Brex Dashboard
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brex-key">Brex API Token</Label>
            <div className="relative">
              <Input
                id="brex-key"
                type={showBrexKey ? "text" : "password"}
                placeholder="Enter your Brex API token"
                value={brexApiKey}
                onChange={(e) => setBrexApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowBrexKey(!showBrexKey)}
              >
                {showBrexKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}