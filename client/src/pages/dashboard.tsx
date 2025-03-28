import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Activity } from "@shared/schema";
import { Spinner } from "@/components/ui/spinner";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler
} from "chart.js";
import { Bar, Pie, Line, Radar } from "react-chartjs-2";
import { motion } from "framer-motion";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler
);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

export default function DashboardPage() {
  // Define type for dashboard statistics
  interface DashboardStats {
    totalActivities: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byMonth: Record<string, number>;
    byCategory: Record<string, number>;
  }
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Charts data state
  const [activityTypeData, setActivityTypeData] = useState<any>(null);
  const [activityStatusData, setActivityStatusData] = useState<any>(null);
  const [monthlyActivityData, setMonthlyActivityData] = useState<any>(null);
  const [categoryDistributionData, setCategoryDistributionData] = useState<any>(null);

  useEffect(() => {
    if (stats) {
      processChartData(stats);
    }
  }, [stats]);

  const processChartData = (stats: DashboardStats) => {
    // Activity Types Chart (Pie)
    const activityTypes = stats.byType;

    setActivityTypeData({
      labels: Object.keys(activityTypes).map(type => 
        type.charAt(0).toUpperCase() + type.slice(1)
      ),
      datasets: [
        {
          label: 'Activities by Type',
          data: Object.values(activityTypes),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        },
      ],
    });

    // Activity Status Chart (Bar)
    const activityStatuses = stats.byStatus;

    setActivityStatusData({
      labels: Object.keys(activityStatuses).map(status => 
        status.charAt(0).toUpperCase() + status.slice(1)
      ),
      datasets: [
        {
          label: 'Activities by Status',
          data: Object.values(activityStatuses),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    });

    // Monthly Activity Count (Line)
    const monthlyActivities = stats.byMonth;

    // Sort months chronologically
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const sortedMonthsData: Record<string, number> = {};
    
    months.forEach(month => {
      if (monthlyActivities[month]) {
        sortedMonthsData[month] = monthlyActivities[month];
      } else {
        sortedMonthsData[month] = 0;
      }
    });

    setMonthlyActivityData({
      labels: Object.keys(sortedMonthsData),
      datasets: [
        {
          label: 'Activities per Month',
          data: Object.values(sortedMonthsData),
          fill: false,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          tension: 0.4,
        },
      ],
    });

    // Category Distribution (Radar)
    const categories = stats.byCategory;

    setCategoryDistributionData({
      labels: Object.keys(categories).map(category => 
        category.charAt(0).toUpperCase() + category.slice(1)
      ),
      datasets: [
        {
          label: 'Category Distribution',
          data: Object.values(categories),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          pointBackgroundColor: 'rgba(255, 99, 132, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
        },
      ],
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Activity Dashboard</h1>
      
      {/* Total Activities Card */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="mb-6"
      >
        <Card className="bg-gradient-to-r from-primary/80 to-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Total Activities</h2>
                <p className="text-white/80">All activities in your calendar</p>
              </div>
              <div className="text-4xl font-bold text-white">{stats?.totalActivities || 0}</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2"
      >
        {/* Activity Type Distribution */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Activity Types</CardTitle>
              <CardDescription>
                Distribution of activities by type
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {activityTypeData && <Pie data={activityTypeData} options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  }
                }
              }} />}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Activity Status Distribution */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Activity Status</CardTitle>
              <CardDescription>
                Distribution of activities by status
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {activityStatusData && <Bar data={activityStatusData} options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  }
                }
              }} />}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Monthly Activity Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activities</CardTitle>
              <CardDescription>
                Number of activities per month
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {monthlyActivityData && <Line data={monthlyActivityData} options={{ 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  }
                }
              }} />}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Category Distribution */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>
                Activities by category
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {categoryDistributionData && <Radar data={categoryDistributionData} options={{ 
                maintainAspectRatio: false,
                scales: {
                  r: {
                    beginAtZero: true
                  }
                }
              }} />}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}