---
marp: true
paginate: true
transition: fade
size: 16:9
title: SoulScript — မိုက်ကရို ဂျာနယ်လ် & စိတ်ခံစားမှု မြေပုံ
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

### ခံစားချက်တွေကို နားထောင်ပေးမယ့် ဒီဂျီတယ် ဗိသုကာ

<span class="muted">သင့်စိတ်ကို မြေပုံရေးဆွဲကြည့်ပါ</span>

---

## ပြဿနာက ဘာလဲ

ဂျာနယ်လ်အက်ပ်တွေက ခံစားချက်တွေကို checklist လို ဆက်ဆံနေတယ်။

| ရှိနေပြီးသား | ဘာလိုအပ်နေလဲ |
|---|---|
| 📝 **ရိုးရိုးဂျာနယ်လ်များ** | စိတ်ပိုင်းဆိုင်ရာ နားမလည် — စာသားဘူတာပဲ |
| 📊 **Mood Tracker များ** | Emoji ကိုယ်တိုင်ရွေး — AI မပါဘူး |
| 🔓 **Cloud မှတ်စုများ** | နက်နက်ရှိုင်းဆုံးအတွေးတွေကို တစ်ယောက်ယောက်ရဲ့ server ပေါ်မှာ |
| 📱 **Habit App များ** | Streak ကစားနေရတာ — သတိတရားမပါဘူး |

> လူတွေက ခံစားချက်အတွက် to-do list ထပ်မလိုဘူး။
> **နားလည်ပြီး ကူညီပေးမယ့်** digital sanctuary တစ်ခုပဲ လိုတယ်။

---

## SoulScript ဆိုတာ

**SoulScript** က စိတ်ခံစားမှုတွေကို မှတ်တမ်းတင်ဖို့၊ ပြန်လည်သုံးသပ်ဖို့ ဖန်တီးထားတဲ့ ဒီဂျီတယ် sanctuary ပါ။

✨ **AI က ခံစားချက်ကို ဖတ်ပေးတယ်** — လွတ်လပ်စွာရေးလိုက်ပါ, AI က သင့်စိတ်ကို ခွဲခြမ်းစိတ်ဖြာပေးမယ်
📅 **Mood Calendar** — သင့်စိတ်ခံစားမှုတွေကို ကြယ်တံခွန်ပုံစံနဲ့ မြင်ရမယ်
📈 **လစဉ် Insight** — AI က ပုံစံများ, လမ်းကြောင်းများနဲ့ အကြံပေးချက်များ ထုတ်ပေးမယ်
🔒 **ကုဒ်ဝှက်ထားတယ်** — Database ထဲမှာပဲ AES-256-GCM encryption နဲ့
🌏 **မြန်မာ + အင်္ဂလိပ်** — Unicode detection နဲ့ နှစ်ဘာသာ ပံ့ပိုးထားတယ်

> သင့်စိတ်ကို ရေးလိုက်ပါ။ Sanctuary က နားထောင်ပေးမယ်။

---

## Dashboard အတွေ့အကြုံ

![w:1000 h:560](../public/screenshots/dashboard.png)

*Dynamic greeting · borderless textarea · breathing glow · 4-second undo*

---

## AI-powered ခံစားချက် ရာထားချက်

**မြန်မာလိုဖြစ်ဖြစ်၊ အင်္ဂလိပ်လိုဖြစ်ဖြစ် ရေးလိုက်ပါ** — AI က နှစ်ဘာသာလုံး နားလည်တယ်။

```json
{
  "primary_emotion": "calm",
  "emoji": "😌",
  "secondary_emotions": ["grateful", "hopeful"],
  "glow_theme": "from-sky-500/20 to-blue-600/20"
}
```

| AI က ဘာလုပ်ပေးလဲ | ဘယ်လိုလုပ်လဲ |
|---|---|
| 🔍 **ဘာသာစကား ရှာဖွေတယ်** | Unicode range check (U+1000–U+109F) |
| 🧠 **ခံစားချက် ရှာဖွေတယ်** | OpenRouter · Llama 3 8B (အခမဲ့) |
| 🎨 **Glow theme ပေးတယ်** | Mood အရောင် ၁₀ မျိုးထဲက ရွေးပေးတယ် |
| ✅ **Structured output** | `response_format: json_object` — JSON အမြဲရတယ် |

---

## Mood Calendar

![w:1000 h:560](../public/screenshots/calendar.png)

*Emoji ကြယ်တံခွန်များ · pulsing glow · Framer Motion overlay morph*

---

## လစဉ် "Mind Journey" အစီရင်ခံစာ

တောင်းဆိုမှသာ AI ခွဲခြမ်းပေးတဲ့ အဆင့် ၃ ဆင့် —

| အဆင့် | ဘာမြင်ရမလဲ |
|---|---|
| 🌟 **The Big Picture** | အဓိက mood emoji, အမည်နဲ့ ရက်ပေါင်း |
| 🔮 **Pattern Recognition** | AI တွေ့ရှိချက် ထိုးထွင်းသိမြင်မှု ၂-၃ ခု |
| 🛠️ **Actionable Frameworks** | ကိုယ်တိုင်ကျင့်သုံးနိုင်တဲ့ အကြံပြုချက် ၂-၃ ခု |

> *"ညဘက် အလုပ်လုပ်ပြီးနောက် စိတ်ပူပန်မှု ပိုများလာတတ်တယ်။"*
> *"အေးချမ်းဆုံးနေ့တွေက အပတ်ကုန်တွေမှာ ဖြစ်တတ်တယ်။"*

ရက်ပေါင်း **၁₀ ရက်ကျော်** ရေးပြီးမှ ဖွင့်လို့ရမယ် — ဆက်ရေးဖို့ အားပေးချက်ပေးထားတယ်။

---

## ကိုယ်ရေးလုံခြုံမှု

သင့် journal entry တွေကို **ကုဒ်ဝှက်ထားတယ်** — database ထဲမှာပဲ။

| အလတ်စား | ဘယ်လိုကာကွယ်လဲ |
|---|---|
| 🔐 **Encryption** | AES-256-GCM — entry တိုင်း IV ကွာခြားတယ် |
| 🗄️ **Database** | Supabase PostgreSQL + Row-Level Security |
| 🛡️ **Middleware** | `/api/*` route အားလုံး session ဖြင့် ကာကွယ်ထားတယ် |
| 🚫 **Key မပေါက်ဘူး** | Encryption key ကို browser ဘက် ဘယ်တော့မှ မပေးဘူး |
| 🗑️ **Undo ရတယ်** | စက္ကန့် ၄ ခုထိ undo ရတယ် — ပြီးရင် အမြဲပဲ |

> သင့်စာပိုဒ်ကို သင်တစ်ယောက်တည်းပဲ ဖတ်နိုင်တယ်။ Database မဟုတ်ဘူး, server မဟုတ်ဘူး, ကျွန်တော်တို့လည်း မဟုတ်ဘူး။

---

## နှစ်ဘာသာ ပံ့ပိုးမှု

**မြန်မာ့လူမှုအသိုင်းအဝိုင်း** အတွက် ရည်ရွယ်ပြီး အင်္ဂလိပ်ဘာသာကိုလည်း အပြည့်အဝ ပံ့ပိုးထားတယ်။

- 📝 **User က ဘာသာစကား ရွေးလို့ရတယ်** — Settings မှာ မြန်မာ သို့မဟုတ် အင်္ဂလိပ်
- 🔍 **Unicode detection** — မြန်မာလိုရေးရင် မြန်မာလိုပဲ ရှာဖွေပေးတယ်
- 🤖 **Bilingual AI** — System prompt တစ်ခုတည်းက ဘာသာစကား နှစ်မျိုးလုံးကိုင်တယ်
- 🏷️ **Emotion label တွေက အင်္ဂလိပ်လိုပဲ** — ညီညီညွတ်ညွတ် ရှိအောင်

```
User ရေးတယ်: "ဒီနေ့ အရမ်းပျော်တယ်"
AI ပြန်တယ်:  { primary_emotion: "joy", emoji: "😄" }
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
**Design:** Pencil MCP ဖြင့် screen ၇ ခု prototype

---

## ဘယ်လိုဆောက်ခဲ့လဲ

| Tool | အခန်းကဏ္ဍ |
|---|---|
| 🔌 **MCP: Pencil** | Code မရေးခင် screen ၇ ခု visual prototype |
| 🎨 **Skill: emilkowalski/skills** | Design engineering pattern များ & UI component guidance |
| ⚡ **Methodology: GSD** | Get Shit Done — မြန်မြန်ဆောင်ရွက်, မြန်မြန်တိုးတက်အောင်လုပ် |
| 🪝 **Hook** | — |

**Claude Code** ဖြင့် ဒီဇိုင်းကနေ deployment ထိ AI-assisted ဖြင့် တည်ဆောက်ထားတယ်။

---

## တည်ဆောက်မှု စာရင်း

| Metric | ရလဒ် |
|---|---|
| 🧪 **Tests** | 378/378 အောင်မြင် |
| 📐 **Spec sections** | အပိုင်းကြီး ၁₃ ပိုင်း, feature spec ၉ ခု |
| 🏗️ **Phases** | အပိုင်း ၉ ပိုင်း ပြီးဆုံး |
| 📱 **Screens** | Dashboard, Calendar, Overlay, Report, Login, Settings, 404 |
| 🔌 **API Routes** | analyze, report, entries, entries/[id], profile, account |
| 🔐 **Encryption** | AES-256-GCM — entry တိုင်း ကုဒ်ဝှက်ထားတယ် |

---

## ပြီးဆုံးပြီ

- [x] **Repo အဆင်သင့်** — SoulScript project complete
- [x] **MCP: Pencil** — 7-screen visual prototype
- [x] **Skill: emilkowalski/skills** — Design engineering guidance
- [x] **Methodology: GSD** — မြန်မြန်ဆောင်ရွက်, မြန်မြန်တိုးတက်
- [x] **Tests** — 378/378 အောင်မြင်
- [x] **AI Integration** — OpenRouter sentiment analysis + monthly reports
- [x] **Encryption** — entry တိုင်း AES-256-GCM
- [x] **Bilingual** — မြန်မာ + အင်္ဂလိပ် Unicode detection ဖြင့်
- [x] **Mobile-first** — Responsive, bottom sheets, thumb-friendly

---

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="tag-warm tag">Your Soul, Mapped</span>

# SoulScript

### သင့်စိတ်ကို ရေးလိုက်ပါ။ Sanctuary က နားထောင်ပေးမယ်။

<span class="muted">Next.js 16 · Supabase · OpenRouter · Framer Motion ဖြင့် တည်ဆောက်ထားတယ်</span>
