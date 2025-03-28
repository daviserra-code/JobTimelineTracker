import { useState, useEffect } from "react";

interface DashboardStats {
  totalActivities: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byMonth: Record<string, number>;
  byCategory: Record<string, number>;
}

export default function DashboardTestPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/dashboard/stats");
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        const data = await response.json();
        setStats(data);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="p-8">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="p-8" style={{ color: "red" }}>Error loading dashboard data: {error}</div>;
  }

  if (!stats) {
    return <div className="p-8">No dashboard data available</div>;
  }

  return (
    <div className="container p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Test Page</h1>
      
      <div className="mb-6 p-4 border rounded-md shadow-sm">
        <h2 className="text-xl font-bold mb-2">Dashboard Data</h2>
        <p className="mb-2 text-gray-600">Raw data from API</p>
        <pre className="p-4 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(stats, null, 2)}
        </pre>
      </div>
      
      <div className="mb-6 p-4 border rounded-md shadow-sm">
        <h2 className="text-xl font-bold mb-2">Total Activities</h2>
        <div className="text-4xl font-bold">{stats.totalActivities}</div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-4 border rounded-md shadow-sm">
          <h2 className="text-xl font-bold mb-2">Activity Types</h2>
          <ul className="space-y-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <li key={type} className="flex justify-between">
                <span className="capitalize">{type}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 border rounded-md shadow-sm">
          <h2 className="text-xl font-bold mb-2">Activity Status</h2>
          <ul className="space-y-2">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <li key={status} className="flex justify-between">
                <span className="capitalize">{status}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}