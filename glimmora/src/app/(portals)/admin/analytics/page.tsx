"use client";

import { BarChart3 } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useAnalytics } from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/shared/misc/page-header";
import { KpiCard } from "@/components/shared/charts/kpi-card";
import { BarComparison } from "@/components/shared/charts/bar-comparison";
import { AreaTrend } from "@/components/shared/charts/area-trend";
import { DataTable } from "@/components/shared/data-table";
import { DashboardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { formatPercentage, formatNumber, formatGpa } from "@/lib/utils/format";

interface DeptRow {
  department: string;
  enrollment: number;
  retention: number;
  graduation: number;
  avgGpa: number;
  placementRate: number;
}

// KPI units come from the seed exactly as: "%", ":1", "students", "points",
// "papers", "score". Format each appropriately so cards read naturally.
function formatKpiValue(value: number, unit: string): string {
  switch (unit) {
    case "%":
      return formatPercentage(value);
    case ":1":
      return `1:${formatGpa(value)}`;
    case "points":
      return formatGpa(value);
    default:
      return formatNumber(value);
  }
}

const deptColumns: ColumnDef<DeptRow, unknown>[] = [
  { accessorKey: "department", header: "Specialization" },
  {
    accessorKey: "enrollment",
    header: "Enrollment",
    cell: ({ getValue }) => formatNumber(getValue() as number),
  },
  {
    accessorKey: "retention",
    header: "Retention %",
    cell: ({ getValue }) => formatPercentage(getValue() as number),
  },
  {
    accessorKey: "graduation",
    header: "Graduation %",
    cell: ({ getValue }) => formatPercentage(getValue() as number),
  },
  {
    accessorKey: "avgGpa",
    header: "Avg GPA",
    cell: ({ getValue }) => formatGpa(getValue() as number),
  },
  {
    accessorKey: "placementRate",
    header: "Placement %",
    cell: ({ getValue }) => formatPercentage(getValue() as number),
  },
];

export default function AdminAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={BarChart3}
          title="Analytics"
          description="Institutional performance metrics and trends"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={BarChart3}
          title="Analytics"
          description="Institutional performance metrics and trends"
        />
        <ErrorState
          title="Failed to load analytics"
          message="Could not retrieve analytics data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const barData = data.departmentComparison.map((d) => ({
    label: d.department,
    enrollment: d.enrollment,
    retention: d.retention,
    graduation: d.graduation,
    placementRate: d.placementRate,
  }));

  const trendData = data.yearlyTrends.map((y) => ({
    label: y.year,
    value: y.enrollment,
    enrollment: y.enrollment,
    retention: y.retention,
    graduation: y.graduation,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        description="Institutional performance metrics and trends"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((kpi) => {
          const changeValue = kpi.previousValue
            ? Math.round(
                ((kpi.value - kpi.previousValue) / kpi.previousValue) * 1000
              ) / 10
            : 0;
          return (
            <KpiCard
              key={kpi.name}
              label={kpi.name}
              value={formatKpiValue(kpi.value, kpi.unit)}
              change={{ value: changeValue, label: "vs previous" }}
            />
          );
        })}
      </div>

      {/* Enrollment counts by department — own chart so percentages aren't
          flattened to invisible stubs by the enrollment-scale y-axis. */}
      <BarComparison
        title="Enrollment by Specialization"
        data={barData}
        bars={[
          { dataKey: "enrollment", label: "Enrollment", color: "#2563eb" },
        ]}
      />

      {/* Performance rates by specialization — single 0–100 percentage scale. */}
      <BarComparison
        title="Performance Rates by Specialization"
        data={barData}
        bars={[
          { dataKey: "retention", label: "Retention %", color: "#059669" },
          { dataKey: "graduation", label: "Graduation %", color: "#7c3aed" },
          { dataKey: "placementRate", label: "Placement %", color: "#d97706" },
        ]}
      />

      {/* Yearly Enrollment Trends */}
      <AreaTrend
        title="Enrollment Trend Over Years"
        data={trendData}
        dataKey="enrollment"
        color="#2563eb"
      />

      {/* Specialization Details Table */}
      <div>
        <h2 className="mb-4 text-sm font-semibold">Specialization Details</h2>
        <DataTable
          columns={deptColumns}
          data={data.departmentComparison}
          searchKey="department"
          searchPlaceholder="Search specializations..."
          showPagination={false}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Showing current academic year performance across all specializations.
        </p>
      </div>
    </div>
  );
}
