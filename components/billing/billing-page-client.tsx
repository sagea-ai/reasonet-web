'use client'

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layouts/app-layout";
import { useUser } from "@clerk/nextjs";
import { TrialProvider } from "@/components/trial/trial-provider";
import { TrialBannerWrapper } from "@/components/trial/trial-banner-wrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, Shield, Users, ArrowRight, BarChart3, Clock } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface BillingPageClientProps {
  organizations: Organization[];
  currentOrganization: Organization;
}

interface UsageHistoryPoint {
  date: string;
  analysesRun: number;
}

interface RecentRun {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export function BillingPageClient({ 
  organizations, 
  currentOrganization: initialOrganization 
}: BillingPageClientProps) {
  const [currentOrganization, setCurrentOrganization] = useState(initialOrganization);
  const { user } = useUser();

  // --- ssage dtate, dont modify ---
  const [usage, setUsage] = useState<{
    analysesRun: number;
    analysesLimit: number;
    remaining: number;
    loading: boolean;
    tier?: string;
  }>({
    analysesRun: 0,
    analysesLimit: 10,
    remaining: 10,
    loading: true,
  });

  const [usageHistory, setUsageHistory] = useState<UsageHistoryPoint[]>([]);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchUsage = async (orgId: string) => {
    setUsage(u => ({ ...u, loading: true }));
    try {
      const res = await fetch(`/api/billing/usage?organizationId=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setUsage({
          analysesRun: data.analysesRun,
          analysesLimit: data.analysesLimit,
          remaining: data.analysesLimit === -1 ? -1 : Math.max(0, data.analysesLimit - data.analysesRun),
          loading: false,
          tier: data.tier,
        });
      } else {
        setUsage(u => ({ ...u, loading: false }));
      }
    } catch {
      setUsage(u => ({ ...u, loading: false }));
    }
  };

  const fetchHistoryAndRuns = async (orgId: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/usage-history`);
      let history: UsageHistoryPoint[] = [];
      if (res.ok) {
        history = await res.json();
      }
      setUsageHistory(history);

      const runsRes = await fetch(`/api/organizations/fetch/${orgId}/analyses`);
      let runs: RecentRun[] = [];
      if (runsRes.ok) {
        const data = await runsRes.json();
        runs = (data || []).slice(0, 5).map((a: any) => ({
          id: a.id,
          name: a.name,
          status: a.status,
          createdAt: a.createdAt,
        }));
      }
      setRecentRuns(runs);
    } catch {
      setUsageHistory([]);
      setRecentRuns([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchUsage(currentOrganization.id);
    fetchHistoryAndRuns(currentOrganization.id);
  }, [currentOrganization.id]);

  const handleOrganizationChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
    }
  };

  const usageChartData = {
    labels: usageHistory.map((h) => h.date),
    datasets: [
      {
        label: "Analyses Run",
        data: usageHistory.map((h) => h.analysesRun),
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139,92,246,0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };
  const usageChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#18181b",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#a78bfa",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#a1a1aa", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(139,92,246,0.07)" },
        ticks: { color: "#a1a1aa", font: { size: 11 } },
      },
    },
  };

  return (
    <AppLayout
      organizations={organizations}
      currentOrganization={currentOrganization}
      onOrganizationChange={handleOrganizationChange}
      user={{
        fullName: user?.fullName || undefined,
        firstName: user?.firstName || undefined,
        lastName: user?.lastName || undefined,
      }}
    >
      <TrialProvider>
        <TrialBannerWrapper />
        <div className="max-w-5xl mx-auto py-6 px-2 sm:px-4">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Billing & Plans
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-base">
              Choose the right plan for your team and unlock advanced code analysis.
            </p>
          </div>

                    {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Pro Plan */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow duration-200 p-2">
              <CardHeader className="pb-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-600" />
                  <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                    Pro
                  </CardTitle>
                  <Badge variant="outline" className="ml-2 border-gray-200 dark:border-gray-700 text-xs text-sky-700 dark:text-sky-300 bg-white dark:bg-gray-950">
                    Most Popular
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">$29</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/mo</span>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Up to 1 organization
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Up to 100 PR reviews/month
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Unlimited code reviews & analyses
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Advanced bug & security detection
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Up to 10 team members
                  </li>
                </ul>
                <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 rounded-lg transition-all duration-150 text-sm">
                  Upgrade to Pro
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow duration-200 p-2">
              <CardHeader className="pb-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-sky-600" />
                  <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                    Enterprise
                  </CardTitle>
                  <Badge variant="outline" className="ml-2 border-gray-200 dark:border-gray-700 text-xs text-sky-700 dark:text-sky-300 bg-white dark:bg-gray-950">
                    Best for Scale
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Contact Sales</span>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Everything in Pro, plus:
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <Users className="h-4 w-4 text-sky-500" />
                    Unlimited team members
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <Shield className="h-4 w-4 text-sky-500" />
                    SSO, audit logs, custom integrations
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <Sparkles className="h-4 w-4 text-sky-500" />
                    Dedicated onboarding & support
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Unlimited organizations & PR reviews
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-200 dark:border-gray-700 text-sky-700 dark:text-sky-300 font-semibold py-2 rounded-lg transition-all duration-150 text-sm"
                  asChild
                >
                  <a href="mailto:enterprise@sagea.space">
                    Contact Sales
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Need a custom plan or have questions?{" "}
              <a href="mailto:support@sagea.space" className="text-sky-600 hover:underline">
                Contact us
              </a>
            </span>
          </div>


          {/* --- Usage Section --- */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              {/* Analyses Run */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm p-2">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-sky-500" />
                    Analyses Run
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Total analyses this billing period.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-1">
                  {usage.loading ? (
                    <div className="text-xl text-muted-foreground animate-pulse">--</div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{usage.analysesRun}</div>
                  )}
                </CardContent>
              </Card>
              {/* Limit */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm p-2">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sky-500" />
                    Limit
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Monthly analysis limit.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-1">
                  {usage.loading ? (
                    <div className="text-xl text-muted-foreground animate-pulse">--</div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {usage.analysesLimit === -1 ? "Unlimited" : usage.analysesLimit}
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Remaining */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm p-2">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-500" />
                    Remaining
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Analyses left this period.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-1">
                  {usage.loading ? (
                    <div className="text-xl text-muted-foreground animate-pulse">--</div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {usage.analysesLimit === -1 ? "Unlimited" : usage.remaining}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Usage Graph & Recent Runs side by side on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Usage Graph */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm h-full">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-sky-500" />
                    Usage Over Time
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Analyses usage trend.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-1">
                  {loadingHistory ? (
                    <div className="h-32 flex items-center justify-center text-muted-foreground animate-pulse">Loading...</div>
                  ) : (
                    <div className="h-36 md:h-40">
                      <Line data={usageChartData} options={usageChartOptions} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Runs */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm h-full">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sky-500" />
                    Recent Runs
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Latest analyses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-1">
                  {loadingHistory ? (
                    <div className="text-muted-foreground animate-pulse">Loading...</div>
                  ) : recentRuns.length === 0 ? (
                    <div className="text-xs text-gray-400">No recent runs.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr>
                            <th className="text-left py-1 pr-2 font-medium text-gray-500">Name</th>
                            <th className="text-left py-1 pr-2 font-medium text-gray-500">Status</th>
                            <th className="text-left py-1 font-medium text-gray-500">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentRuns.map(run => (
                            <tr key={run.id}>
                              <td className="py-1 pr-2">{run.name}</td>
                              <td className="py-1 pr-2">
                                <span className={
                                  run.status === "COMPLETED"
                                    ? "text-green-600"
                                    : run.status === "FAILED"
                                    ? "text-red-600"
                                    : run.status === "PROCESSING"
                                    ? "text-sky-600"
                                    : "text-yellow-600"
                                }>
                                  {run.status}
                                </span>
                              </td>
                              <td className="py-1">{new Date(run.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </TrialProvider>
    </AppLayout>
  );
}