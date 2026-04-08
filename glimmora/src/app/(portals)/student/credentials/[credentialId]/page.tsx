"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Building2,
  Shield,
} from "lucide-react";
import { useCredentialDetail } from "@/lib/hooks/use-student";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { DashboardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import type { CredentialStatus } from "@/lib/api/types/common.types";

function getCredentialStatusVariant(status: CredentialStatus) {
  const map: Record<CredentialStatus, "success" | "danger" | "warning" | "info" | "muted"> = {
    active: "success",
    revoked: "danger",
    expired: "warning",
    pending_verification: "info",
  };
  return map[status] || "muted";
}

export default function StudentCredentialDetailPage({
  params,
}: {
  params: Promise<{ credentialId: string }>;
}) {
  const { credentialId } = use(params);
  const { data: credential, isLoading, isError, refetch } = useCredentialDetail(credentialId);
  const [copied, setCopied] = useState(false);

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !credential) return <ErrorState onRetry={() => refetch()} />;

  const handleCopyHash = async () => {
    if (credential.verificationHash) {
      await navigator.clipboard.writeText(credential.verificationHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/student/credentials"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Credentials
      </Link>

      {/* Credential Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge variant="muted">{credential.type}</StatusBadge>
              <StatusBadge variant={getCredentialStatusVariant(credential.status)} dot>
                {credential.status.replace("_", " ")}
              </StatusBadge>
            </div>
            <h1 className="mt-3 text-xl font-semibold">{credential.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{credential.description}</p>
          </div>
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-portal-accent-light">
            <BadgeCheck className="h-7 w-7 text-portal-accent" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            {credential.issuer}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Issued: {formatDate(credential.issuedDate)}
          </span>
          {credential.expiryDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Expires: {formatDate(credential.expiryDate)}
            </span>
          )}
        </div>
      </div>

      {/* Verification Section */}
      {(credential.verificationHash || credential.verificationUrl) && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Verification</h2>
          </div>

          {credential.verificationHash && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Verification Hash</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-hidden truncate rounded-lg border border-border bg-muted/50 px-3 py-2 font-mono text-xs">
                  {credential.verificationHash}
                </code>
                <button
                  onClick={handleCopyHash}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
                  aria-label="Copy hash"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-success">Copied to clipboard</p>
              )}
            </div>
          )}

          {credential.verificationUrl && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">Verification URL</p>
              <a
                href={credential.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-portal-accent hover:underline"
              >
                {credential.verificationUrl}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Skills */}
      {credential.skills.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-3 text-sm font-semibold">Associated Skills</h2>
          <div className="flex flex-wrap gap-2">
            {credential.skills.map((skill) => (
              <StatusBadge key={skill} variant="default">
                {skill}
              </StatusBadge>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {Object.keys(credential.metadata).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-3 text-sm font-semibold">Metadata</h2>
          <div className="space-y-2">
            {Object.entries(credential.metadata).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
