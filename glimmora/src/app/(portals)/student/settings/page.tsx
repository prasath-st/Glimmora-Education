"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  User,
  Bell,
  Check,
  Loader2,
  X,
  Plus,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  useStudentProfile,
  useUpdateProfile,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/lib/hooks/use-student";
import { PageHeader } from "@/components/shared/misc/page-header";
import { FormField, FormTextarea } from "@/components/shared/forms/form-field";
import { FormSection } from "@/components/shared/forms/form-section";
import { DashboardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { cn } from "@/lib/utils/cn";

type TabId = "profile" | "notifications";

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const profileQuery = useStudentProfile();
  const notifQuery = useNotificationPreferences();

  const isLoading = profileQuery.isLoading || notifQuery.isLoading;
  const isError = profileQuery.isError || notifQuery.isError;

  if (isLoading) return <DashboardSkeleton />;
  if (isError) {
    return (
      <ErrorState
        onRetry={() => {
          profileQuery.refetch();
          notifQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Manage your profile and preferences"
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        <TabButton
          active={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
          icon={User}
        >
          Profile
        </TabButton>
        <TabButton
          active={activeTab === "notifications"}
          onClick={() => setActiveTab("notifications")}
          icon={Bell}
        >
          Notifications
        </TabButton>
      </div>

      {activeTab === "profile" && profileQuery.data && (
        <ProfileTab profile={profileQuery.data} />
      )}

      {activeTab === "notifications" && notifQuery.data && (
        <NotificationsTab preferences={notifQuery.data} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

// === Profile Tab ===

interface ProfileFormData {
  name: string;
  phone: string;
  bio: string;
  interests: string;
  socialLinks: { platform: string; url: string }[];
}

function ProfileTab({
  profile,
}: {
  profile: import("@/lib/api/types/student.types").StudentProfile;
}) {
  const updateProfile = useUpdateProfile();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [socialLinks, setSocialLinks] = useState(profile.socialLinks || []);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: profile.name,
      phone: profile.phone || "",
      bio: profile.bio || "",
      interests: profile.interests.join(", "),
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setSaveSuccess(false);
    await updateProfile.mutateAsync({
      name: data.name,
      phone: data.phone || undefined,
      bio: data.bio || undefined,
      interests: data.interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      socialLinks,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const addSocialLink = () => {
    setSocialLinks((prev) => [...prev, { platform: "", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: "platform" | "url", value: string) => {
    setSocialLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <FormSection title="Personal Information" description="Update your personal details">
        <FormField
          label="Full Name"
          required
          {...register("name", { required: "Name is required" })}
          error={errors.name?.message}
        />
        <FormField
          label="Email"
          value={profile.email}
          disabled
          hint="Email cannot be changed"
        />
        <FormField
          label="Phone"
          type="tel"
          {...register("phone")}
          placeholder="+1 (555) 000-0000"
        />
        <FormTextarea
          label="Bio"
          {...register("bio")}
          placeholder="Tell us about yourself..."
          rows={4}
        />
      </FormSection>

      <FormSection title="Academic Info" description="These fields are managed by your institution">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Student ID" value={profile.studentId} disabled />
          <FormField label="Department" value={profile.department} disabled />
          <FormField label="Program" value={profile.program} disabled />
          <FormField label="Enrollment Year" value={String(profile.enrollmentYear)} disabled />
          <FormField label="Expected Graduation" value={profile.expectedGraduation} disabled />
        </div>
      </FormSection>

      <FormSection title="Interests" description="Add your academic and professional interests">
        <FormField
          label="Interests"
          {...register("interests")}
          placeholder="Machine Learning, Data Science, Web Development (comma-separated)"
          hint="Comma-separated list of interests"
        />
      </FormSection>

      <FormSection title="Social Links" description="Add links to your professional profiles">
        <div className="space-y-3">
          {socialLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={link.platform}
                onChange={(e) => updateSocialLink(i, "platform", e.target.value)}
                placeholder="Platform (e.g., LinkedIn)"
                className="flex h-10 w-32 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent"
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                placeholder="https://..."
                className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent"
              />
              <button
                type="button"
                onClick={() => removeSocialLink(i)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-danger-light hover:text-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSocialLink}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-portal-accent hover:underline"
          >
            <Plus className="h-4 w-4" />
            Add social link
          </button>
        </div>
      </FormSection>

      {/* Save result */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-light/50 px-4 py-3">
          <Check className="h-4 w-4 text-success" />
          <p className="text-sm font-medium text-success">Profile updated successfully</p>
        </div>
      )}

      {updateProfile.isError && (
        <div className="rounded-lg border border-danger/30 bg-danger-light/50 px-4 py-3">
          <p className="text-sm text-danger">Failed to update profile. Please try again.</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-6 py-2.5 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
        >
          {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </form>
  );
}

// === Notifications Tab ===

interface NotifToggleItem {
  key: keyof import("@/lib/api/types/student.types").NotificationPreferences;
  label: string;
  description: string;
}

const notifToggles: NotifToggleItem[] = [
  { key: "email", label: "Email Notifications", description: "Receive notifications via email" },
  { key: "push", label: "Push Notifications", description: "Receive push notifications in browser" },
  { key: "riskAlerts", label: "Risk Alerts", description: "Get notified about academic risk changes" },
  { key: "gradeUpdates", label: "Grade Updates", description: "Get notified when grades are posted" },
  { key: "deadlineReminders", label: "Deadline Reminders", description: "Reminders for upcoming deadlines" },
  { key: "jobMatches", label: "Job Matches", description: "Notifications about new job matches" },
  { key: "recommendations", label: "AI Recommendations", description: "New AI-powered recommendations" },
];

function NotificationsTab({
  preferences,
}: {
  preferences: import("@/lib/api/types/student.types").NotificationPreferences;
}) {
  const updatePrefs = useUpdateNotificationPreferences();
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleToggle = async (key: keyof typeof preferences) => {
    const newValue = !localPrefs[key];
    setLocalPrefs((prev) => ({ ...prev, [key]: newValue }));
    setSavingKey(key);
    try {
      await updatePrefs.mutateAsync({ [key]: newValue });
      setLastSaved(key);
      setTimeout(() => setLastSaved(null), 2000);
    } catch {
      // Revert on error
      setLocalPrefs((prev) => ({ ...prev, [key]: !newValue }));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-1">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {notifToggles.map((toggle, index) => (
          <div
            key={toggle.key}
            className={cn(
              "flex items-center justify-between px-6 py-4",
              index < notifToggles.length - 1 && "border-b border-border"
            )}
          >
            <div>
              <p className="text-sm font-medium">{toggle.label}</p>
              <p className="text-xs text-muted-foreground">{toggle.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {savingKey === toggle.key && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              {lastSaved === toggle.key && (
                <Check className="h-3.5 w-3.5 text-success" />
              )}
              <button
                onClick={() => handleToggle(toggle.key)}
                disabled={savingKey === toggle.key}
                role="switch"
                aria-checked={localPrefs[toggle.key]}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-2",
                  localPrefs[toggle.key] ? "bg-portal-accent" : "bg-muted",
                  savingKey === toggle.key && "opacity-50"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                    localPrefs[toggle.key] ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
