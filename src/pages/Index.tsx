import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

const Index = () => {
  return (
    <MainLayout spaceName="POS QE TEAM">
      <div className="p-6">
        {/* Board Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search board"
                className="w-64 pl-10"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Group</Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/* TO DO Column */}
          <div className="min-w-[280px] flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                TO DO <span className="ml-2 text-xs">16</span>
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                <p className="text-sm font-medium mb-2">
                  Shift & Report Setup
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">SCRUM-14</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">3</span>
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                      BK
                    </div>
                  </div>
                </div>
              </Card>
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                <p className="text-sm font-medium mb-2">
                  Costing & Reconciliation
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">SCRUM-15</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">3</span>
                    <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white">
                      HA
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Create issue
            </Button>
          </div>

          {/* IN PROGRESS Column */}
          <div className="min-w-[280px] flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                IN PROGRESS <span className="ml-2 text-xs">2</span>
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-warning">
                <p className="text-sm font-medium mb-2">
                  In the branch distribution, add a 'View Distribution' button
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">SCRUM-60</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">2</span>
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                      BK
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* DONE Column */}
          <div className="min-w-[280px] flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                DONE <span className="ml-2 text-xs">102</span>
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer bg-success/5">
                <p className="text-sm font-medium mb-2">
                  Update Inventory when External PO
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">SCRUM-125</span>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-xs text-white">
                      AN
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Add Column Button */}
          <Button variant="ghost" className="min-w-[280px] h-12 border-2 border-dashed">
            <Plus className="h-4 w-4 mr-2" />
            Add column
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
