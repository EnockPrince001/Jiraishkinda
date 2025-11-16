import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { UPDATE_WORK_ITEM_ASSIGNEE } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

interface Member {
  user: {
    id: string;
    userName: string;
  };
}

interface AssigneeSelectProps {
  itemId: string;
  currentAssigneeId?: string;
  members: Member[];
  onSuccess?: () => void;
}

export function AssigneeSelect({ itemId, currentAssigneeId, members, onSuccess }: AssigneeSelectProps) {
  const { token } = useAuth();
  const { toast } = useToast();

  const handleAssigneeChange = async (assigneeId: string) => {
    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(UPDATE_WORK_ITEM_ASSIGNEE, {
        itemId,
        assigneeId: assigneeId === "unassigned" ? null : assigneeId,
      });
      toast({
        title: "Success",
        description: "Assignee updated successfully",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update assignee",
        variant: "destructive",
      });
    }
  };

  return (
    <Select
      value={currentAssigneeId || "unassigned"}
      onValueChange={handleAssigneeChange}
    >
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent className="bg-background">
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {members.map((member) => (
          <SelectItem key={member.user.id} value={member.user.id}>
            {member.user.userName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
