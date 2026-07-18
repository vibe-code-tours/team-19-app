---
marp: true
paginate: true
transition: fade
size: 16:9
title: SoulScript — Micro-Journaling & Mood Mapping
style: |
  :root {
    --bg-deep: #0B0F19;
    --bg-mid: #1E1B4B;
    --glass: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.10);
    --glow-indigo: rgba(99, 102, 241, 0.25);
    --glow-amber: rgba(245, 158, 11, 0.25);
    --glow-rose: rgba(244, 63, 94, 0.25);
    --text-primary: #F1F5F9;
    --text-secondary: #94A3B8;
    --text-muted: #64748B;
    --accent: #818CF8;
    --accent-warm: #F59E0B;
  }
  section {
    background: linear-gradient(135deg, var(--bg-deep) 0%, var(--bg-mid) 100%);
    color: var(--text-primary);
    font-family: "Inter", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 26px;
    line-height: 1.6;
    padding: 64px 72px;
  }
  section::after {
    color: var(--text-muted);
  }
  h1, h2, h3 {
    font-family: "Playfair Display", "Iowan Old Style", Georgia, serif;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }
  h1 { font-size: 64px; line-height: 1.05; margin: 0 0 .2em; }
  h2 { font-size: 42px; margin: 0 0 .5em; }
  h2::after {
    content: ""; display: block; width: 64px; height: 4px;
    background: var(--accent); margin-top: 14px; border-radius: 2px;
  }
  h3 { font-size: 30px; margin: 0 0 .3em; }
  strong { color: var(--accent); }
  em { color: var(--text-secondary); font-style: italic; }
  a { color: var(--accent); text-decoration: none; }
  code {
    background: var(--glass); color: var(--accent);
    padding: 2px 8px; border-radius: 6px; font-size: 0.85em;
    border: 1px solid var(--glass-border);
  }
  pre {
    background: rgba(0, 0, 0, 0.4) !important;
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 20px 24px;
  }
  pre code {
    background: none; border: none; padding: 0;
  }
  table { font-size: 22px; border-collapse: collapse; width: 100%; }
  th {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    text-align: left; padding: 12px 18px;
    color: #FFFFFF; font-weight: 700;
    font-family: "Inter", sans-serif;
    letter-spacing: 0.02em;
  }
  td {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 12px 18px;
    color: #F1F5F9;
  }
  blockquote {
    border-left: 4px solid var(--accent);
    background: var(--glass);
    padding: 16px 24px;
    border-radius: 0 12px 12px 0;
    margin: 1em 0;
    font-style: italic;
    color: var(--text-secondary);
  }
  ul { margin-top: .2em; }
  li { margin: .3em 0; }
  section.lead {
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    text-align: center;
  }
  section.lead h1 { font-size: 80px; }
  section.lead h2 { font-size: 32px; font-family: "Inter", sans-serif; font-weight: 400; color: var(--text-secondary); }
  section.lead::after { display: none; }
  .glass-card {
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: 24px 32px;
    backdrop-filter: blur(20px);
  }
  .tag {
    display: inline-block; background: var(--accent); color: var(--bg-deep);
    font-size: 14px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; padding: 6px 16px; border-radius: 999px;
  }
  .tag-warm {
    background: var(--accent-warm); color: var(--bg-deep);
  }
  .muted { color: var(--text-muted); }
  .secondary { color: var(--text-secondary); }
  img {
    border-radius: 12px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
    border: 1px solid var(--glass-border);
  }
  section.dark { background: #050810; }
  section.dark h2::after { background: var(--accent-warm); }
  section.dark strong { color: var(--accent-warm); }
  footer, header { color: var(--text-muted); }
---

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="tag">Digital Sanctuary</span>

# SoulScript

### A micro-journaling & mood mapping app for emotional tracking and mindful reflection.

<span class="muted">Your soul, mapped.</span>

---

## The Problem

Journaling apps treat your emotions like checkboxes.

| What Exists             | What's Missing                                         |
| ----------------------- | ------------------------------------------------------ |
| 📝 **Generic journals** | No emotional intelligence — just text boxes            |
| 📊 **Mood trackers**    | Manual emoji picking — no AI understanding             |
| 🔓 **Cloud notebooks**  | Your deepest thoughts on someone else's server         |
| 📱 **Habit apps**       | Gamified, not reflective — streaks over self-awareness |

> People don't need another to-do list for their feelings.
> They need a **sanctuary** that understands them.

---

## What is SoulScript?

**SoulScript** is a stunning, minimalist web app — a digital sanctuary for emotional tracking and mindful reflection.

✨ **AI-Powered Sentiment Analysis** — Write freely, the AI detects your emotions
📅 **Mood Calendar** — See your emotional landscape as a living constellation
📈 **Monthly Insights** — AI-generated patterns, trends, and actionable recommendations
🔒 **Encrypted at Rest** — AES-256-GCM encryption, even in the database
🌏 **Burmese + English** — Bilingual with automatic Unicode detection

> Write how you feel. The sanctuary listens.

---

## The Experience — Dashboard

![w:1000 h:560](../public/screenshots/dashboard.png)

_Dynamic greeting · borderless textarea · breathing glow · 4-second undo_

---

## AI-Powered Sentiment Analysis

Write in **Burmese or English** — the AI understands both.

```json
{
  "primary_emotion": "calm",
  "emoji": "😌",
  "secondary_emotions": ["grateful", "hopeful"],
  "glow_theme": "from-sky-500/20 to-blue-600/20"
}
```

| What the AI Does          | How                                               |
| ------------------------- | ------------------------------------------------- |
| 🔍 **Detects language**   | Unicode range check (U+1000–U+109F)               |
| 🧠 **Analyzes sentiment** | OpenRouter · Llama 3 8B (free tier)               |
| 🎨 **Assigns glow theme** | Validated against 10-mood palette                 |
| ✅ **Structured output**  | `response_format: json_object` — guaranteed valid |

---

## The Mood Calendar

![w:1000 h:560](../public/screenshots/calendar.png)

_Emoji constellations · pulsing glow circles · Framer Motion overlay morph_

---

## Monthly "Mind Journey" Report

Three-stage AI analysis, revealed on demand:

| Stage                        | What It Shows                                    |
| ---------------------------- | ------------------------------------------------ |
| 🌟 **The Big Picture**       | Dominant mood emoji, name, and frequency count   |
| 🔮 **Pattern Recognition**   | 2–3 AI-detected insights with quote-style blocks |
| 🛠️ **Actionable Frameworks** | 2–3 personalized recommendations                 |

> _"We noticed anxiety peaks typically follow late-night productivity mentions."_
> _"Your calmest days tended to fall on weekends."_

Requires **10+ entries** to unlock — encouraging consistent journaling.

---

## Privacy First

Your journal entries are **encrypted** — even in the database.

| Layer                | Protection                                          |
| -------------------- | --------------------------------------------------- |
| 🔐 **Encryption**    | AES-256-GCM with unique IV per entry                |
| 🗄️ **Database**      | Supabase PostgreSQL with Row-Level Security         |
| 🛡️ **Middleware**    | All `/api/*` routes protected — session via cookies |
| 🚫 **No client key** | Encryption key never exposed to the browser         |
| 🗑️ **Soft delete**   | 4-second undo window, then permanent                |

> Only you can read your entries. Not the database, not the server, not us.

---

## Bilingual — Burmese & English

Built for **Myanmar's community** — with full English support.

- 📝 **User sets default** — Burmese or English in Settings
- 🔍 **Auto-detection** — Unicode script range checks every entry
- 🤖 **Bilingual AI** — Single system prompt handles both languages
- 🏷️ **English labels** — Emotion tags always returned in English for consistency

```
User writes: "ဒီနေ့ အရမ်းပျော်တယ်"
AI returns:  { primary_emotion: "joy", emoji: "😄" }
```

---

## Tech Stack

**Framework:** Next.js 16 (App Router, React 19)
**Database & Auth:** Supabase (Google OAuth + Email)
**AI:** OpenRouter free tier (Llama 3 8B)
**Styling:** Tailwind CSS 4 + Glassmorphism
**Animation:** Framer Motion
**Encryption:** AES-256-GCM
**Testing:** Vitest + Testing Library
**Design:** 7-screen prototype in Pencil MCP

---

## How It was built

| Tool                              | Role                                                |
| --------------------------------- | --------------------------------------------------- |
| 🔌 **MCP: Pencil**                | 7-screen visual prototype before code               |
| 🎨 **Skill: emilkowalski/skills** | Design engineering patterns & UI component guidance |
| ⚡ **Methodology: GSD**           | Get Shit Done — ship fast, iterate faster           |
| 🪝 **Hook**                       | —                                                   |

**Built with** Claude Code — spec-driven, AI-assisted from design to deployment.

---

## Implementation Stats

| Metric               | Result                                                         |
| -------------------- | -------------------------------------------------------------- |
| 🧪 **Tests**         | 378/378 passing                                                |
| 📐 **Spec sections** | 13 major sections, 9 feature specs                             |
| 🏗️ **Phases**        | 9 complete phases                                              |
| 📱 **Screens**       | 7 (Dashboard, Calendar, Overlay, Report, Login, Settings, 404) |
| 🔌 **API Routes**    | 6 (analyze, report, entries, entries/[id], profile, account)   |
| 🔐 **Encryption**    | AES-256-GCM — entries encrypted at rest                        |

---

## Done Checklist

- [x] **Repo ready** — SoulScript project complete
- [x] **MCP: Pencil** — 7-screen visual prototype
- [x] **Skill: emilkowalski/skills** — Design engineering guidance
- [x] **Methodology: GSD** — Ship fast, iterate faster
- [x] **Tests passing** — 378/378
- [x] **AI integrated** — OpenRouter sentiment analysis + monthly reports
- [x] **Encryption** — AES-256-GCM for all journal entries
- [x] **Bilingual** — Burmese + English with Unicode detection
- [x] **Mobile-first** — Responsive, bottom sheets, thumb-friendly

---

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="tag-warm tag">Your Soul, Mapped</span>

# SoulScript

### Write how you feel. The sanctuary listens.

<span class="muted">Built with Next.js 16 · Supabase · OpenRouter · Framer Motion</span>
