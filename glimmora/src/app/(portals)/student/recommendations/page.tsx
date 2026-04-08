"use client";

import { useState, useMemo } from "react";
import { Sparkles, Inbox } from "lucide-react";
import {
  useRecommendations,
  useApproveRecommendation,
  useDismissRecommendation,
} from "@/lib/hooks/use-student";
import { PageHeader } from "@/components/shared/misc/page-header";
import { AiRecommendationCard } from "@/components/shared/ai/ai-recommendation-card";
import { CardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { cn } from "@/lib/utils/cn";

type FilterTab = "all" | "pending" | "approved" | "dismissed";

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "dismissed", label: "Dismissed" },
];

export default function StudentRecommendationsPage() {
  const { data: recommendations, isLoading, isError, refetch } = useRecommendations();
  const approveMutation = useApproveRecommendation();
  const dismissMutation = useDismissRecommendation();
  const [filter, setFilter] = useState<FilterTab>("all");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Sparkles} title="AI Recommendations" description="Personalized AI-powered recommendations" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const filtered = (recommendations ?? []).filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const counts = {
    all: (recommendations ?? []).length,
    pending: (recommendations ?? []).filter((r) => r.status === "pending").length,
    approved: (recommendations ?? []).filter((r) => r.status === "approved").length,
    dismissed: (recommendations ?? []).filter((r) => r.status === "dismissed").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        title="AI Recommendations"
        description="Personalized AI-powered recommendations for your academic journey"
      />

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              filter === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-muted-foreground">({counts[tab.value]})</span>
          </button>
        ))}
      </div>

      {/* Recommendations */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filter === "all" ? "No recommendations yet" : `No ${filter} recommendations`}
          description={
            filter === "all"
              ? "AI recommendations will appear here as the system analyzes your progress."
              : "Try switching to a different filter."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((rec) => (
            <AiRecommendationCard
              key={rec.id}
              id={rec.id}
              title={rec.title}
              description={rec.description}
              confidence={rec.confidence}
              priority={rec.priority}
              explanation={rec.explanation}
              status={rec.status}
              onApprove={async (id) => {
                await approveMutation.mutateAsync(id);
              }}
              onDismiss={async (id, reason) => {
                await dismissMutation.mutateAsync({ id, reason });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
