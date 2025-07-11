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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-sky-950 dark:to-gray-950">
      <TrialProvider>
        {/* Trial Banner (must keep) - full width ribbon style */}
        <div className="w-full">
          <TrialBannerWrapper />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Greeting Section */}
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
            {/* Quick Actions Card */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400 dark:text-sky-300" /> Start Analysis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-4 bg-sky-50 dark:bg-sky-900/30 rounded-xl border border-sky-100 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors group">
                  <div>
                    <h3 className="font-medium text-sky-900 dark:text-sky-100 flex items-center gap-2">
                      <EclipseIcon className="w-4 h-4 text-sky-400 group-hover:text-sky-600 transition" /> New Startup Idea
                    </h3>
                    <p className="text-sm text-sky-700 dark:text-sky-300">Get investor-like feedback</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-sky-500 group-hover:text-sky-600 transition" />
                </button>
                <button className="flex items-center justify-between p-4 bg-sky-50 dark:bg-sky-900/30 rounded-xl border border-sky-100 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors group">
                  <div>
                    <h3 className="font-medium text-sky-900 dark:text-sky-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-sky-400 group-hover:text-sky-600 transition" /> GTM Strategy
                    </h3>
                    <p className="text-sm text-sky-700 dark:text-sky-300">Validate your approach</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-sky-500 group-hover:text-sky-600 transition" />
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
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">-</p>
                </div>
              </div>
            </div>

            {/* Recent Analyses */}
            <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-400 dark:text-sky-300" /> Recent Analyses
              </h2>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No analyses yet. Start by creating your first analysis above.</p>
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
              {/* Chart.js Line chart placeholder, expects real data via props */}
              <div className="flex-1 flex items-center justify-center min-h-[220px]">
                <Line
                  data={{ labels: [], datasets: [] }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { title: { display: true, text: 'Date' } },
                      y: { title: { display: true, text: 'Score' }, min: 0, max: 100 }
                    }
                  }}
                />
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Track how your startup idea scores evolve over time.</p>
            </div>
            {/* GTM & Defensibility Radar Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-800 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-400 dark:text-sky-300" /> GTM & Defensibility Overview
              </h2>
              {/* Chart.js Radar chart placeholder, expects real data via props */}
              <div className="flex-1 flex items-center justify-center min-h-[220px]">
                {/* Radar chart placeholder, to be replaced with real data */}
                <span className="text-gray-400 dark:text-gray-600 text-sm">Radar chart will visualize GTM, Defensibility, Vision, etc.</span>
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">See your strengths and weaknesses across key axes.</p>
            </div>
          </div>
        </div>
      </TrialProvider>
    </div>
  );
}