import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type User = {
  name: string;
  email: string;
  jobTitle?: string;
};

export default function ProfileSettingsPage() {
  const { user, setUser, token } = useAuth();
  const { toast } = useToast();

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
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_IDENTITY_API_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name, jobTitle }),
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized: Please log in again.");
        throw new Error("Failed to update profile");
      }

      const updatedData = await response.json();

      const newUserState: User = {
        ...user,
        name: updatedData.name,
        email: updatedData.email,
        jobTitle: updatedData.jobTitle,
      };

      if (setUser) {
        setUser(newUserState);
      }

      localStorage.setItem("auth_user", JSON.stringify(newUserState));

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });

    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Something went wrong while saving.",
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
            placeholder="Enter your full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled className="bg-muted cursor-not-allowed" />
          <p className="text-[0.8rem] text-muted-foreground">Email cannot be changed.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job title</Label>
          <Input
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            disabled={loading}
            placeholder="e.g. Software Engineer"
          />
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}