import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200 dark:bg-slate-700',
        className
      )}
    />
  );
};

// Card Skeleton
export const CardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-12 w-12 rounded-lg" />
    </div>
    <div className="mt-4 flex items-center gap-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

// Chart Skeleton
export const ChartSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
    <Skeleton className="h-6 w-48 mb-4" />
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-[250px]">
        {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 45, 90].map((h, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="flex justify-between">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
          <Skeleton key={i} className="h-3 w-6" />
        ))}
      </div>
    </div>
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton = () => (
  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <Skeleton className="h-5 w-20" />
  </div>
);

// List Skeleton
export const ListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
      <Skeleton className="h-6 w-40" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRowSkeleton key={i} />
    ))}
  </div>
);

// User Card Skeleton
export const UserCardSkeleton = () => (
  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
    <div className="flex items-start gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-5 w-14 rounded" />
        </div>
      </div>
    </div>
    <div className="mt-3">
      <Skeleton className="h-3 w-28" />
    </div>
  </div>
);

// KPI Progress Skeleton
export const KPISkeleton = () => (
  <div className="border-b border-slate-100 dark:border-slate-700 pb-4 last:border-0">
    <div className="flex items-center justify-between mb-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="text-right space-y-1">
        <Skeleton className="h-4 w-16 ml-auto" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <Skeleton className="h-2 w-full rounded-full" />
    <Skeleton className="h-3 w-28 mt-1" />
  </div>
);

// Dashboard Loading Skeleton
export const DashboardSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-40 rounded-lg" />
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>

    {/* Lists */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ListSkeleton rows={5} />
      <ListSkeleton rows={5} />
    </div>
  </div>
);

export default Skeleton;
