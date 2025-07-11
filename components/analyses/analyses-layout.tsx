import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Code, 
  RefreshCw, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

interface Repository {
  id: string;
  name: string;
  fullName: string;
  language?: string | null;
}

interface AnalysisResult {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  file: string;
  lineNumber: number;
  message: string;
  code: string;
}

interface Analysis {
  id: string;
  name: string;
  status: 'PENDING' | 'PROCESSING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  repository: Repository;
  _count: {
    results: number;
  };
  results?: AnalysisResult[];
}

interface AnalysesLayoutProps {
  organizationName: string;
  analyses: Analysis[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateAnalysis: () => void;
}

export function AnalysesLayout({
  organizationName,
  analyses,
  isLoading,
  onRefresh,
  onCreateAnalysis
}: AnalysesLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAnalyses = useMemo(() => {
    return analyses.filter(analysis => 
      analysis.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      analysis.repository.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [analyses, searchQuery]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'RUNNING':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white">
            Analyses
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {organizationName} • {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            onClick={onCreateAnalysis}
            className="gap-2 bg-sky-600 hover:bg-sky-700 text-white"
          >
            <Plus className="h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search analyses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Analyses List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
          <span className="ml-2 text-lg text-gray-600">Loading analyses...</span>
        </div>
      ) : filteredAnalyses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredAnalyses.map((analysis) => (
            <Link 
              key={analysis.id} 
              href={`/analyses/${analysis.id}`} 
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      {analysis.name}
                      <Badge
                        variant={
                          analysis.status === 'COMPLETED' ? 'default' :
                          analysis.status === 'RUNNING' ? 'secondary' :
                          analysis.status === 'FAILED' ? 'destructive' : 'outline'
                        }
                        className="ml-2"
                      >
                        {analysis.status.charAt(0) + analysis.status.slice(1).toLowerCase()}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Repository: {analysis.repository.name}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(analysis.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(analysis.createdAt)}
                      </div>
                      {analysis.completedAt && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {formatDate(analysis.completedAt)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="ml-2">
                        {analysis._count.results} {analysis._count.results === 1 ? 'issue' : 'issues'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800 shadow-sm">
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900 dark:to-sky-800 rounded-2xl flex items-center justify-center shadow-inner">
                  <Code className="h-8 w-8 text-sky-500 dark:text-sky-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight">
                    No Analyses Found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-base font-light max-w-md leading-relaxed">
                    {searchQuery ? 
                      "No analyses match your search criteria. Try a different search term." :
                      "You haven't run any code analyses yet. Start your first analysis to identify issues in your code."
                    }
                  </p>
                </div>
              </div>
              <Button 
                onClick={onCreateAnalysis}
                className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-xl font-medium tracking-wide transition-all duration-200 ease-out hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] gap-2"
              >
                <Code className="h-4 w-4" />
                Start New Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
