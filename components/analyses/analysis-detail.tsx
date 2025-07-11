'use client';

import React, { useState, useEffect } from 'react';
import { PRGistResult } from "@/analyses/pr-gist";
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, FileCode, Shield, ListIcon, ArrowLeft, ExternalLink, GitBranch } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DiffViewer } from "./diff-viewer";
import { PRGistView } from "./pr-gist-view";
import Link from 'next/link';
import { toast } from 'sonner';

interface Repository {
  id: string;
  name: string;
  fullName: string;
  language?: string | null;
}

interface AnalysisResult {
  id: string;
  type: 'CODE_QUALITY' | 'SECURITY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  location: string;
  lineStart: number;
  lineEnd: number;
  code: string;
  status: 'OPEN' | 'FIXED' | 'IGNORED';
}

interface Analysis {
  id: string;
  name: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  type: string;
  prNumber: number | null;
  branch: string | null;
  commit: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  repository: Repository;
  results: AnalysisResult[];
  options?: {
    diff?: string;
    error?: string;
    gistUrl?: string;
    prGist?: Record<string, any>;
  };
}

export function AnalysisDetail({ id }: { id: string }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gist');

  useEffect(() => {
    if (id) {
      fetchAnalysisDetails(id);
    }
  }, [id]);

  const fetchAnalysisDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analyses/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis details');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching analysis details:', error);
      toast.error('Failed to load analysis details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Analysis['status']) => {
    const variants = {
      PENDING: { 
        className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800", 
        icon: Clock, 
        text: "Pending" 
      },
      PROCESSING: { 
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800", 
        icon: Clock, 
        text: "Processing" 
      },
      COMPLETED: { 
        className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800", 
        icon: CheckCircle, 
        text: "Completed" 
      },
      FAILED: { 
        className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800", 
        icon: AlertTriangle, 
        text: "Failed" 
      },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        <Icon size={12} className={status === 'PROCESSING' ? 'animate-spin' : ''} />
        {config.text}
      </span>
    );
  };

  const getSeverityColor = (severity: AnalysisResult['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-600';
      case 'HIGH':
        return 'text-orange-500';
      case 'MEDIUM':
        return 'text-amber-500';
      case 'LOW':
        return 'text-blue-500';
      case 'INFO':
        return 'text-gray-500';
      default:
        return '';
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <span className="text-lg text-gray-600 dark:text-gray-400">Loading analysis...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Analysis Not Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Could not retrieve the analysis details.
            </p>
          </div>
          <Link href="/analyses">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analyses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="px-6 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/analyses">
                <Button variant="ghost" size="sm" className="gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Analyses
                </Button>
              </Link>
              {analysis && getStatusBadge(analysis.status)}
            </div>
            
            {analysis && (
              <div className="space-y-3">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {analysis.name}
                </h1>
                
                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    <span className="font-medium">{analysis.repository?.fullName}</span>
                  </div>
                  
                  {analysis.prNumber && (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      Pull Request #{analysis.prNumber}
                    </span>
                  )}
                  
                  {analysis.branch && (
                    <code className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 font-mono">
                      {analysis.branch}
                    </code>
                  )}
                  
                  {analysis.options?.gistUrl && (
                    <a 
                      href={analysis.options.gistUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Gist
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {analysis && (
          <div className="px-6 py-6">
            {/* Error State */}
            {analysis.status === 'FAILED' && (
              <div className="mb-6 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-700 dark:text-red-400 mb-1">
                      Analysis Failed
                    </h3>
                    <p className="text-red-600 dark:text-red-300 text-sm">
                      {analysis.options?.error || 'The analysis process encountered an error and could not complete.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-800">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('gist')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'gist'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ListIcon className="h-4 w-4" />
                      Summary
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('issues')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'issues'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Issues ({analysis.results?.length || 0})
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('diff')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'diff'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      Code Changes
                    </div>
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'gist' && (
                <div className="max-w-4xl">
                  {analysis.options?.prGist ? (
                    <PRGistView prGist={analysis.options.prGist as unknown as PRGistResult} />
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-12 text-center">
                      <ListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Summary Available
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        The analysis summary could not be generated for this pull request.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'issues' && (
                <div className="max-w-5xl space-y-4">
                  {analysis.results && analysis.results.length > 0 ? (
                    analysis.results.map((result: AnalysisResult) => (
                      <div key={result.id} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {result.type === 'SECURITY' ? (
                                <Shield className="h-5 w-5 text-red-500 flex-shrink-0" />
                              ) : (
                                <FileCode className="h-5 w-5 text-blue-500 flex-shrink-0" />
                              )}
                              <div>
                                <h3 className={`font-medium ${getSeverityColor(result.severity)}`}>
                                  {result.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  <span>{result.location}</span>
                                  {result.lineStart && (
                                    <span>• Line {result.lineStart}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge 
                              variant={result.severity === 'CRITICAL' || result.severity === 'HIGH' ? 'destructive' : 'outline'}
                              className="flex-shrink-0"
                            >
                              {result.severity}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          {result.description && (
                            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                              {result.description}
                            </p>
                          )}
                          
                          {result.code && (
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto border border-gray-200 dark:border-gray-800">
                              <pre className="text-sm font-mono text-gray-800 dark:text-gray-200">
                                {result.code}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-12 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Issues Found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Great news! The analysis didn't detect any security or code quality issues.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'diff' && (
                <div className="max-w-6xl">
                  {analysis.options?.diff ? (
                    <DiffViewer diff={analysis.options.diff} />
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-12 text-center">
                      <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Code Changes Available
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        The diff for this analysis could not be retrieved.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}