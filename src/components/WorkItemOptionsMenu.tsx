import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Flag, Trash2, MoveVertical } from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { DELETE_WORK_ITEM, MOVE_WORK_ITEM, TOGGLE_WORK_ITEM_FLAG, UPDATE_WORK_ITEM } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkItem {
  id: string;
  key: string;
  summary: string;
  status: string;
  sprintId?: string;
  flagged: boolean;
}

interface Sprint {
  id: string;
  name: string;
}

interface WorkItemOptionsMenuProps {
  item: WorkItem;
  sprints: Sprint[];
  allItems: WorkItem[];
  onSuccess?: () => void;
}

export function WorkItemOptionsMenu({ item, sprints, allItems, onSuccess }: WorkItemOptionsMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(DELETE_WORK_ITEM, { itemId: item.id });
      toast({
        title: "Success",
        description: "Work item deleted successfully",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete work item",
        variant: "destructive",
      });
    }
  };

  const handleToggleFlag = async () => {
    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(TOGGLE_WORK_ITEM_FLAG, {
        itemId: item.id,
        flagged: !item.flagged,
      });
      toast({
        title: "Success",
        description: item.flagged ? "Flag removed" : "Item flagged",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update flag",
        variant: "destructive",
      });
    }
  };

  const handleMoveTo = async (targetSprintId?: string) => {
    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(MOVE_WORK_ITEM, {
        itemId: item.id,
        sprintId: targetSprintId || null,
      });
      toast({
        title: "Success",
        description: targetSprintId ? "Item moved to sprint" : "Item moved to backlog",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to move item",
        variant: "destructive",
      });
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    try {
      const client = getGraphQLClient(token || undefined);
      await client.request(UPDATE_WORK_ITEM, {
        itemId: item.id,
        newStatus,
      });
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getCurrentSprintItems = () => {
    return allItems.filter(i => i.sprintId === item.sprintId);
  };

  const getItemIndex = () => {
    const currentItems = getCurrentSprintItems();
    return currentItems.findIndex(i => i.id === item.id);
  };

  const handleMovePosition = async (direction: 'up' | 'down' | 'top' | 'bottom') => {
    const currentItems = getCurrentSprintItems();
    const currentIndex = getItemIndex();
    
    // This is a simplified version - in production you'd need a proper ordering field
    toast({
      title: "Info",
      description: "Position reordering requires backend support for ordering field",
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-background">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <MoveVertical className="mr-2 h-4 w-4" />
              Move Item
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-background">
              <DropdownMenuItem onClick={() => handleMovePosition('top')}>
                Move to Top
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMovePosition('up')}>
                Move Up
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMovePosition('down')}>
                Move Down
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMovePosition('bottom')}>
                Move to Bottom
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleMoveTo()}>
                Move to Backlog
              </DropdownMenuItem>
              {sprints.map(sprint => (
                <DropdownMenuItem
                  key={sprint.id}
                  onClick={() => handleMoveTo(sprint.id)}
                >
                  Move to {sprint.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-background">
              <DropdownMenuItem onClick={() => handleChangeStatus('TO_DO')}>
                To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeStatus('IN_PROGRESS')}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeStatus('DONE')}>
                Done
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleToggleFlag}>
            <Flag className="mr-2 h-4 w-4" />
            {item.flagged ? "Remove Flag" : "Add Flag"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.summary}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
