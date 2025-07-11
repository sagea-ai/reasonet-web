import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { PRGistResult } from "@/types/pr-gist";

interface PRGistViewProps {
  prGist: PRGistResult | null;
}

export function PRGistView({ prGist }: PRGistViewProps) {
  if (!prGist) {
    return (
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <span className="text-2xl">📄</span>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Summary Available</h3>
          <p className="text-gray-500 dark:text-gray-400">
            The analysis couldn't generate a summary for this pull request.
          </p>
        </div>
      </div>
    );
  }

  const complexityColor = {
    LOW: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800',
    HIGH: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800',
  }[prGist.complexity];

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pull Request Summary
              </h2>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${complexityColor}`}>
                {prGist.complexity} Complexity
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {prGist.summary}
            </p>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Impact</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {prGist.impact}
          </p>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Changes</h3>
          {prGist.keyChanges && prGist.keyChanges.length > 0 ? (
            <ul className="space-y-2">
              {prGist.keyChanges.map((change, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{change}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No key changes identified.
            </p>
          )}
        </div>
      </div>

      {prGist.recommendations && prGist.recommendations.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h3>
            <ul className="space-y-2">
              {prGist.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}