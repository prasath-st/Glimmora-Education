"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Radar,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  ExternalLink,
  Search,
} from "lucide-react";
import { useSkills, useSkillGaps } from "@/lib/hooks/use-student";
import { PageHeader } from "@/components/shared/misc/page-header";
import { RadarChartDisplay } from "@/components/shared/charts/radar-chart";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { SearchInput } from "@/components/shared/forms/search-input";
import { DashboardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { cn } from "@/lib/utils/cn";

export default function StudentSkillsPage() {
  const { data: skills, isLoading: skillsLoading, isError: skillsError, refetch: refetchSkills } = useSkills();
  const { data: gaps, isLoading: gapsLoading, isError: gapsError, refetch: refetchGaps } = useSkillGaps();
  const [search, setSearch] = useState("");

  const isLoading = skillsLoading || gapsLoading;
  const isError = skillsError || gapsError;

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState onRetry={() => { refetchSkills(); refetchGaps(); }} />;

  const radarData = (skills ?? []).map((s) => ({
    subject: s.skillName,
    value: s.score,
    benchmark: s.benchmark,
  }));

  const filteredSkills = (skills ?? []).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.skillName.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  const categories = [...new Set((skills ?? []).map((s) => s.category))];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Radar}
        title="Skills & Development"
        description="Your skill profile, benchmarks, and gaps"
        actions={
          <Link
            href="/student/skills/evolution"
            className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            View Evolution
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* Radar Chart */}
      <RadarChartDisplay title="Skill Radar" data={radarData} height={380} />

      {/* Skills Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">All Skills</h2>
          <SearchInput
            value={search}
            onSearch={setSearch}
            placeholder="Search skills..."
            className="w-64"
          />
        </div>

        {filteredSkills.length === 0 ? (
          <EmptyState icon={Radar} title="No skills found" description="Try adjusting your search." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Skill
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Category
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Score
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Benchmark
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSkills.map((skill) => (
                  <tr key={skill.skillId} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-3 text-sm font-medium">{skill.skillName}</td>
                    <td className="px-5 py-3">
                      <StatusBadge variant="muted">{skill.category}</StatusBadge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              skill.score >= skill.benchmark
                                ? "bg-success"
                                : skill.score >= skill.benchmark * 0.8
                                  ? "bg-warning"
                                  : "bg-danger"
                            )}
                            style={{ width: `${skill.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{skill.score}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-muted-foreground">
                      {skill.benchmark}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center">
                        {skill.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-success" />
                        )}
                        {skill.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-danger" />
                        )}
                        {skill.trend === "stable" && (
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Skill Gaps */}
      {gaps && gaps.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">Skill Gaps</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gaps.map((gap) => (
              <div
                key={gap.skillName}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{gap.skillName}</h3>
                  <StatusBadge variant="danger">Gap: {gap.gap}</StatusBadge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Current: {gap.currentScore}</span>
                  <span className="text-xs text-muted-foreground">/</span>
                  <span className="text-xs text-muted-foreground">Required: {gap.requiredScore}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{
                      width: `${(gap.currentScore / gap.requiredScore) * 100}%`,
                    }}
                  />
                </div>

                {gap.recommendedResources.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Recommended Resources</p>
                    {gap.recommendedResources.map((r) => (
                      <a
                        key={r.url}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-portal-accent hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {r.title}
                        <StatusBadge variant="muted" size="sm">{r.type}</StatusBadge>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
