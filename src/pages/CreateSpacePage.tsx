import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutGrid, FolderKanban, ArrowLeft } from "lucide-react";
import { getGraphQLClient } from "@/lib/graphql-client";
import { useAuth } from "@/context/AuthContext";
import { CREATE_SPACE } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

type SpaceType = 'SCRUM' | 'KANBAN';

export default function CreateSpacePage() {
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<SpaceType | null>(null);
  const [spaceName, setSpaceName] = useState("");
  const [spaceKey, setSpaceKey] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleTemplateSelect = (template: SpaceType) => {
    setSelectedTemplate(template);
    setStep('details');
  };

  const handleCreateSpace = async () => {
    if (!spaceName || !spaceKey || !selectedTemplate) return;

    setIsCreating(true);
    try {
      const client = getGraphQLClient(token || undefined);
      const data: any = await client.request(CREATE_SPACE, {
        input: {
          name: spaceName,
          key: spaceKey.toUpperCase(),
          type: selectedTemplate,
        },
      });

      toast({
        title: "Space created",
        description: `${spaceName} has been created successfully`,
      });

      navigate(`/spaces/${data.createSpace.key}/board`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create space",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSpaceNameChange = (value: string) => {
    setSpaceName(value);
    // Auto-generate key from name (remove spaces, special chars, uppercase)
    const generatedKey = value
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 10)
      .toUpperCase();
    setSpaceKey(generatedKey);
  };

  if (step === 'template') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Choose a template</h1>
            <p className="text-muted-foreground text-lg">
              Select the project management style that works best for your team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
              onClick={() => handleTemplateSelect('SCRUM')}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderKanban className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Scrum</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Perfect for teams that work in sprints with a backlog
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Features:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Sprint planning and management</li>
                    <li>• Product backlog</li>
                    <li>• Sprint board with columns</li>
                    <li>• Burndown charts and reports</li>
                    <li>• Story points estimation</li>
                  </ul>
                </div>
                <Button className="w-full">Select Scrum</Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
              onClick={() => handleTemplateSelect('KANBAN')}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <LayoutGrid className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Kanban</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Ideal for continuous flow work without sprints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Features:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Continuous flow board</li>
                    <li>• WIP (Work In Progress) limits</li>
                    <li>• Visual workflow management</li>
                    <li>• Cumulative flow diagrams</li>
                    <li>• Flexible prioritization</li>
                  </ul>
                </div>
                <Button className="w-full">Select Kanban</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('template')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Create your {selectedTemplate?.toLowerCase()} space</h1>
          <p className="text-muted-foreground">
            Enter the details for your new space
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Space Details</CardTitle>
            <CardDescription>
              This information can be changed later in space settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Space Name</Label>
              <Input
                id="name"
                placeholder="e.g., Marketing Team, Product Development"
                value={spaceName}
                onChange={(e) => handleSpaceNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Space Key</Label>
              <Input
                id="key"
                placeholder="e.g., MARK, PROD"
                value={spaceKey}
                onChange={(e) => setSpaceKey(e.target.value.toUpperCase())}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                A short identifier (2-10 characters) used in work item keys
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <Button 
                className="w-full" 
                onClick={handleCreateSpace}
                disabled={!spaceName || !spaceKey || isCreating}
              >
                {isCreating ? "Creating..." : "Create Space"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
