import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useActivities } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { Activity, ActivityType, ActivityStatus } from "@shared/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { format, isAfter, isBefore, addDays, startOfDay } from "date-fns";
import { Loader2 } from "lucide-react";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, RefreshCw, Check } from "lucide-react";
import { ImportExcelDialog } from "@/components/import-excel-dialog";

export default function Dashboard() {
    const { user } = useAuth();
    const { activities, isLoading } = useActivities();
    const { toast } = useToast();
    const [isSyncing, setIsSyncing] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Check Outlook connection status on mount
    useEffect(() => {
        fetch('/api/outlook/status')
            .then(res => res.json())
            .then(data => setIsConnected(data.connected))
            .catch(err => console.error("Failed to check outlook status", err));

        // Check for success param from redirect
        const params = new URLSearchParams(window.location.search);
        if (params.get('outlook_connected') === 'true') {
            toast({
                title: "Outlook Connected",
                description: "You successfully connected your Outlook account.",
                variant: "default", // or success if available
            });
            // Clean URL
            window.history.replaceState({}, '', '/dashboard');
            setIsConnected(true);
        }
    }, [toast]);

    const handleOutlookAction = async () => {
        if (!isConnected) {
            window.location.href = '/api/auth/outlook/login';
            return;
        }

        setIsSyncing(true);
        try {
            const res = await fetch('/api/outlook/sync', { method: 'POST' });
            if (!res.ok) throw new Error("Sync failed");
            const data = await res.json();

            toast({
                title: "Sync Completed",
                description: `Synced activities to Outlook.`,
            });
        } catch (error) {
            toast({
                title: "Sync Failed",
                description: "Could not sync with Outlook. Please try reconnecting.",
                variant: "destructive",
            });
        } finally {
            setIsSyncing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Calculate statistics
    const totalActivities = activities.length;

    // 1. Distribution by Type
    const typeData = Object.keys(ACTIVITY_TYPES).map(type => {
        const count = activities.filter(a => a.type === type).length;
        return { name: ACTIVITY_TYPES[type as ActivityType].label, value: count, color: ACTIVITY_TYPES[type as ActivityType].color };
    }).filter(d => d.value > 0);

    // 2. Distribution by Status
    const statusData = Object.keys(ACTIVITY_STATUSES).map(status => {
        const count = activities.filter(a => a.status === status).length;
        return { name: ACTIVITY_STATUSES[status as ActivityStatus].label, value: count, color: ACTIVITY_STATUSES[status as ActivityStatus].color };
    }).filter(d => d.value > 0);

    // 3. Upcoming Deadlines (Next 7 days)
    const today = startOfDay(new Date());
    const nextWeek = addDays(today, 7);

    const upcomingDeadlines = activities
        .filter(a => {
            const end = new Date(a.endDate);
            return isAfter(end, today) && isBefore(end, nextWeek);
        })
        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
        .slice(0, 5); // Top 5

    // Colors for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, {user?.username}. Here's an overview of your activities.
                </p>
            </div>

            <div className="flex justify-end gap-2">
                <ImportExcelDialog />
                <Button
                    onClick={handleOutlookAction}
                    variant={isConnected ? "outline" : "default"}
                    disabled={isSyncing}
                >
                    {isSyncing ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : isConnected ? (
                        <RefreshCw className="mr-2 h-4 w-4" />
                    ) : (
                        <CalendarIcon className="mr-2 h-4 w-4" />
                    )}
                    {isSyncing ? "Syncing..." : isConnected ? "Sync with Outlook" : "Connect Outlook"}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalActivities}</div>
                    </CardContent>
                </Card>
                {/* Add more summary cards here if needed */}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Activity Types</CardTitle>
                        <CardDescription>Distribution of activities by type</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Activity Status</CardTitle>
                        <CardDescription>Current status of all activities</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#82ca9d">
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Deadlines</CardTitle>
                    <CardDescription>Activities ending within the next 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                    {upcomingDeadlines.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No upcoming deadlines this week.</p>
                    ) : (
                        <div className="space-y-4">
                            {upcomingDeadlines.map(activity => (
                                <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{activity.title}</span>
                                        <span className="text-xs text-muted-foreground">{format(new Date(activity.endDate), "PPP p")}</span>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs ${ACTIVITY_TYPES[activity.type as ActivityType]?.color || 'bg-gray-100'}`}>
                                        {activity.type}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
