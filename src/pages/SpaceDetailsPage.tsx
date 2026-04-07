import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGraphQLClient } from "@/lib/graphql-client";
import { GET_SPACE_DATA, UPDATE_SPACE } from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SpaceDetailsPage() {
  const { spaceKey } = useParams();
  const { token } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [category, setCategory] = useState("");
  const [defaultAssignee, setDefaultAssignee] = useState("unassigned");
  // FIX: track saving state to disable button and show spinner
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["space", spaceKey, token],
    queryFn: async () => {
      const client = getGraphQLClient(token || undefined);
      return client.request(GET_SPACE_DATA, { spaceKey });
    },
    enabled: !!spaceKey && !!token,
  });

  const spaceData = (data as any)?.space;
  const space = Array.isArray(spaceData) ? spaceData[0] : spaceData;

  useEffect(() => {
    if (space) {
      setName(space.name || "");
      setKey(space.key || "");
    }
  }, [space]);

  // FIX: handleSave now actually calls the UPDATE_SPACE mutation.
  // Previously it was an empty function that only showed a success toast,
  // meaning no changes were ever sent to the backend.
  const handleSave = async () => {
    if (!space?.id) return;
    if (!name.trim()) {
      toast({
        title: "Validation error",
        description: "Space name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const client = getGraphQLClient(token || undefined);

      await client.request(UPDATE_SPACE, {
        spaceId: space.id,
        input: {
          name: name.trim(),
          // key is disabled in the UI (intentionally not editable)
          // category and defaultAssignee can be added here once
          // the backend UpdateSpaceInput supports them
        },
      });

      // Refetch so the sidebar and any other consumers get the new name
      await refetch();

      toast({
        title: "Success",
        description: "Space details updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update space details.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!space) return <div>Space not found</div>;

  // Find the admin/owner — your backend uses 'ADMINISTRATOR' as the role string
  const owner =
    space.members?.find((m: any) =>
      ['ADMINISTRATOR', 'ADMIN'].includes(m.role)
    )?.user ?? null;

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Details</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your space details and settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Icon */}
        <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-muted/5">
          <div className="h-24 w-24 rounded bg-blue-500 flex items-center justify-center shadow-lg">
            <span className="text-4xl font-bold text-white">
              {space.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <Button variant="outline" size="sm">Change icon</Button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Key — read-only, changing it would break all existing URLs */}
          <div className="space-y-2">
            <Label htmlFor="key">Space key</Label>
            <Input
              id="key"
              value={key}
              disabled
              className="bg-muted"
            />
            <p className="text-[11px] text-muted-foreground">
              The space key cannot be changed after creation.
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={isSaving}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <Label>Space owner</Label>
            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/20">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-green-600 text-white">
                  {owner?.userName?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {owner?.userName ?? "Unknown"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Make sure your space lead has access to work items in the space.
            </p>
          </div>

          {/* Default assignee */}
          <div className="space-y-2">
            <Label htmlFor="assignee">Default assignee</Label>
            <Select value={defaultAssignee} onValueChange={setDefaultAssignee} disabled={isSaving}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="project_lead">Project Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </div>
  );
}