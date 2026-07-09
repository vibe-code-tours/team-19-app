# SoulScript

## Overview
Micro-journaling and mood mapping app — a "digital sanctuary" for emotional tracking and mindful reflection.

## Vision
Stunning, minimalist glassmorphism interface where users write journal entries, AI analyzes emotional content, and a mood calendar visualizes emotional patterns over time.

## Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | OpenAI gpt-4o-mini + OpenRouter fallback |
| State | TanStack Query |
| Animation | Framer Motion |
| Testing | Vitest |
| Design | Pencil MCP |

## Design System
- **Fonts:** Playfair Display (headings) + Inter (body)
- **Colors:** Deep midnight gradient (#0B0F19 → #1E1B4B)
- **Glass effect:** `bg-white/5 backdrop-blur-xl border border-white/10`
- **Mood glows:** Radial gradients per emotion (joy=amber, sadness=blue, calm=sky, etc.)

## Key Constraints
- Mobile-first responsive design
- AES-256-GCM encryption for journal content at rest
- Burmese and English language support
- 10 entries per day rate limit
- Minimum 10 entries for monthly report generation
