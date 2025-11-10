import { useState } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";

const burnupData = [
  { day: "Day 1", completed: 0, total: 50 },
  { day: "Day 2", completed: 5, total: 50 },
  { day: "Day 3", completed: 12, total: 52 },
  { day: "Day 4", completed: 18, total: 52 },
  { day: "Day 5", completed: 25, total: 55 },
];

const burndownData = [
  { day: "Day 1", remaining: 50, ideal: 50 },
  { day: "Day 2", remaining: 45, ideal: 40 },
  { day: "Day 3", remaining: 38, ideal: 30 },
  { day: "Day 4", remaining: 34, ideal: 20 },
  { day: "Day 5", remaining: 25, ideal: 10 },
];

const velocityData = [
  { sprint: "Sprint 1", committed: 45, completed: 42 },
  { sprint: "Sprint 2", committed: 50, completed: 48 },
  { sprint: "Sprint 3", committed: 48, completed: 45 },
  { sprint: "Sprint 4", committed: 52, completed: 50 },
];

const cumulativeFlowData = [
  { date: "Jan 1", "TO DO": 20, "IN PROGRESS": 5, DONE: 0 },
  { date: "Jan 5", "TO DO": 22, "IN PROGRESS": 8, DONE: 3 },
  { date: "Jan 10", "TO DO": 23, "IN PROGRESS": 10, DONE: 8 },
  { date: "Jan 15", "TO DO": 20, "IN PROGRESS": 12, DONE: 15 },
  { date: "Jan 20", "TO DO": 18, "IN PROGRESS": 10, DONE: 22 },
];

export default function ReportsPage() {
  const [selectedSprint, setSelectedSprint] = useState("sprint-1");
  const [estimationField, setEstimationField] = useState("story-points");

  return (
    <MainLayout spaceName="POS QE TEAM">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Reports</h1>

        <Tabs defaultValue="burnup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="burnup">Burnup</TabsTrigger>
            <TabsTrigger value="burndown">Burndown</TabsTrigger>
            <TabsTrigger value="velocity">Velocity</TabsTrigger>
            <TabsTrigger value="cumulative">Cumulative Flow</TabsTrigger>
          </TabsList>

          {/* Burnup Report */}
          <TabsContent value="burnup">
            <Card>
              <CardHeader>
                <CardTitle>Burnup Report</CardTitle>
                <CardDescription>
                  Visualize sprint's completed work and compare it with total scope
                </CardDescription>
                <div className="flex gap-4 pt-4">
                  <div className="flex-1">
                    <Label>Sprint</Label>
                    <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sprint-1">Sprint 1</SelectItem>
                        <SelectItem value="sprint-2">Sprint 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Estimation Field</Label>
                    <Select value={estimationField} onValueChange={setEstimationField}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="story-points">Story Points</SelectItem>
                        <SelectItem value="work-item-count">Work Item Count</SelectItem>
                        <SelectItem value="time">Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={burnupData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke="hsl(var(--primary))" name="Completed" />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--muted-foreground))" name="Total Scope" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Burndown Chart */}
          <TabsContent value="burndown">
            <Card>
              <CardHeader>
                <CardTitle>Sprint Burndown Chart</CardTitle>
                <CardDescription>
                  Track total work remaining and likelihood of completing sprint on time
                </CardDescription>
                <div className="flex gap-4 pt-4">
                  <div className="flex-1">
                    <Label>Sprint</Label>
                    <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sprint-1">Sprint 1</SelectItem>
                        <SelectItem value="sprint-2">Sprint 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Estimation Field</Label>
                    <Select value={estimationField} onValueChange={setEstimationField}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="story-points">Story Points</SelectItem>
                        <SelectItem value="work-item-count">Work Item Count</SelectItem>
                        <SelectItem value="time">Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={burndownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="remaining" stroke="hsl(var(--destructive))" name="Remaining Work" />
                    <Line type="monotone" dataKey="ideal" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" name="Ideal Progress" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Velocity Report */}
          <TabsContent value="velocity">
            <Card>
              <CardHeader>
                <CardTitle>Velocity Report</CardTitle>
                <CardDescription>
                  Predict amount of work your team can commit to in future sprints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sprint" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="committed" fill="hsl(var(--muted))" name="Commitment" />
                    <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cumulative Flow Diagram */}
          <TabsContent value="cumulative">
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Flow Diagram</CardTitle>
                <CardDescription>
                  Shows statuses of work items over time to identify bottlenecks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={cumulativeFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="TO DO" stackId="1" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" />
                    <Area type="monotone" dataKey="IN PROGRESS" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.5)" />
                    <Area type="monotone" dataKey="DONE" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
