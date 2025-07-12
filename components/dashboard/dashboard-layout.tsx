import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Calendar, Github, Code, ArrowRight, MessageSquare, TrendingUp, Sparkles,EclipseIcon } from "lucide-react"
import Link from "next/link"
import { TrialProvider } from "../trial/trial-provider"
import { TrialBannerWrapper } from "../trial/trial-banner-wrapper"
import { Line } from "react-chartjs-2"
import { useState } from "react"
import { TimeRangeOption } from "@/types/types"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface WeeklyActivity {
  commits: number[];
  prs: number[];
  comments: number[];
  days: string[];
}

interface AnalyticsData {
  avgTimeToMerge: number;
  avgPrSize: number;
  commentsPerPr: number;
  weeklyActivity: WeeklyActivity;
  repositoriesCount: number;
  timeToMergeTrend: number;
}

interface DashboardLayoutProps {
  organizationName?: string;
  organizationId?: string;
  hasConnectedRepositories?: boolean;
  repositoriesCount?: number;
  isLoading?: boolean;
  analyticsData?: AnalyticsData;
  userName?: string;
}

// Time-based greeting function
function getTimeBasedGreeting(userName?: string): string {
  const hour = new Date().getHours();
  const name = userName ? `, ${userName}` : "";
  
  if (hour >= 5 && hour < 12) {
    return `Good Morning${name}`;
  } else if (hour >= 12 && hour < 17) {
    return `Good Afternoon${name}`;
  } else if (hour >= 17 && hour < 22) {
    return `Good Evening${name}`;
  } else {
    return `Good Night${name}`;
  }
}

export function DashboardLayout({ 
  organizationName, 
  organizationId,
  userName,
  isLoading = false,
}: DashboardLayoutProps) {
  const greeting = getTimeBasedGreeting(userName);

  // Mock data for demonstration
  const mockStats = {
    ideasAnalyzed: 3,
    averageScore: 67
  };

  const mockRecentAnalyses = [
    {
      id: 1,
      title: "AI-powered meal planning app",
      score: 72,
      date: "2 days ago",
      status: "completed",
      insights: "Strong market demand, moderate competition"
    },
    {
      id: 2,
      title: "Sustainable packaging for e-commerce",
      score: 85,
      date: "1 week ago", 
      status: "completed",
      insights: "High defensibility, growing market"
    },
    {
      id: 3,
      title: "Remote team collaboration tool",
      score: 45,
      date: "2 weeks ago",
      status: "completed", 
      insights: "Crowded market, needs differentiation"
    }
  ];

  const mockChartData = {
    labels: ['2 weeks ago', '1 week ago', '2 days ago'],
    datasets: [
      {
        label: 'Analysis Score',
        data: [45, 85, 72],
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-sky-950 dark:to-gray-950">
      <TrialProvider>
        {/* Trial Banner (must keep) - full width ribbon style */}
        <div className="w-full">
          <TrialBannerWrapper />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {greeting}
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Let's stress-test your startup ideas and get valuable insights.
            </p>
          </div>

          {/* Main Grid Layout (Start Analysis, Stats, Recent Analyses) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400 dark:text-sky-300" /> Start Analysis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-4 bg-sky-50 dark:bg-sky-900/30 rounded-xl border border-sky-100 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors group">
                  <Link href="/simulate">
                  <div>
                    <h3 className="font-medium text-sky-900 dark:text-sky-100 flex items-center gap-2">
                      <EclipseIcon className="w-4 h-4 text-sky-400 group-hover:text-sky-600 transition" /> New Startup Idea
                    </h3>
                    <p className="text-sm text-sky-700 dark:text-sky-300">Get investor-like feedback</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-sky-500 group-hover:text-sky-600 transition" />
                  </Link>
                </button>

                <button className="flex items-center justify-between p-4 bg-sky-50 dark:bg-sky-900/30 rounded-xl border border-sky-100 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors group">
                  <Link href="/Deep Research">
                  <div>
                    <h3 className="font-medium text-sky-900 dark:text-sky-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-sky-400 group-hover:text-sky-600 transition" /> Deep Research
                    </h3>
                    <p className="text-sm text-sky-700 dark:text-sky-300">Validate your approach</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-sky-500 group-hover:text-sky-600 transition" />
                  </Link>
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-400 dark:text-sky-300" /> Your Stats
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ideas Analyzed</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{mockStats.ideasAnalyzed}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{mockStats.averageScore}</p>
                </div>
              </div>
            </div>

            {/* Recent Analyses */}
            <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-400 dark:text-sky-300" /> Recent Analyses
              </h2>
              <div className="space-y-3">
                {mockRecentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{analysis.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{analysis.insights}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{analysis.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          analysis.score >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          analysis.score >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {analysis.score}/100
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights Section (Graphs) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Startup Analysis Score Trend */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-400 dark:text-sky-300" /> Startup Analysis Score Trend
              </h2>
              <div className="flex-1 flex items-center justify-center min-h-[220px]">
                <Line
                  data={mockChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                      }
                    },
                    scales: {
                      x: { 
                        title: { display: true, text: 'Timeline' },
                        grid: { display: false }
                      },
                      y: { 
                        title: { display: true, text: 'Score' }, 
                        min: 0, 
                        max: 100,
                        grid: { color: 'rgba(0, 0, 0, 0.1)' }
                      }
                    }
                  }}
                />
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Track how your startup idea scores evolve over time.</p>
            </div>
            {/* GTM & Defensibility Radar Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-400 dark:text-sky-300" /> Analysis Breakdown
              </h2>
              <div className="flex-1 flex items-center justify-center min-h-[220px]">
                <div className="text-center space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-sky-50 dark:bg-sky-900/30 p-3 rounded-lg">
                      <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Market Size</p>
                      <p className="text-lg font-semibold text-sky-800 dark:text-sky-200">8.2/10</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Defensibility</p>
                      <p className="text-lg font-semibold text-green-800 dark:text-green-200">7.1/10</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">GTM Strategy</p>
                      <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">6.5/10</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Team Fit</p>
                      <p className="text-lg font-semibold text-purple-800 dark:text-purple-200">7.8/10</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">See your strengths and weaknesses across key dimensions.</p>
            </div>
          </div>
        </div>
      </TrialProvider>
    </div>
  );
}