import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PRGistResult = {
  summary: string;
  impact: string;
  keyChanges: string[];
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations?: string[];
};

interface PRGistTabProps {
  prGist: PRGistResult | null;
}

export function PRGistTab({ prGist }: PRGistTabProps) {
  if (!prGist) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h3 className="text-lg font-medium">No PR gist available</h3>
        <p className="text-muted-foreground">The analysis couldn't generate a summary for this pull request.</p>
      </div>
    );
  }

  const complexityColor = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
  }[prGist.complexity];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">PR Summary</h3>
              <Badge variant="outline" className={complexityColor}>
                {prGist.complexity} Complexity
              </Badge>
            </div>
            <p className="text-gray-700">{prGist.summary}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2">Impact</h3>
          <p className="text-gray-700">{prGist.impact}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2">Key Changes</h3>
          {prGist.keyChanges && prGist.keyChanges.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {prGist.keyChanges.map((change, index) => (
                <li key={index} className="text-gray-700">{change}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No key changes identified.</p>
          )}
        </CardContent>
      </Card>

      {prGist.recommendations && prGist.recommendations.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
            <ul className="list-disc pl-5 space-y-1">
              {prGist.recommendations.map((recommendation, index) => (
                <li key={index} className="text-gray-700">{recommendation}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}