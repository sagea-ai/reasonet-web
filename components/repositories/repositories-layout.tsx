'use client'

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Filter, GitBranch, Star, GitFork, Eye, Lock, Globe, Plus, Github, RefreshCw } from "lucide-react"
import Link from "next/link"
import { FilterOption, SortOption } from "@/types/types"

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  isPrivate: boolean;
  language?: string;
  url: string;
  starCount?: number;
  forkCount?: number;
  updatedAt: string;
  _count: {
    issues: number;
    access: number;
    analyses: number;
  };
}

interface RepositoriesLayoutProps {
  organizationName: string;
  organizationId: string;
  repositories: Repository[];
  onRepositoriesUpdate: (repositories: Repository[]) => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function RepositoriesLayout({ 
  organizationName,
  organizationId,
  repositories,
  onRepositoriesUpdate,
  isRefreshing = false,
  onRefresh
}: RepositoriesLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('asc')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [isConnecting, setIsConnecting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  const filteredAndSortedRepositories = useMemo(() => {
    let filtered = repositories.filter(repo => {
      const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'private' && repo.isPrivate) ||
                           (filterBy === 'public' && !repo.isPrivate)
      
      return matchesSearch && matchesFilter
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'stars':
          return (b.starCount ?? 0) - (a.starCount ?? 0)
        case 'forks':
          return (b.forkCount ?? 0) - (a.forkCount ?? 0)
        case 'language':
          return (a.language || '').localeCompare(b.language || '')
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }, [repositories, searchQuery, sortBy, filterBy])

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedRepositories.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRepositories = filteredAndSortedRepositories.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const handleFiltersChange = (callback: () => void) => {
    callback()
    setCurrentPage(1)
  }

  const handleConnectRepository = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch(`/api/github/installation-url?organizationId=${organizationId}`)
      const data = await response.json()
      
      if (data.installationUrl) {
        window.open(data.installationUrl, '_blank')
      }
    } catch (error) {
      console.error('Failed to get installation URL:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const getLanguageColor = (language?: string) => {
    const colors: Record<string, string> = {
      'TypeScript': 'bg-blue-100 text-blue-800',
      'JavaScript': 'bg-yellow-100 text-yellow-800',
      'Python': 'bg-sky-100 text-sky-800',
      'Dockerfile': 'bg-sky-100 text-sky-800',
      'HTML': 'bg-orange-100 text-orange-800',
      'Vue': 'bg-green-300/70 text-green-800',
      'C': 'bg-gray-100 text-gray-800',
      'Jupyter Notebook': 'bg-amber-100 text-amber-800',
      'Java': 'bg-orange-100 text-orange-800',
      'Go': 'bg-cyan-100 text-cyan-800',
      'Rust': 'bg-red-100 text-red-800',
      'C++': 'bg-sky-100 text-sky-800',
    }
    return colors[language || ''] || 'bg-gray-100 text-gray-800'
  }

  if (repositories.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
            <p className="text-muted-foreground">
              {organizationName} • No repositories connected
            </p>
          </div>

          {/* Empty State */}
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-12">
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center shadow-inner">
                    <Github className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Connect Your First Repository
                    </h3>
                    <p className="text-muted-foreground text-base max-w-md leading-relaxed">
                      Install our GitHub App to start analyzing your repositories and unlock powerful insights into your development workflow
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleConnectRepository}
                  disabled={isConnecting}
                  className="bg-sky-600 hover:bg-sky-400 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white px-8 py-3 font-medium gap-2"
                >
                  <Github className="h-4 w-4" />
                  {isConnecting ? 'Connecting...' : 'Connect Repository'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
            <p className="text-muted-foreground">
              {organizationName} • {filteredAndSortedRepositories.length} {filteredAndSortedRepositories.length === 1 ? 'repository' : 'repositories'}
              {filteredAndSortedRepositories.length !== repositories.length && ` (filtered from ${repositories.length})`}
            </p>
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <Button 
                variant="outline"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            )}
            <Button 
              onClick={handleConnectRepository}
              disabled={isConnecting}
              className="gap-2 bg-sky-700 hover:bg-sky-600 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {isConnecting ? 'Connecting...' : 'Connect Repository'}
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => handleFiltersChange(() => setSearchQuery(e.target.value))}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value: SortOption) => handleFiltersChange(() => setSortBy(value))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Recently updated</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="stars">Stars</SelectItem>
              <SelectItem value="forks">Forks</SelectItem>
              <SelectItem value="language">Language</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBy} onValueChange={(value: FilterOption) => handleFiltersChange(() => setFilterBy(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Repositories Grid */}
        {currentRepositories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentRepositories.map((repo) => (
                <Card key={repo.id} className="hover:shadow-md transition-shadow duration-200 border-gray-200 dark:border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                          <Link 
                            href={repo.url} 
                            target="_blank"
                            className="hover:underline truncate text-gray-900 dark:text-white"
                          >
                            {repo.name}
                          </Link>
                          {repo.isPrivate ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {repo.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Language and Stats */}
                      <div className="flex items-center justify-between">
                        {repo.language && (
                          <Badge variant="secondary" className={getLanguageColor(repo.language)}>
                            {repo.language}
                          </Badge>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {repo.starCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            {repo.forkCount}
                          </div>
                        </div>
                      </div>

                      {/* Activity Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-gray-600 dark:text-gray-300">
                            {(repo._count?.analyses ?? 0)} Analyses
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">
                            {(repo._count?.issues ?? 0)} Issues
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          Updated {new Date(repo.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) setCurrentPage(currentPage - 1)
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(page)
                              }}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      return null
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-12">
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center shadow-inner">
                    <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      No Repositories Found
                    </h3>
                    <p className="text-muted-foreground text-base max-w-md leading-relaxed">
                      No repositories match your search criteria. Try adjusting your filters or search terms.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setSearchQuery('')
                    setFilterBy('all')
                    setSortBy('updated')
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
