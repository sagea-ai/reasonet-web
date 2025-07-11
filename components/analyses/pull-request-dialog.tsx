"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, GitPullRequest, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PullRequest {
  number: number;
  title: string;
  state: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  html_url: string;
  user: {
    login: string;
  };
  created_at: string;
}

interface Repository {
  id: string;
  name: string;
  fullName: string;
  language: string | null;
  githubInstallationId: string | null;
}

interface PullRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repository: Repository | null;
  onSelectPR: (pr: PullRequest) => void;
}

export function PullRequestDialog({ open, onOpenChange, repository, onSelectPR }: PullRequestDialogProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open && repository) {
      loadPullRequests();
    }
  }, [open, repository]);

  const loadPullRequests = async () => {
    if (!repository) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/github/pull-requests?repositoryId=${repository.id}`);
      if (response.ok) {
        const prs = await response.json();
        setPullRequests(prs);
      } else {
        toast.error("Failed to load pull requests");
      }
    } catch (error) {
      console.error("Error loading pull requests:", error);
      toast.error("Failed to load pull requests");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPRs = pullRequests.filter(pr => 
    pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pr.head.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pr.user.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPR = (pr: PullRequest) => {
    onSelectPR(pr);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Pull Request for {repository?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search pull requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isLoading ? "Loading..." : `${filteredPRs.length} open pull requests found`}
          </div>

          <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading pull requests...</span>
              </div>
            ) : filteredPRs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>No open pull requests found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPRs.map((pr) => (
                  <div
                    key={pr.number}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => handleSelectPR(pr)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <GitPullRequest className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            #{pr.number}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {pr.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>opened by {pr.user.login}</span>
                          <span>•</span>
                          <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {pr.head.ref} → {pr.base.ref}
                          </Badge>
                          <Badge 
                            variant={pr.state === 'open' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {pr.state}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
