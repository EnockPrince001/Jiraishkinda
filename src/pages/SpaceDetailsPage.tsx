import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGraphQLClient } from "@/lib/graphql-client";
import { GET_SPACE_DATA } from "@/lib/queries";
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
import { Separator } from "@/components/ui/separator";
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
    const [owner, setOwner] = useState("");
    const [defaultAssignee, setDefaultAssignee] = useState("unassigned");

    const { data, isLoading } = useQuery({
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
            setName(space.name);
            setKey(space.key);
            // Set other fields if available in API
        }
    }, [space]);

    const handleSave = () => {
        // Implement update logic here
        toast({
            title: "Success",
            description: "Space details updated successfully.",
        });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!space) return <div>Space not found</div>;

    return (
        <div className="max-w-2xl mx-auto py-10 px-6 space-y-8">
            <div>
                <h1 className="text-2xl font-semibold">Details</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your space details and settings.</p>
            </div>

            <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-muted/5">
                    <div className="h-24 w-24 rounded bg-blue-500 flex items-center justify-center shadow-lg">
                        <span className="text-4xl font-bold text-white">
                            {space.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <Button variant="outline" size="sm">Change icon</Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="key">Space key <span className="text-red-500">*</span></Label>
                        <Input
                            id="key"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            disabled
                            className="bg-muted"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
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

                    <div className="space-y-2">
                        <Label>Space owner</Label>
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/20">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px] bg-green-600 text-white">
                                    {space.members?.find((m: any) => m.role === 'ADMIN')?.user?.userName?.charAt(0).toUpperCase() || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                                {space.members?.find((m: any) => m.role === 'ADMIN')?.user?.userName || "Unknown"}
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Make sure your space lead has access to work items in the space.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assignee">Default assignee</Label>
                        <Select value={defaultAssignee} onValueChange={setDefaultAssignee}>
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

                <Button onClick={handleSave}>Save changes</Button>
            </div>
        </div>
    );
}
