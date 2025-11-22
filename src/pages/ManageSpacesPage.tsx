import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGraphQLClient } from "@/lib/graphql-client";
import { GET_ME } from "@/lib/queries";
import { useAuth } from "@/context/AuthContext";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageSpacesPage() {
    const { token } = useAuth();
    const [search, setSearch] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["me", token],
        queryFn: async () => {
            const client = getGraphQLClient(token || undefined);
            return client.request(GET_ME);
        },
        enabled: !!token,
    });

    const meData = (data as any)?.me;
    const spaces = Array.isArray(meData) ? meData[0]?.spaces : meData?.spaces || [];

    const filteredSpaces = spaces.filter((s: any) =>
        s.space.name.toLowerCase().includes(search.toLowerCase()) ||
        s.space.key.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Manage Spaces</h1>
                <Button>Create space</Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search spaces"
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30px]"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Key</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Lead</TableHead>
                            <TableHead>Last work update</TableHead>
                            <TableHead className="w-[50px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            filteredSpaces.map((item: any) => (
                                <TableRow key={item.space.id}>
                                    <TableCell>
                                        <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                            {item.space.name.charAt(0).toUpperCase()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            to={`/spaces/${item.space.key}/settings/details`}
                                            className="font-medium hover:underline text-primary"
                                        >
                                            {item.space.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{item.space.key}</TableCell>
                                    <TableCell className="text-muted-foreground">{item.space.type || "Software"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-[10px]">ME</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm">Me</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">Just now</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
