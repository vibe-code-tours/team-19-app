"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const [profile, setProfile] = useState<{
    display_name: string;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email || "");
      setAvatarUrl(user.user_metadata?.avatar_url || null);

      const { data } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    }
    loadProfile();
  }, [supabase, router]);

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      router.push("/login");
    }
    setDeleting(false);
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="skeleton h-64 w-full max-w-sm rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pb-8 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <button onClick={() => router.push("/")} className="p-2 text-text-secondary hover:text-text-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-text-primary">
          Settings
        </h1>
        <div className="w-9" />
      </div>

      <div className="space-y-7 mt-4">
        {/* Profile Card */}
        <div className="glass rounded-xl p-6 space-y-5">
          <p className="text-[10px] font-semibold tracking-wider text-accent">
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
                <span className="font-[family-name:var(--font-playfair)] text-xl font-bold text-white">
                  {initials}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-text-primary text-base">
                {profile?.display_name || "User"}
              </p>
              <p className="text-sm text-text-secondary">{email}</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass rounded-xl p-6 space-y-4 border border-red-500/20">
          <p className="text-[10px] font-semibold tracking-wider text-red-400">
            DANGER ZONE
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            Permanently delete your account and all journal entries. This action
            cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500 text-red-400 font-medium hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Account
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
              <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-text-primary text-center">
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
                className="w-full px-3 py-2.5 bg-glass border border-glass-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-red-500 text-center"
              />
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
    </div>
  );
}
