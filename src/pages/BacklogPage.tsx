import { useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, ChevronDown, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Sprint, WorkItem } from "@/types";

export default function BacklogPage() {
  const [sprints, setSprints] = useState<Sprint[]>([
    {
      id: "sprint-1",
      name: "Sprint 1",
      goal: "Complete user authentication",
      startDate: "2025-01-15",
      endDate: "2025-01-29",
      duration: "2 weeks",
      status: "ACTIVE",
      workItems: ["TASK-1", "TASK-2"],
    },
  ]);

  const [backlogItems, setBacklogItems] = useState<WorkItem[]>([
    {
      id: "item-1",
      key: "TASK-3",
      summary: "Implement user profile page",
      status: "TO DO",
      priority: "MEDIUM",
      reporter: "user@example.com",
      createdDate: "2025-01-10",
      updatedDate: "2025-01-10",
      comments: [],
      subtasks: [],
      flagged: false,
    },
  ]);

  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set(["sprint-1"]));
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);

  const toggleSprint = (sprintId: string) => {
    const newExpanded = new Set(expandedSprints);
    if (newExpanded.has(sprintId)) {
      newExpanded.delete(sprintId);
    } else {
      newExpanded.add(sprintId);
    }
    setExpandedSprints(newExpanded);
  };

  return (
    <MainLayout spaceName="POS QE TEAM">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Backlog</h1>
          <div className="flex gap-2">
            <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Work Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Work Item</DialogTitle>
                  <DialogDescription>Add a new work item to the backlog</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Summary</Label>
                    <Input placeholder="Enter summary" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select defaultValue="TO DO">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TO DO">To Do</SelectItem>
                        <SelectItem value="IN PROGRESS">In Progress</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Story Points</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select points" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="13">13</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateItemOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateItemOpen(false)}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateSprintOpen} onOpenChange={setIsCreateSprintOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sprint
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Sprint</DialogTitle>
                  <DialogDescription>Set up a new sprint for your team</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Sprint Name</Label>
                    <Input placeholder="Sprint 2" />
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <Select defaultValue="2weeks">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1week">1 Week</SelectItem>
                        <SelectItem value="2weeks">2 Weeks</SelectItem>
                        <SelectItem value="3weeks">3 Weeks</SelectItem>
                        <SelectItem value="4weeks">4 Weeks</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sprint Goal</Label>
                    <Input placeholder="What should this sprint achieve?" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateSprintOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateSprintOpen(false)}>Create Sprint</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Sprints */}
        <div className="space-y-4">
          {sprints.map((sprint) => (
            <Card key={sprint.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleSprint(sprint.id)}
                    >
                      {expandedSprints.has(sprint.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <CardTitle className="text-lg">{sprint.name}</CardTitle>
                    <Badge variant={sprint.status === "ACTIVE" ? "default" : "secondary"}>
                      {sprint.status}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Sprint</DropdownMenuItem>
                      <DropdownMenuItem>Move to Top</DropdownMenuItem>
                      <DropdownMenuItem>Move Up</DropdownMenuItem>
                      <DropdownMenuItem>Move Down</DropdownMenuItem>
                      <DropdownMenuItem>Move to Bottom</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete Sprint
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {sprint.goal && (
                  <p className="text-sm text-muted-foreground ml-8">{sprint.goal}</p>
                )}
              </CardHeader>
              {expandedSprints.has(sprint.id) && (
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {sprint.workItems.length} work items
                    </div>
                    {/* Work items would be listed here */}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Backlog */}
        <Card>
          <CardHeader>
            <CardTitle>Backlog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {backlogItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">{item.key}</span>
                    <span className="text-sm">{item.summary}</span>
                    <Badge variant="outline">{item.priority}</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Add to Sprint</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
