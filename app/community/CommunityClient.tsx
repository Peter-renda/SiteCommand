"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BOARD_CATEGORIES,
  FOCUS_AREAS,
  REGIONS,
  boardCategoryLabel,
} from "@/lib/community";

// ── Types (mirror the API serializers) ──────────────────────────────────────
type Post = {
  id: string;
  authorName: string;
  category: string;
  title: string;
  body: string;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  mine: boolean;
};
type Reply = { id: string; authorName: string; body: string; createdAt: string; mine: boolean };
type MentorProfile = {
  id: string;
  displayName: string;
  role: "mentor" | "mentee";
  yearsExperience: number;
  focusAreas: string[];
  region: string;
  bio: string;
  contact: string;
  available: boolean;
};
type MentorMatch = MentorProfile & { matchScore: number };
type OfficeHour = {
  id: string;
  hostName: string;
  hostTitle: string;
  topic: string;
  description: string;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  meetingLink: string;
  region: string;
  reserved: number;
  isSignedUp: boolean;
  isHost: boolean;
};
type RegionMember = {
  id: string;
  displayName: string;
  region: string;
  city: string;
  headline: string;
  contact: string;
  mine: boolean;
};
type RegionGroup = { region: string; members: RegionMember[]; count: number };
type LeaderRow = {
  rank: number;
  name: string;
  score: number;
  quizPoints: number;
  scenariosHandled: number;
  checkpointsCaught: number;
  phaseReviews: number;
  sandboxes: number;
  credentialLevel: string | null;
  credentialCode: string | null;
  isMe: boolean;
};

type TabId = "boards" | "mentorship" | "office-hours" | "regions" | "leaderboard";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "boards", label: "Discussion boards", icon: "💬" },
  { id: "mentorship", label: "Mentorship matching", icon: "🤝" },
  { id: "office-hours", label: "Office hours", icon: "🕑" },
  { id: "regions", label: "Regional networking", icon: "📍" },
  { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
];

function timeAgo(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(t).toLocaleDateString();
}

function formatWhen(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CommunityClient({ username, email }: { username: string; email: string }) {
  const [tab, setTab] = useState<TabId>("boards");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href="/dashboard"
              className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
              aria-label="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">Community</h1>
              <p className="text-xs text-gray-400 truncate">
                Connect with construction PMs — learn, mentor, and network
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[40%]">{username || email}</span>
        </div>
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-2 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-orange-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <span className="mr-1.5">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {tab === "boards" && <BoardsSection />}
        {tab === "mentorship" && <MentorshipSection />}
        {tab === "office-hours" && <OfficeHoursSection />}
        {tab === "regions" && <RegionsSection />}
        {tab === "leaderboard" && <LeaderboardSection />}
      </main>
    </div>
  );
}

// ── Shared bits ─────────────────────────────────────────────────────────────
function SectionIntro({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{children}</p>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(220,38,38,0.06)", color: "#B91C1C", border: "1px solid rgba(220,38,38,0.15)" }}>
      {message}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-500 transition-colors";

// ── 1. Discussion boards ────────────────────────────────────────────────────
function BoardsSection() {
  const [category, setCategory] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = category ? `/api/community/posts?category=${category}` : "/api/community/posts";
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      setError("Couldn't load discussions. Try again.");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <SectionIntro title="Discussion boards">
        Ask questions and swap advice with other project managers, by topic.
      </SectionIntro>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            category === "" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
          }`}
        >
          All
        </button>
        {BOARD_CATEGORIES.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCategory(c.slug)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              category === c.slug ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {c.label}
          </button>
        ))}
        <button type="button" onClick={() => setShowForm((s) => !s)} className="btn-primary ml-auto">
          {showForm ? "Cancel" : "＋ New post"}
        </button>
      </div>

      {showForm && <NewPostForm defaultCategory={category || "general"} onCreated={() => { setShowForm(false); load(); }} />}

      <ErrorNote message={error} />

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Loading discussions…</p>
      ) : posts.length === 0 ? (
        <div className="card card-pad text-center text-sm text-gray-500">
          No posts here yet. Be the first to start a discussion.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              open={openPostId === p.id}
              onToggle={() => setOpenPostId((cur) => (cur === p.id ? null : p.id))}
              onReplied={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NewPostForm({ defaultCategory, onCreated }: { defaultCategory: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cat, setCat] = useState(defaultCategory);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, category: cat }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to post");
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card card-pad mb-4 space-y-3">
      <ErrorNote message={error} />
      <input className={inputCls} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>
        {BOARD_CATEGORIES.map((c) => (
          <option key={c.slug} value={c.slug}>{c.label}</option>
        ))}
      </select>
      <textarea className={inputCls} rows={4} placeholder="Share the details…" value={body} onChange={(e) => setBody(e.target.value)} maxLength={8000} />
      <div className="flex justify-end">
        <button type="submit" disabled={busy || !title.trim()} className="btn-primary disabled:opacity-50">
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}

function PostCard({ post, open, onToggle, onReplied }: { post: Post; open: boolean; onToggle: () => void; onReplied: () => void }) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);

  const loadReplies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/posts/${post.id}/replies`);
      if (res.ok) {
        const d = await res.json();
        setReplies(d.replies ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [post.id]);

  useEffect(() => {
    if (open) loadReplies();
  }, [open, loadReplies]);

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/community/posts/${post.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText }),
      });
      if (res.ok) {
        setReplyText("");
        await loadReplies();
        onReplied();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <button type="button" onClick={onToggle} className="w-full text-left card-pad">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(234,88,12,0.08)", color: "#C2410C" }}>
                {boardCategoryLabel(post.category)}
              </span>
              {post.mine && <span className="text-[10px] text-gray-400 font-medium">you</span>}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 truncate">{post.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {post.authorName} · {timeAgo(post.createdAt)} · {post.replyCount} {post.replyCount === 1 ? "reply" : "replies"}
            </p>
          </div>
          <svg className={`w-4 h-4 text-gray-300 shrink-0 mt-1 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-3">
          {post.body && <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{post.body}</p>}
          {loading ? (
            <p className="text-xs text-gray-400">Loading replies…</p>
          ) : (
            <div className="space-y-3 mb-4">
              {replies.map((r) => (
                <div key={r.id} className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-400 mb-0.5">
                    {r.authorName}{r.mine ? " (you)" : ""} · {timeAgo(r.createdAt)}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.body}</p>
                </div>
              ))}
              {replies.length === 0 && <p className="text-xs text-gray-400">No replies yet.</p>}
            </div>
          )}
          <form onSubmit={submitReply} className="flex gap-2">
            <input className={inputCls} placeholder="Write a reply…" value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={8000} />
            <button type="submit" disabled={busy || !replyText.trim()} className="btn-primary disabled:opacity-50 shrink-0">
              {busy ? "…" : "Reply"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── 2. Mentorship matching ──────────────────────────────────────────────────
function MentorshipSection() {
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [matches, setMatches] = useState<MentorMatch[]>([]);
  const [directory, setDirectory] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/community/mentorship");
      if (!res.ok) throw new Error();
      const d = await res.json();
      setProfile(d.profile);
      setMatches(d.matches ?? []);
      setDirectory(d.directory ?? []);
      setEditing(!d.profile);
    } catch {
      setError("Couldn't load mentorship data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>;

  return (
    <div>
      <SectionIntro title="Mentorship matching">
        Sign up as a mentor or mentee. We suggest matches by focus area and region.
      </SectionIntro>
      <ErrorNote message={error} />

      {editing ? (
        <MentorshipForm profile={profile} onSaved={() => load()} onCancel={profile ? () => setEditing(false) : undefined} />
      ) : (
        profile && (
          <div className="card card-pad mb-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: profile.role === "mentor" ? "rgba(37,99,235,0.08)" : "rgba(22,163,74,0.1)", color: profile.role === "mentor" ? "#1D4ED8" : "#15803D" }}>
                    {profile.role === "mentor" ? "Mentor" : "Mentee"}
                  </span>
                  {!profile.available && <span className="text-[10px] text-gray-400">paused</span>}
                </div>
                <p className="text-sm font-semibold text-gray-900">{profile.displayName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {profile.yearsExperience} yr{profile.yearsExperience === 1 ? "" : "s"} experience
                  {profile.region ? ` · ${profile.region}` : ""}
                </p>
                {profile.focusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.focusAreas.map((f) => (
                      <span key={f} className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">{f}</span>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setEditing(true)} className="btn-secondary shrink-0">Edit</button>
            </div>
          </div>
        )
      )}

      {profile && (
        <>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Suggested {profile.role === "mentee" ? "mentors" : "mentees"} for you
          </h3>
          {matches.length === 0 ? (
            <p className="text-sm text-gray-400 mb-6">No matches yet — check back as more people sign up.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {matches.map((m) => (
                <MentorCard key={m.id} m={m} showScore />
              ))}
            </div>
          )}
        </>
      )}

      <h3 className="text-sm font-semibold text-gray-900 mb-3">Everyone available ({directory.length})</h3>
      {directory.length === 0 ? (
        <p className="text-sm text-gray-400">No one else has signed up yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {directory.map((m) => (
            <MentorCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MentorCard({ m, showScore }: { m: MentorProfile & { matchScore?: number }; showScore?: boolean }) {
  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: m.role === "mentor" ? "rgba(37,99,235,0.08)" : "rgba(22,163,74,0.1)", color: m.role === "mentor" ? "#1D4ED8" : "#15803D" }}>
          {m.role === "mentor" ? "Mentor" : "Mentee"}
        </span>
        {showScore && typeof m.matchScore === "number" && m.matchScore > 0 && (
          <span className="text-[10px] font-semibold text-orange-600">{m.matchScore}% match</span>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-900">{m.displayName}</p>
      <p className="text-xs text-gray-500 mt-0.5">
        {m.yearsExperience} yr{m.yearsExperience === 1 ? "" : "s"}{m.region ? ` · ${m.region}` : ""}
      </p>
      {m.bio && <p className="text-xs text-gray-600 mt-2 line-clamp-3">{m.bio}</p>}
      {m.focusAreas.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {m.focusAreas.map((f) => (
            <span key={f} className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">{f}</span>
          ))}
        </div>
      )}
      {m.contact && <p className="text-xs text-gray-500 mt-2">Reach out: <span className="text-gray-700">{m.contact}</span></p>}
    </div>
  );
}

function MentorshipForm({ profile, onSaved, onCancel }: { profile: MentorProfile | null; onSaved: () => void; onCancel?: () => void }) {
  const [role, setRole] = useState<"mentor" | "mentee">(profile?.role ?? "mentee");
  const [years, setYears] = useState(String(profile?.yearsExperience ?? 0));
  const [focus, setFocus] = useState<string[]>(profile?.focusAreas ?? []);
  const [region, setRegion] = useState(profile?.region ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [contact, setContact] = useState(profile?.contact ?? "");
  const [available, setAvailable] = useState(profile?.available ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggleFocus(f: string) {
    setFocus((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/community/mentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, yearsExperience: Number(years) || 0, focusAreas: focus, region, bio, contact, available }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to save");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Remove your mentorship profile?")) return;
    setBusy(true);
    await fetch("/api/community/mentorship", { method: "DELETE" });
    onSaved();
  }

  return (
    <form onSubmit={submit} className="card card-pad mb-6 space-y-4">
      <ErrorNote message={error} />
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">I want to join as a…</label>
        <div className="flex gap-2">
          {(["mentee", "mentor"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                role === r ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {r === "mentor" ? "Mentor (offer guidance)" : "Mentee (seek guidance)"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Years of experience</label>
          <input type="number" min={0} max={60} className={inputCls} value={years} onChange={(e) => setYears(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Region</label>
          <select className={inputCls} value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">— Select —</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Focus areas</label>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleFocus(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                focus.includes(f) ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Short bio</label>
        <textarea className={inputCls} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={2000} placeholder="What you can help with / what you're looking for" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">How to reach you</label>
        <input className={inputCls} value={contact} onChange={(e) => setContact(e.target.value)} maxLength={200} placeholder="Email, LinkedIn, etc." />
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="rounded border-gray-300" />
        Show me in the directory & matches
      </label>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "Saving…" : "Save profile"}</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>}
        {profile && <button type="button" onClick={remove} className="btn-quiet ml-auto text-red-500">Remove profile</button>}
      </div>
    </form>
  );
}

// ── 3. Office hours ─────────────────────────────────────────────────────────
function OfficeHoursSection() {
  const [sessions, setSessions] = useState<OfficeHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/community/office-hours");
      if (!res.ok) throw new Error();
      const d = await res.json();
      setSessions(d.sessions ?? []);
    } catch {
      setError("Couldn't load office hours.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleSignup(s: OfficeHour) {
    setBusyId(s.id);
    try {
      const res = await fetch(`/api/community/office-hours/${s.id}/signup`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Couldn't update your reservation.");
      } else {
        setSessions((cur) => cur.map((x) => (x.id === s.id ? { ...x, reserved: d.reserved, isSignedUp: d.isSignedUp } : x)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function cancelSession(id: string) {
    if (!confirm("Cancel this session?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/community/office-hours?id=${id}`, { method: "DELETE" });
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Office hours with experienced PMs</h2>
          <p className="text-sm text-gray-500 mt-0.5">Drop-in sessions hosted by seasoned PMs. Reserve a seat, or host your own.</p>
        </div>
        <button type="button" onClick={() => setShowForm((s) => !s)} className="btn-primary shrink-0">
          {showForm ? "Cancel" : "＋ Host a session"}
        </button>
      </div>

      {showForm && <OfficeHourForm onCreated={() => { setShowForm(false); load(); }} />}
      <ErrorNote message={error} />

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <div className="card card-pad text-center text-sm text-gray-500">
          No upcoming office hours. Host the first one.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const full = s.reserved >= s.capacity && !s.isSignedUp;
            return (
              <div key={s.id} className="card card-pad">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{s.topic}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.hostName}{s.hostTitle ? `, ${s.hostTitle}` : ""}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      🕑 {formatWhen(s.startsAt)} · {s.durationMinutes} min
                      {s.region ? ` · ${s.region}` : ""}
                    </p>
                    {s.description && <p className="text-sm text-gray-600 mt-2">{s.description}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {s.reserved}/{s.capacity} seats reserved
                      {s.isSignedUp && s.meetingLink && (
                        <>
                          {" · "}
                          <a href={s.meetingLink} target="_blank" rel="noopener noreferrer" className="text-orange-600 underline">Join link</a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {s.isHost ? (
                      <button type="button" onClick={() => cancelSession(s.id)} disabled={busyId === s.id} className="btn-secondary text-red-500">
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleSignup(s)}
                        disabled={busyId === s.id || full}
                        className={s.isSignedUp ? "btn-secondary" : "btn-primary disabled:opacity-50"}
                      >
                        {s.isSignedUp ? "Reserved ✓" : full ? "Full" : "Reserve seat"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OfficeHourForm({ onCreated }: { onCreated: () => void }) {
  const [topic, setTopic] = useState("");
  const [hostTitle, setHostTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState("30");
  const [capacity, setCapacity] = useState("5");
  const [region, setRegion] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || !startsAt) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/community/office-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          hostTitle,
          startsAt: new Date(startsAt).toISOString(),
          durationMinutes: Number(duration) || 30,
          capacity: Number(capacity) || 5,
          region,
          meetingLink,
          description,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to create session");
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card card-pad mb-4 space-y-3">
      <ErrorNote message={error} />
      <input className={inputCls} placeholder="Topic (e.g. Navigating your first buyout)" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={200} />
      <input className={inputCls} placeholder="Your title (e.g. Senior PM, 12 yrs)" value={hostTitle} onChange={(e) => setHostTitle(e.target.value)} maxLength={160} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">When</label>
          <input type="datetime-local" className={inputCls} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Region (optional)</label>
          <select className={inputCls} value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">Any / virtual</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Duration (min)</label>
          <input type="number" min={15} max={180} className={inputCls} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Seats</label>
          <input type="number" min={1} max={100} className={inputCls} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>
      </div>
      <input className={inputCls} placeholder="Meeting link (Zoom, Meet…) — shared with attendees" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} maxLength={500} />
      <textarea className={inputCls} rows={3} placeholder="What you'll cover" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} />
      <div className="flex justify-end">
        <button type="submit" disabled={busy || !topic.trim() || !startsAt} className="btn-primary disabled:opacity-50">
          {busy ? "Creating…" : "Create session"}
        </button>
      </div>
    </form>
  );
}

// ── 4. Regional networking ──────────────────────────────────────────────────
function RegionsSection() {
  const [regions, setRegions] = useState<RegionGroup[]>([]);
  const [profile, setProfile] = useState<RegionMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openRegion, setOpenRegion] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/community/regions");
      if (!res.ok) throw new Error();
      const d = await res.json();
      setRegions(d.regions ?? []);
      setProfile(d.profile);
      setEditing(!d.profile);
      if (d.profile) setOpenRegion(d.profile.region);
    } catch {
      setError("Couldn't load regions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>;

  return (
    <div>
      <SectionIntro title="Regional networking">
        Add yourself to your region and see who else is building nearby.
      </SectionIntro>
      <ErrorNote message={error} />

      {editing ? (
        <RegionForm profile={profile} onSaved={load} onCancel={profile ? () => setEditing(false) : undefined} />
      ) : (
        profile && (
          <div className="card card-pad mb-6 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{profile.displayName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                📍 {profile.region}{profile.city ? ` · ${profile.city}` : ""}
              </p>
              {profile.headline && <p className="text-sm text-gray-600 mt-1">{profile.headline}</p>}
            </div>
            <button type="button" onClick={() => setEditing(true)} className="btn-secondary shrink-0">Edit</button>
          </div>
        )
      )}

      <div className="space-y-2">
        {regions.map((g) => (
          <div key={g.region} className="card">
            <button
              type="button"
              onClick={() => setOpenRegion((cur) => (cur === g.region ? null : g.region))}
              className="w-full flex items-center justify-between card-pad text-left"
            >
              <span className="text-sm font-semibold text-gray-900">{g.region}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{g.count} {g.count === 1 ? "member" : "members"}</span>
                <svg className={`w-4 h-4 text-gray-300 transition-transform ${openRegion === g.region ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {openRegion === g.region && (
              <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                {g.members.length === 0 ? (
                  <p className="text-xs text-gray-400">No members here yet.</p>
                ) : (
                  <div className="space-y-2">
                    {g.members.map((m) => (
                      <div key={m.id} className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-900">
                            {m.displayName}{m.mine ? " (you)" : ""}
                            {m.city ? <span className="text-gray-400"> · {m.city}</span> : null}
                          </p>
                          {m.headline && <p className="text-xs text-gray-500">{m.headline}</p>}
                        </div>
                        {m.contact && <span className="text-xs text-gray-500 shrink-0">{m.contact}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RegionForm({ profile, onSaved, onCancel }: { profile: RegionMember | null; onSaved: () => void; onCancel?: () => void }) {
  const [region, setRegion] = useState(profile?.region ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [contact, setContact] = useState(profile?.contact ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!region) {
      setError("Pick a region.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/community/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, city, headline, contact }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to save");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Remove yourself from your region?")) return;
    setBusy(true);
    await fetch("/api/community/regions", { method: "DELETE" });
    onSaved();
  }

  return (
    <form onSubmit={submit} className="card card-pad mb-6 space-y-3">
      <ErrorNote message={error} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Region</label>
          <select className={inputCls} value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">— Select —</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">City (optional)</label>
          <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} maxLength={120} />
        </div>
      </div>
      <input className={inputCls} placeholder="Headline (e.g. APM at a healthcare GC)" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={200} />
      <input className={inputCls} placeholder="How to reach you (optional)" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={200} />
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "Saving…" : "Join region"}</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>}
        {profile && <button type="button" onClick={remove} className="btn-quiet ml-auto text-red-500">Leave region</button>}
      </div>
    </form>
  );
}

// ── 5. Leaderboard ──────────────────────────────────────────────────────────
function LeaderboardSection() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/community/leaderboard");
        if (!res.ok) throw new Error();
        const d = await res.json();
        setRows(d.leaderboard ?? []);
        setMyRank(d.myRank ?? null);
      } catch {
        setError("Couldn't load the leaderboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <SectionIntro title="Leaderboard">
        Ranked by training-simulation performance — quizzes, scenarios handled, meeting checkpoints caught, phase reviews, and sandboxes run.
      </SectionIntro>
      <ErrorNote message={error} />

      {myRank && (
        <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(234,88,12,0.06)", color: "#C2410C", border: "1px solid rgba(234,88,12,0.15)" }}>
          You&apos;re ranked <strong>#{myRank}</strong>. Run more of the training simulation to climb.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Loading leaderboard…</p>
      ) : rows.length === 0 ? (
        <div className="card card-pad text-center text-sm text-gray-500">
          No simulation performance recorded yet. Launch a{" "}
          <Link href="/training/practice" className="text-orange-600 underline">training sandbox</Link> and start building.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Trainee</th>
                  <th className="px-4 py-2.5 font-medium text-right">Score</th>
                  <th className="px-3 py-2.5 font-medium text-right hidden sm:table-cell">Quiz</th>
                  <th className="px-3 py-2.5 font-medium text-right hidden sm:table-cell">Scenarios</th>
                  <th className="px-3 py-2.5 font-medium text-right hidden md:table-cell">Checkpoints</th>
                  <th className="px-3 py-2.5 font-medium text-right hidden md:table-cell">Reviews</th>
                  <th className="px-3 py-2.5 font-medium text-right hidden lg:table-cell">Sandboxes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.rank} className={`border-b border-gray-50 last:border-0 ${r.isMe ? "bg-orange-50" : ""}`}>
                    <td className="px-4 py-2.5 font-semibold text-gray-500">
                      {r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-900">{r.name}</span>
                      {r.isMe && <span className="ml-1 text-[10px] text-orange-600 font-semibold">you</span>}
                      {r.credentialLevel && (
                        <a
                          href={r.credentialCode ? `/verify/${r.credentialCode}` : "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold align-middle"
                          style={{ background: "rgba(21,128,61,0.1)", color: "#15803D" }}
                        >
                          ✓ {r.credentialLevel}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{r.score.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500 hidden sm:table-cell">{r.quizPoints}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500 hidden sm:table-cell">{r.scenariosHandled}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500 hidden md:table-cell">{r.checkpointsCaught}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500 hidden md:table-cell">{r.phaseReviews}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500 hidden lg:table-cell">{r.sandboxes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
