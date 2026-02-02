import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast"; // ✅ Using your hook

type User = {
  name: string;
  email: string;
  jobTitle?: string;
};

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuth(); 
  const { toast } = useToast(); // ✅ Initialize the hook
  
  const safeUser: User = user ?? { name: "", email: "", jobTitle: "" };

  const [name, setName] = useState(safeUser.name);
  const [email] = useState(safeUser.email); 
  const [jobTitle, setJobTitle] = useState(safeUser.jobTitle || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setJobTitle(user.jobTitle || "");
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, jobTitle }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const updatedUser = await response.json();
      if (setUser) setUser(updatedUser);

      // ✅ Correct useToast syntax
      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
        variant: "default", // or "success" if your theme supports it
      });

    } catch (err: any) {
      // ✅ Correct useToast syntax for errors
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job title</Label>
          <Input
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}