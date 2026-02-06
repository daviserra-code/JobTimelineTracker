import { useQuery } from "@tanstack/react-query";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    useNodesState,
    useEdgesState,
    MarkerType
} from "reactflow";
import "reactflow/dist/style.css";
import { Activity, User } from "@shared/schema";
import { useMemo, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

export default function KnowledgeGraph() {
    const { data: activities, isLoading: isActivitiesLoading } = useQuery<Activity[]>({
        queryKey: ["/api/activities"],
    });

    const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

    // Calculate nodes and edges
    const { nodes, edges } = useMemo(() => {
        if (!activities || !users) return { nodes: [], edges: [] };

        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // Create User Nodes
        users.forEach((user, index) => {
            nodes.push({
                id: `user-${user.id}`,
                type: 'input', // Input type for root nodes usually
                data: { label: user.username },
                position: { x: 250 * index, y: 50 },
                style: {
                    background: '#f8fafc',
                    border: '1px solid #94a3b8',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: 'bold',
                    width: 150,
                    textAlign: 'center'
                },
            });
        });

        // Create Activity Nodes and Edges
        // Position activities under their respective users (or generically if multiple users, but let's assume createdBy for now)
        // Activities will be positioned in a grid layout below users

        let activityY = 200;
        let activityX = 0;
        const itemsPerRow = 5;

        activities.forEach((activity, index) => {
            const creatorId = activity.createdBy; // Assuming simple ownership for now

            nodes.push({
                id: `activity-${activity.id}`,
                data: {
                    label: (
                        <div className="text-xs">
                            <div className="font-bold truncate">{activity.title}</div>
                            <div className="text-[10px] opacity-70">{format(new Date(activity.startDate), 'MMM d, yyyy')}</div>
                            <div className="text-[10px] opacity-70">{activity.type}</div>
                        </div>
                    )
                },
                position: {
                    x: (index % itemsPerRow) * 200,
                    y: activityY + (Math.floor(index / itemsPerRow) * 100)
                },
                style: {
                    background: getColorForType(activity.type),
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    width: 180,
                }
            });

            // Create edge from User to Activity
            if (creatorId) {
                edges.push({
                    id: `e-${creatorId}-${activity.id}`,
                    source: `user-${creatorId}`,
                    target: `activity-${activity.id}`,
                    animated: true,
                    style: { stroke: '#cbd5e1' },
                    markerEnd: { type: MarkerType.ArrowClosed },
                });
            }
        });

        return { nodes, edges };
    }, [activities, users]);

    const [rfNodes, setNodes, onNodesChange] = useNodesState(nodes);
    const [rfEdges, setEdges, onEdgesChange] = useEdgesState(edges);

    // Update nodes/edges when data changes
    useEffect(() => {
        setNodes(nodes);
        setEdges(edges);
    }, [nodes, edges, setNodes, setEdges]);

    if (isActivitiesLoading || isUsersLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="p-4 h-[calc(100vh-80px)] flex flex-col space-y-4 tour-knowledge-graph">
            <Card className="flex-grow flex flex-col overflow-hidden border-none shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle>Activity Knowledge Graph</CardTitle>
                    <CardDescription>Visualizing relationships between users and activities</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow p-0 h-full relative" style={{ minHeight: '500px' }}>
                    <ReactFlow
                        nodes={rfNodes}
                        edges={rfEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        fitView
                        attributionPosition="bottom-right"
                    >
                        <MiniMap
                            nodeStrokeColor={(n) => {
                                if (n.style?.background) return n.style.background as string;
                                return '#eee';
                            }}
                            nodeColor={(n) => {
                                if (n.style?.background) return n.style.background as string;
                                return '#fff';
                            }}
                        />
                        <Controls />
                        <Background gap={12} size={1} />
                    </ReactFlow>
                </CardContent>
            </Card>
        </div>
    );
}

function getColorForType(type: string): string {
    switch (type.toLowerCase()) {
        case 'project': return '#dbeafe'; // blue-100
        case 'meeting': return '#fce7f3'; // pink-100
        case 'training': return '#dcfce7'; // green-100
        case 'holiday': return '#ffedd5'; // orange-100
        default: return '#f1f5f9'; // slate-100
    }
}
