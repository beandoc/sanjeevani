import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MainLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-9 w-72 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>

      {/* Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
