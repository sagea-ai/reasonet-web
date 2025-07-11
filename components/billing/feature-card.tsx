import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureCardProps {
  title: string;
  price: string;
  details: string;
  icon: React.ReactNode;
}

export function FeatureCard({ title, price, details, icon }: FeatureCardProps) {
  return (
    <Card className="bg-white dark:bg-gray-950">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="text-sky-600">{icon}</div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <div className="text-2xl font-light">{price}</div>
          <div className="text-sm text-gray-500">{details}</div>
        </div>
      </CardContent>
    </Card>
  );
}
