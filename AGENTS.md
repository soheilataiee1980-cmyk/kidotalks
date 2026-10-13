# Kidotalks - rules for the coding agent

## Project
Kidotalks is a paid Persian-language website that teaches English to kids aged 5-8. Parents register, buy a subscription, and manage child profiles; kids do lessons, exercises and watch videos. Read SPEC.md before any task. The old prototype is in legacy/ and is reference only.

## Stack
Next.js (App Router, no src folder), TypeScript, Tailwind, Supabase (auth + Postgres with RLS), deployed on Vercel.

## Hard rules
- Work on ONE task from TASKS.md at a time. Do not start the next task.
- Never edit or delete anything inside legacy/. Never copy legacy/assets/book into public/ or serve it (copyrighted book scans, no license yet).
- Never put secrets or keys in code or in Git. Use environment variables and tell me which to add in .env.local and Vercel.
- Never run git commit or git push. I commit with GitHub Desktop.
- Ask before installing new packages or making big structural changes, and say why.
- After every task run npm run lint and npm run build, and fix errors before saying the task is done.
- All user-facing text is Persian, right-to-left (dir=rtl). Fonts: Vazirmatn for Persian and Fredoka for English, self-hosted via @fontsource, never loaded from Google Fonts.
- Everything on the site except the public pages (home, pricing, about, login, signup) requires an active paid subscription. Nothing is free.
- Validate all form and API input (use zod). Enable Row Level Security on every Supabase table; a parent can only access their own data and their own children's data.
- Children's data: only a nickname and an avatar. No other personal data.

## Design tokens (from the prototype)
Background #FFF8E7, ink #2B2B3A, card #FFFFFF, blue #4DA3FF, yellow #FFD54F, mint #5DD6A2, coral #FF7A59, purple #9B7BFF, brand purple #6246AC. Rounded buttons (about 20px radius) with thick dark borders and a solid bottom shadow, kid-friendly feel. Mobile first.

## How to report
I am a complete beginner. After each task explain in simple Persian: what you changed, which files, and exactly how I can test it in the browser.
