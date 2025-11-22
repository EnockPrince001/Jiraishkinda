import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGraphQLClient } from "@/lib/graphql-client";
import { GET_SPACE_DATA, INVITE_USER_TO_SPACE } from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Search, UserPlus, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SpaceAccessPage() {
    const { spaceKey } = useParams();
    const { token } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("MEMBER");

    const { data, isLoading } = useQuery({
        queryKey: ["space", spaceKey, token],
        queryFn: async () => {
            const client = getGraphQLClient(token || undefined);
            return client.request(GET_SPACE_DATA, { spaceKey });
        },
        enabled: !!spaceKey && !!token,
    });

    const inviteMutation = useMutation({
        mutationFn: async () => {
            const client = getGraphQLClient(token || undefined);
            const spaceData = (data as any)?.space;
            const spaceId = Array.isArray(spaceData) ? spaceData[0]?.id : spaceData?.id;
            return client.request(INVITE_USER_TO_SPACE, {
                input: {
                    spaceId: spaceId,
                    email: inviteEmail,
                    role: inviteRole
                }
            });
        },
        onSuccess: () => {
            toast({ title: "Success", description: "User invited successfully" });
            setIsInviteOpen(false);
            setInviteEmail("");
            queryClient.invalidateQueries({ queryKey: ["space", spaceKey] });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to invite user", variant: "destructive" });
        }
    });

    const spaceData = (data as any)?.space;
    const space = Array.isArray(spaceData) ? spaceData[0] : spaceData;
    const members = space?.members || [];

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!space) return <div>Space not found</div>;

    return (
        <div className="max-w-5xl mx-auto py-10 px-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Access</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage access to your space.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add people
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add people</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Names or emails</label>
                                    <Input
                                        placeholder="e.g., Maria, maria@company.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <Select value={inviteRole} onValueChange={setInviteRole}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Administrator</SelectItem>
                                            <SelectItem value="MEMBER">Member</SelectItem>
                                            <SelectItem value="VIEWER">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                                <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending}>
                                    {inviteMutation.isPending ? "Adding..." : "Add"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline">Manage roles</Button>
                </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 flex gap-4 items-start">
                <ShieldAlert className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                    <h3 className="font-medium text-purple-900 dark:text-purple-300">Grant the power of releases</h3>
                    <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                        You can give users in a project the permission to Manage Versions (Releases) without granting project admin permission.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search roles" className="pl-9" />
                    </div>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member: any, i: number) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                    {member.user.userName.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{member.user.userName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {member.user.email || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Select defaultValue={member.role}>
                                            <SelectTrigger className="h-8 w-[140px] border-transparent hover:bg-muted/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ADMIN">Administrator</SelectItem>
                                                <SelectItem value="MEMBER">Member</SelectItem>
                                                <SelectItem value="VIEWER">Viewer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50">
                                            Remove
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
