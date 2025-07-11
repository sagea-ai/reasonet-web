'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileIcon, GitBranch } from 'lucide-react';

interface FileDiff {
  fileName: string;
  content: string;
}

interface DiffViewerProps {
  diff: string;
}

export function DiffViewer({ diff }: DiffViewerProps) {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  
  // Parse diff to extract file diffs
  const fileDiffs = React.useMemo(() => {
    const files: FileDiff[] = [];
    const fileChunks = diff.split('diff --git ').filter(Boolean);
    
    for (const chunk of fileChunks) {
      const lines = chunk.split('\n');
      let fileName = '';
      
      // Extract filename from the first line (a/path/to/file b/path/to/file)
      if (lines[0].includes(' b/')) {
        fileName = lines[0].split(' b/')[1];
      }
      
      if (fileName) {
        files.push({
          fileName,
          content: chunk,
        });
      }
    }
    
    return files;
  }, [diff]);
  
  // Set the first file as active by default
  React.useEffect(() => {
    if (fileDiffs.length > 0 && !activeFile) {
      setActiveFile(fileDiffs[0].fileName);
    }
  }, [fileDiffs, activeFile]);
  
  // Render the diff content with syntax highlighting
  const renderDiffContent = (content: string) => {
    const lines = content.split('\n');
    
    return (
      <div className="font-mono text-sm">
        {lines.map((line, index) => {
          let lineClass = 'px-4 py-1 border-l-2 border-transparent';
          
          if (line.startsWith('+')) {
            lineClass = 'px-4 py-1 bg-green-50 dark:bg-green-950/20 border-l-2 border-green-500 text-green-800 dark:text-green-300';
          } else if (line.startsWith('-')) {
            lineClass = 'px-4 py-1 bg-red-50 dark:bg-red-950/20 border-l-2 border-red-500 text-red-800 dark:text-red-300';
          } else if (line.startsWith('@@ ')) {
            lineClass = 'px-4 py-1 bg-blue-50 dark:bg-blue-950/20 border-l-2 border-blue-500 text-blue-800 dark:text-blue-300 font-medium';
          } else {
            lineClass = 'px-4 py-1 text-gray-700 dark:text-gray-300';
          }
          
          return (
            <div key={index} className={lineClass}>
              <span className="select-none text-gray-400 dark:text-gray-500 w-12 inline-block text-right mr-4">
                {index + 1}
              </span>
              {line}
            </div>
          );
        })}
      </div>
    );
  };
  
  if (fileDiffs.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-4">
          <GitBranch className="h-16 w-16 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No Diff Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              The code changes for this analysis could not be loaded.
            </p>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Code Changes
          <Badge variant="outline" className="ml-2">
            {fileDiffs.length} {fileDiffs.length === 1 ? 'file' : 'files'} changed
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 h-[700px]">
        {/* File list */}
        <div className="border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
          <ScrollArea className="h-[300px] lg:h-[700px]">
            <div className="p-4 space-y-2">
              {fileDiffs.map((file) => (
                <button
                  key={file.fileName}
                  onClick={() => setActiveFile(file.fileName)}
                  className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 transition-all ${
                    activeFile === file.fileName
                      ? 'bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 font-medium'
                      : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <FileIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span className="truncate text-gray-700 dark:text-gray-300">
                    {file.fileName}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        {/* Diff content */}
        <div className="col-span-3 bg-white dark:bg-gray-900">
          <ScrollArea className="h-[400px] lg:h-[700px]">
            {activeFile && (
              <div>
                <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {activeFile}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  {renderDiffContent(
                    fileDiffs.find((f) => f.fileName === activeFile)?.content || ''
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}