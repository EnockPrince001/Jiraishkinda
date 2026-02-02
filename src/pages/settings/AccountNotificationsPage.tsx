import { useState } from "react";
import { useToast } from "@/hooks/use-toast"; // ✅ Matches your hook in ProfileSettingsPage
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountNotificationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Local state for notification toggles
  const [settings, setSettings] = useState({
    emailAlerts: true,
    pushNotifications: false,
    securityAlerts: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to update settings");

      toast({
        title: "Success",
        description: "Notification preferences updated.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Manage how you stay updated.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Preferences</CardTitle>
          <CardDescription>Receive activity summaries and updates via email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-alerts">General Email Alerts</Label>
            <Switch
              id="email-alerts"
              checked={settings.emailAlerts}
              onCheckedChange={() => handleToggle("emailAlerts")}
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="security-alerts">Security Alerts</Label>
            <Switch
              id="security-alerts"
              checked={settings.securityAlerts}
              onCheckedChange={() => handleToggle("securityAlerts")}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      <div className="pt-2">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save preferences"}
        </Button>
      </div>
    </div>
  );
}