import { useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkItem } from "@/types";

export default function TimelinePage() {
  const [closedItems] = useState<WorkItem[]>([
    {
      id: "1",
      key: "TASK-5",
      summary: "User authentication system",
      status: "DONE",
      priority: "HIGH",
      assignee: "john@example.com",
      reporter: "admin@example.com",
      storyPoints: 8,
      sprintId: "sprint-1",
      createdDate: "2025-01-05",
      updatedDate: "2025-01-15",
      comments: [],
      subtasks: [],
      flagged: false,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sprintFilter, setSprintFilter] = useState<string>("all");

  const filteredItems = closedItems.filter((item) => {
    const matchesSearch =
      item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSprint = sprintFilter === "all" || item.sprintId === sprintFilter;
    return matchesSearch && matchesSprint;
  });

  return (
    <MainLayout spaceName="POS QE TEAM">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Timeline (Closed Sprints)</h1>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search work items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sprintFilter} onValueChange={setSprintFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sprints</SelectItem>
              <SelectItem value="sprint-1">Sprint 1</SelectItem>
              <SelectItem value="sprint-2">Sprint 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Closed Items by Sprint */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sprint 1 - Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-muted-foreground">{item.key}</span>
                      <span className="text-sm font-medium">{item.summary}</span>
                      <Badge variant="outline">{item.status}</Badge>
                      <Badge
                        variant={
                          item.priority === "URGENT" || item.priority === "HIGH"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {item.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{item.assignee || "Unassigned"}</span>
                      <span>{item.storyPoints} pts</span>
                      <span>Completed {new Date(item.updatedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
