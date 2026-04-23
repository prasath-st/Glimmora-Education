"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Plus, Loader2, X, MoreHorizontal, Eye, Pencil, ShieldBan, ShieldCheck,
  Search, MapPin, Mail, Calendar, Building2, Link2, Unlink,
  ChevronDown, Globe, Landmark, User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  useSuperAdminMinistries, useSuperAdminMinistryDetail,
  useSuperAdminUniversities, useCreateMinistry, useUpdateMinistry,
  useLinkUniversity,
} from "@/lib/hooks/use-super-admin";
import { createMinistrySchema, type CreateMinistryFormData } from "@/lib/schemas/super-admin.schema";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { SlideDrawer } from "@/components/shared/feedback/slide-drawer";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { FormField } from "@/components/shared/forms/form-field";
import { Skeleton } from "@/components/shared/feedback/loading-skeleton";
import { CustomSelect } from "@/components/shared/forms/custom-select";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatNumber } from "@/lib/utils/format";
import type { Ministry, University } from "@/lib/api/types/super-admin.types";

/* ── Row Actions ─────────────────────────────────────────────────────────── */

function RowActions({ ministry, onView, onEdit, onLink, onToggle }: {
  ministry: Ministry; onView: () => void; onEdit: () => void; onLink: () => void; onToggle: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button onClick={(e) => e.stopPropagation()} className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-primary-50 hover:text-primary-600 group-hover:opacity-100 data-[state=open]:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} onClick={(e) => e.stopPropagation()} className="z-50 w-48 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30">
          <DropdownMenu.Item onSelect={onView} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Eye className="h-4 w-4 text-muted-foreground" /> View Details
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={onEdit} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Pencil className="h-4 w-4 text-muted-foreground" /> Edit
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={onLink} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Link2 className="h-4 w-4 text-muted-foreground" /> Link University
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item onSelect={onToggle} className={cn("flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted", ministry.status === "active" ? "text-danger" : "text-success")}>
            {ministry.status === "active" ? <><ShieldBan className="h-4 w-4" /> Suspend</> : <><ShieldCheck className="h-4 w-4" /> Reactivate</>}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ── Detail Drawer ───────────────────────────────────────────────────────── */

function DetailDrawer({ id, open, onClose, onToggle, onLinkUniversity }: {
  id: string | null; open: boolean; onClose: () => void; onToggle: (m: Ministry) => void; onLinkUniversity: (m: Ministry) => void;
}) {
  const { data: m, isLoading } = useSuperAdminMinistryDetail(id ?? "");
  const linkMutation = useLinkUniversity();
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ open: boolean; uni: University | null }>({ open: false, uni: null });

  const handleUnlink = useCallback(async () => {
    if (!unlinkConfirm.uni || !m) return;
    try { await linkMutation.mutateAsync({ ministryId: m.id, universityId: unlinkConfirm.uni.id, action: "unlink" }); toast.success(`"${unlinkConfirm.uni.name}" unlinked`); } catch { toast.error("Failed to unlink"); }
  }, [unlinkConfirm.uni, m, linkMutation]);

  const linkedUniversities = m?.linkedUniversities ?? [];

  return (
    <>
      <SlideDrawer open={open} onClose={onClose} title={m?.name ?? "Ministry"} description={m ? `${m.country} — Oversight body` : undefined} width="lg"
        footer={m && (
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => onLinkUniversity(m)} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <Link2 className="h-4 w-4" /> Link University
            </button>
            <button onClick={() => onToggle(m)} className={cn("rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:-translate-y-0.5", m.status === "active" ? "bg-danger shadow-danger/25 hover:bg-danger/90" : "bg-success shadow-success/25 hover:bg-success/90")}>
              {m.status === "active" ? "Suspend" : "Reactivate"}
            </button>
          </div>
        )}
      >
        {isLoading ? (
          <div className="space-y-6"><Skeleton className="h-6 w-24" /><Skeleton className="h-16 rounded-lg" /><Skeleton className="h-40 rounded-lg" /></div>
        ) : !m ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Ministry not found.</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <span className={cn("h-2.5 w-2.5 rounded-full", m.status === "active" ? "bg-success" : "bg-danger")} />
              <span className={cn("text-sm font-semibold capitalize", m.status === "active" ? "text-success" : "text-danger")}>{m.status}</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Linked Universities</p>
                <p className="mt-1 font-mono text-xl font-bold tracking-tight">{formatNumber(m.linkedUniversityCount)}</p>
              </div>
              <div className="border-l border-border/30 pl-4">
                <p className="text-xs text-muted-foreground">Country</p>
                <p className="mt-1 font-mono text-xl font-bold tracking-tight">1</p>
              </div>
            </div>

            {/* Info */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">Ministry Information</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { icon: Globe, label: "Country", value: m.country },
                  { icon: Mail, label: "Contact Email", value: m.contactEmail },
                  { icon: User, label: "Contact Name", value: m.contactName },
                  { icon: Calendar, label: "Created", value: formatDate(m.createdAt) },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">{row.label}</p>
                      <p className="mt-0.5 text-sm font-medium">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Universities */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Linked Universities</h3>
              {linkedUniversities.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {linkedUniversities.map((uni) => (
                    <div key={uni.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-primary-400" />
                        <div>
                          <p className="text-sm font-medium">{uni.name}</p>
                          <p className="text-xs text-muted-foreground">{uni.city}, {uni.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("h-2 w-2 rounded-full", uni.status === "active" ? "bg-success" : "bg-danger")} />
                          <span className={cn("text-xs font-semibold capitalize", uni.status === "active" ? "text-success" : "text-danger")}>{uni.status}</span>
                        </div>
                        <button onClick={() => setUnlinkConfirm({ open: true, uni })} disabled={linkMutation.isPending} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-danger disabled:opacity-50" title="Unlink">
                          <Unlink className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No universities linked yet.</p>
              )}
            </div>
          </div>
        )}
      </SlideDrawer>
      <ConfirmDialog open={unlinkConfirm.open} onOpenChange={(o) => setUnlinkConfirm((p) => ({ ...p, open: o }))} title="Unlink University" description={`Unlink "${unlinkConfirm.uni?.name}" from this ministry?`} confirmLabel="Unlink" variant="danger" onConfirm={handleUnlink} />
    </>
  );
}

/* ── Link University Drawer ──────────────────────────────────────────────── */

function LinkUniversityDrawer({ open, onClose, ministryId, linkedIds, allUniversities }: {
  open: boolean; onClose: () => void; ministryId: string; linkedIds: string[]; allUniversities: University[];
}) {
  const linkUniversity = useLinkUniversity();
  const [selectedId, setSelectedId] = useState("");
  const available = useMemo(() => allUniversities.filter((u) => !linkedIds.includes(u.id)), [allUniversities, linkedIds]);
  const close = useCallback(() => { setSelectedId(""); onClose(); }, [onClose]);
  const handleLink = useCallback(async () => {
    if (!selectedId) return;
    try { await linkUniversity.mutateAsync({ ministryId, universityId: selectedId, action: "link" }); toast.success(`${available.find((u) => u.id === selectedId)?.name} linked`); setSelectedId(""); onClose(); } catch { toast.error("Failed to link"); }
  }, [selectedId, ministryId, linkUniversity, available, onClose]);

  return (
    <SlideDrawer open={open} onClose={close} title="Link University" description="Select a university to link for oversight" width="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={close} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</button>
          <button onClick={handleLink} disabled={!selectedId || linkUniversity.isPending || available.length === 0} className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 hover:bg-primary-600 disabled:opacity-50">
            {linkUniversity.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Link University
          </button>
        </div>
      }
    >
      {available.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">All universities are already linked.</p>
      ) : (
        <div>
          <h3 className="mb-4 text-sm font-semibold">Select University</h3>
          <CustomSelect
            value={selectedId}
            onChange={setSelectedId}
            options={[{ value: "", label: "Select a university..." }, ...available.map((u) => ({ value: u.id, label: `${u.name} (${u.city}, ${u.country})` }))]}
            className="w-full"
          />
        </div>
      )}
    </SlideDrawer>
  );
}

/* ── Create Drawer ───────────────────────────────────────────────────────── */

function CreateDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mutation = useCreateMinistry();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateMinistryFormData>({
    resolver: zodResolver(createMinistrySchema),
    defaultValues: { name: "", country: "", contactEmail: "", contactName: "" },
  });
  const close = useCallback(() => { reset(); onClose(); }, [onClose, reset]);
  const onSubmit = useCallback(async (d: CreateMinistryFormData) => {
    try { await mutation.mutateAsync(d); reset(); onClose(); toast.success(`${d.name} created`, { description: `Invitation sent to ${d.contactEmail}` }); } catch { toast.error("Failed to create ministry"); }
  }, [mutation, reset, onClose]);

  return (
    <SlideDrawer open={open} onClose={close} title="New Ministry" description="Add a new oversight body" width="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={close} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</button>
          <button type="submit" form="create-ministry" disabled={mutation.isPending} className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 hover:bg-primary-600 disabled:opacity-50">
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create Ministry
          </button>
        </div>
      }
    >
      <form id="create-ministry" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <h3 className="text-sm font-semibold">Ministry Details</h3>
        <FormField label="Ministry Name" placeholder="e.g. Ministry of Higher Education" error={errors.name?.message} required {...register("name")} />
        <FormField label="Country" placeholder="e.g. United Kingdom" error={errors.country?.message} required {...register("country")} />

        <div className="h-px bg-border/30" />

        <h3 className="text-sm font-semibold">Primary Contact</h3>
        <FormField label="Full Name" placeholder="Full name of primary contact" error={errors.contactName?.message} required {...register("contactName")} />
        <FormField label="Email Address" type="email" placeholder="contact@ministry.gov" error={errors.contactEmail?.message} required {...register("contactEmail")} />

        {mutation.isError && <p className="text-sm text-danger">Failed to create. Please try again.</p>}
      </form>
    </SlideDrawer>
  );
}

/* ── Edit Drawer ─────────────────────────────────────────────────────────── */

function EditDrawer({ ministry, open, onClose }: { ministry: Ministry | null; open: boolean; onClose: () => void }) {
  const mutation = useUpdateMinistry();
  const { register, handleSubmit, reset, setValue, formState: { errors, isDirty } } = useForm<CreateMinistryFormData>({
    resolver: zodResolver(createMinistrySchema),
  });

  useEffect(() => {
    if (ministry) {
      setValue("name", ministry.name);
      setValue("country", ministry.country);
      setValue("contactName", ministry.contactName);
      setValue("contactEmail", ministry.contactEmail);
    }
  }, [ministry, setValue]);

  const close = useCallback(() => { reset(); onClose(); }, [onClose, reset]);
  const onSubmit = useCallback(async (d: CreateMinistryFormData) => {
    if (!ministry) return;
    try { await mutation.mutateAsync({ id: ministry.id, ...d }); onClose(); toast.success(`${d.name} updated`); } catch { toast.error("Failed to update"); }
  }, [mutation, ministry, onClose]);

  return (
    <SlideDrawer open={open} onClose={close} title="Edit Ministry" description={ministry?.name} width="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={close} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</button>
          <button type="submit" form="edit-ministry" disabled={mutation.isPending || !isDirty} className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 hover:bg-primary-600 disabled:opacity-50">
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
          </button>
        </div>
      }
    >
      <form id="edit-ministry" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <h3 className="text-sm font-semibold">Ministry Details</h3>
        <FormField label="Ministry Name" error={errors.name?.message} required {...register("name")} />
        <FormField label="Country" error={errors.country?.message} required {...register("country")} />
        <div className="h-px bg-border/30" />
        <h3 className="text-sm font-semibold">Primary Contact</h3>
        <FormField label="Full Name" error={errors.contactName?.message} required {...register("contactName")} />
        <FormField label="Email Address" type="email" error={errors.contactEmail?.message} required {...register("contactEmail")} />
        {mutation.isError && <p className="text-sm text-danger">Failed to update. Please try again.</p>}
      </form>
    </SlideDrawer>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

const STATUS_OPTS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

export default function SuperAdminMinistriesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editMinistry, setEditMinistry] = useState<Ministry | null>(null);
  const [confirm, setConfirm] = useState<{ open: boolean; ministry: Ministry | null }>({ open: false, ministry: null });

  const update = useUpdateMinistry();
  const { data, isLoading, isError, refetch } = useSuperAdminMinistries({ search: search || undefined, status: statusFilter || undefined, page, pageSize: 20 });
  const { data: universitiesData } = useSuperAdminUniversities({ pageSize: 100 });
  const { data: ministryDetail } = useSuperAdminMinistryDetail(selectedId ?? "");

  const ministries = data?.data ?? [];
  const meta = data?.meta;
  const allUniversities = universitiesData?.data ?? [];

  const openDetail = useCallback((m: Ministry) => { setSelectedId(m.id); setDetailOpen(true); }, []);
  const openEdit = useCallback((m: Ministry) => { setEditMinistry(m); setEditOpen(true); }, []);
  const handleToggle = useCallback((m: Ministry) => { setConfirm({ open: true, ministry: m }); }, []);
  const executeToggle = useCallback(async () => {
    if (!confirm.ministry) return;
    const s = confirm.ministry.status === "active";
    try { await update.mutateAsync({ id: confirm.ministry.id, status: s ? "suspended" : "active" }); toast.success(s ? `${confirm.ministry.name} suspended` : `${confirm.ministry.name} reactivated`); } catch { toast.error("Action failed"); }
  }, [confirm.ministry, update]);
  const handleLinkFromMenu = useCallback((m: Ministry) => { setSelectedId(m.id); setLinkOpen(true); }, []);

  return (
    <div>
      {/* Gradient wash */}
      <div className="pointer-events-none absolute inset-x-0 top-16 z-0 h-[350px]" style={{ background: "linear-gradient(180deg, var(--color-primary-50) 0%, transparent 100%)" }} />

      <div className="relative px-8 pt-6 lg:px-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ministries</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage oversight bodies and linked universities</p>
          </div>
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 hover:bg-primary-600">
            <Plus className="h-4 w-4" /> New Ministry
          </button>
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search ministries..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-11 w-full rounded-lg bg-card pl-11 pr-10 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-400" />
            {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
          <CustomSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={STATUS_OPTS} />
        </div>

        {/* Table */}
        <div className="mt-8 pb-8">
          {isLoading ? (
            <div className="overflow-hidden rounded-lg bg-card shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-border/30 px-6 py-4 last:border-0">
                  <Skeleton className="h-5 w-44" /><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-36" /><Skeleton className="ml-auto h-5 w-16" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState title="Failed to load" message="Could not retrieve data." onRetry={() => refetch()} />
          ) : ministries.length === 0 ? (
            <div className="rounded-lg bg-card py-20 text-center shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary-50"><Search className="h-7 w-7 text-primary-300" /></div>
              <p className="mt-5 text-base font-semibold">No ministries found</p>
              <p className="mt-1 text-sm text-muted-foreground">Adjust your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg bg-card shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30">
              <div className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_0.7fr_1fr_40px] items-center gap-4 bg-muted/40 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Ministry</span><span>Country</span><span>Contact</span><span>Linked</span><span>Status</span><span>Created</span><span />
              </div>
              <div className="divide-y divide-border/30">
                {ministries.map((m) => (
                  <div key={m.id} onClick={() => openDetail(m)}
                    className="group grid cursor-pointer grid-cols-[2fr_1fr_1.5fr_0.8fr_0.7fr_1fr_40px] items-center gap-4 px-6 py-4 transition-colors hover:bg-primary-50/40">
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.country}</p>
                    <div>
                      <p className="text-sm">{m.contactName}</p>
                      <p className="text-xs text-muted-foreground">{m.contactEmail}</p>
                    </div>
                    <p className="font-mono text-sm font-medium">{m.linkedUniversityCount}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", m.status === "active" ? "bg-success" : "bg-danger")} />
                      <span className={cn("text-xs font-semibold capitalize", m.status === "active" ? "text-success" : "text-danger")}>{m.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</p>
                    <RowActions ministry={m} onView={() => openDetail(m)} onEdit={() => openEdit(m)} onLink={() => handleLinkFromMenu(m)} onToggle={() => handleToggle(m)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg bg-card px-4 py-2 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 disabled:opacity-40 hover:bg-primary-50">Previous</button>
                <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages} className="rounded-lg bg-card px-4 py-2 text-sm shadow-lg shadow-primary-900/[0.04] ring-1 ring-border/30 disabled:opacity-40 hover:bg-primary-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditDrawer ministry={editMinistry} open={editOpen} onClose={() => { setEditOpen(false); setEditMinistry(null); }} />
      <DetailDrawer id={selectedId} open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedId(null); }} onToggle={handleToggle} onLinkUniversity={(m) => { setSelectedId(m.id); setLinkOpen(true); }} />
      {selectedId && (
        <LinkUniversityDrawer open={linkOpen} onClose={() => setLinkOpen(false)} ministryId={selectedId} linkedIds={ministryDetail?.linkedUniversityIds ?? []} allUniversities={allUniversities} />
      )}
      <ConfirmDialog open={confirm.open} onOpenChange={(o) => setConfirm((p) => ({ ...p, open: o }))}
        title={confirm.ministry?.status === "active" ? "Suspend Ministry" : "Reactivate Ministry"}
        description={confirm.ministry?.status === "active" ? `Suspend "${confirm.ministry?.name}"?` : `Reactivate "${confirm.ministry?.name}"?`}
        confirmLabel={confirm.ministry?.status === "active" ? "Suspend" : "Reactivate"}
        variant={confirm.ministry?.status === "active" ? "danger" : "default"}
        onConfirm={executeToggle}
      />
    </div>
  );
}
