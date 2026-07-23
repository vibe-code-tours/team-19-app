"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

export default function SettingsPageClient() {
  const [profile, setProfile] = useState<{
    display_name: string;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [saveNameError, setSaveNameError] = useState<string | null>(null);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        setEmail(user.email || "");
        setAvatarUrl(user.user_metadata?.avatar_url || null);

        const { data, error: profileError } = await supabase
          .from("user_profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          console.error("Failed to load profile:", profileError.message);
        }
        if (data) setProfile(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [supabase, router]);

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        router.push("/login");
      } else {
        setDeleteError("Failed to delete account. Please try again.");
      }
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleLogout() {
    setLogoutError(null);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      setLogoutError("Failed to log out. Please try again.");
    }
  }

  async function handleSaveName() {
    if (!editName.trim()) return;
    setSavingName(true);
    setSaveNameError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: editName.trim() }),
      });
      if (res.ok) {
        setProfile((prev) => prev ? { ...prev, display_name: editName.trim() } : prev);
        setShowEditNameModal(false);
      } else {
        const errorData = await res.json();
        setSaveNameError(errorData.error || "Failed to save name. Please try again.");
      }
    } catch {
      setSaveNameError("Network error. Please try again.");
    } finally {
      setSavingName(false);
    }
  }

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email[0]?.toUpperCase() || "?";

  if (loading) {
    return (
      <div className="min-h-screen px-5 pb-8 max-w-lg mx-auto w-full md:max-w-[712px] lg:max-w-[848px]">
        <div className="flex items-center justify-between py-4">
          <div className="skeleton w-9 h-9 rounded-full" />
          <div className="skeleton h-6 w-24 rounded-lg" />
          <div className="w-9" />
        </div>
        <div className="space-y-6 mt-4">
          <div className="glass rounded-xl p-6 space-y-5">
            <div className="skeleton h-3 w-20 rounded-lg" />
            <div className="flex items-center gap-4">
              <div className="skeleton w-14 h-14 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-32 rounded-lg" />
                <div className="skeleton h-4 w-48 rounded-lg" />
              </div>
              <div className="skeleton w-9 h-9 rounded-full shrink-0" />
            </div>
          </div>
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="skeleton h-3 w-28 rounded-lg" />
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-28 rounded-lg" />
                <div className="skeleton h-3 w-20 rounded-lg" />
              </div>
              <div className="skeleton w-11 h-6 rounded-full" />
            </div>
          </div>
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="skeleton h-3 w-16 rounded-lg" />
            <div className="space-y-1.5">
              <div className="skeleton h-4 w-32 rounded-lg" />
              <div className="skeleton h-3 w-48 rounded-lg" />
            </div>
          </div>
          <div className="glass rounded-xl p-6 space-y-4 border border-red-500/20">
            <div className="skeleton h-3 w-28 rounded-lg" />
            <div className="skeleton h-4 w-64 rounded-lg" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="skeleton h-3 w-20 rounded-lg" />
            <div className="space-y-1.5">
              <div className="skeleton h-4 w-16 rounded-lg" />
              <div className="skeleton h-3 w-24 rounded-lg" />
            </div>
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-accent hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pb-8 max-w-lg mx-auto w-full md:max-w-[712px] lg:max-w-[848px]">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <button onClick={() => router.push("/")} className="p-2 text-text-secondary hover:text-text-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="font-(family-name:--font-playfair) text-xl font-bold text-text-primary">
          Settings
        </h1>
        <div className="w-9" />
      </div>

      <div className="space-y-6 mt-4">
        {/* Profile Card */}
        <div className="glass rounded-xl p-6 space-y-5">
          <p className="text-xs font-semibold tracking-wider text-accent">
            PROFILE
          </p>

          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile"
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                <span className="font-(family-name:--font-playfair) text-xl font-bold text-white">
                  {initials}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary text-base">
                {profile?.display_name || "User"}
              </p>
              <p className="text-sm text-text-secondary">{email}</p>
            </div>
            <button
              onClick={() => {
                setEditName(profile?.display_name || "");
                setShowEditNameModal(true);
              }}
              className="w-9 h-9 shrink-0 rounded-full bg-white/[0.03] border border-white/[0.07] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="glass rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold tracking-wider text-accent">
            PREFERENCES
          </p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Appearance</p>
              <p className="text-xs text-text-muted">{resolvedTheme === "dark" ? "Dark mode" : "Light mode"}</p>
            </div>
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                resolvedTheme === "dark" ? "bg-[#6366F1]" : "bg-[#E0D6FF]"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  resolvedTheme === "dark" ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div className="glass rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold tracking-wider text-accent">
            PRIVACY & SECURITY
          </p>

          <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
            <p>
              Your journal entries are encrypted before
              they ever leave your device. Not even we can read them — only you.
            </p>
            <p>
              Your data is stored securely with end-to-end encryption in transit and at rest.
              No third parties have access to your personal journal content.
            </p>
          </div>
        </div>

        {/* Export Data */}
        {/* <div className="glass rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold tracking-wider text-accent">
            EXPORT DATA
          </p>

          <button className="w-full flex items-center justify-between py-1">
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">Export my journal</p>
              <p className="text-xs text-text-muted">Download all your entries as JSON</p>
            </div>
          </button>
        </div> */}

        {/* Danger Zone */}
        <div className="glass rounded-xl p-6 space-y-4 border border-red-500/20">
          <p className="text-xs font-semibold tracking-wider text-red-400">
            DANGER ZONE
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            This permanently removes your email and all journal entries.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500 text-red-400 font-medium hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete account
          </button>
        </div>

        {/* Account */}
        <div className="glass rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold tracking-wider text-accent">
            ACCOUNT
          </p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">LogOut</p>
              <p className="text-xs text-text-muted">Tap to logout</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-glass-border text-text-primary font-medium hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirm("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-sm space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-(family-name:--font-playfair) text-lg font-bold text-text-primary text-center">
                Delete Account?
              </h3>
              <p className="text-sm text-text-secondary text-center">
                This will permanently delete your account and all journal
                entries. Type <span className="font-bold text-red-400">DELETE</span> to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder='Type "DELETE"'
                className="w-full px-3 py-2.5 bg-white/4 border border-glass-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-red-500 text-center"
              />
              {deleteError && (
                <p className="text-xs text-red-400 text-center">{deleteError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirm("");
                  }}
                  className="flex-1 py-2.5 glass rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== "DELETE" || deleting}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-3xl p-8 w-full max-w-[310px] space-y-5 text-center shadow-[0_24px_24px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Moon icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center">
                  <span className="text-3xl">🌙</span>
                </div>
              </div>

              <h3 className="font-(family-name:--font-playfair) text-xl font-bold text-text-primary">
                Leaving for now?
              </h3>
              <p className="text-sm text-text-secondary">
                Your journal will be here when you return.
              </p>
              {logoutError && (
                <p className="text-xs text-red-400">{logoutError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 glass rounded-full text-sm font-medium text-text-secondary hover:text-text-primary border border-glass-border transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-gradient-to-b from-accent to-accent-glow text-white rounded-full text-sm font-semibold shadow-[0_4px_16px_rgba(88,44,255,0.35)] hover:shadow-[0_6px_24px_rgba(88,44,255,0.45)] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Name Modal */}
      <AnimatePresence>
        {showEditNameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditNameModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-sm space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-(family-name:--font-playfair) text-lg font-bold text-text-primary text-center">
                Edit Display Name
              </h3>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                maxLength={30}
                className="w-full px-3 py-2.5 bg-white/4 border border-glass-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent text-center"
              />
              {saveNameError && (
                <p className="text-xs text-red-400 text-center">{saveNameError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditNameModal(false)}
                  className="flex-1 py-2.5 glass rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={!editName.trim() || savingName}
                  className="flex-1 py-2.5 bg-gradient-to-b from-accent to-accent-glow text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_6px_24px_rgba(88,44,255,0.45)] transition-all"
                >
                  {savingName ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
