# Advice Generator App: Next.js

My solution to the [Advice generator app](https://www.frontendmentor.io/challenges/advice-generator-app-QdUG-13db) challenge on Frontend Mentor, built with Next.js 16, React 19, TypeScript and Tailwind CSS v4.
- **Live site:** _add your Vercel URL here_
- **Study guide:** [STUDY_GUIDE.md](STUDY_GUIDE.md) is a write-up of everything I learned building this, aimed at anyone else learning Next.js (especially coming from Astro).

## The challenge

Users should be able to:
- See a piece of advice from the [Advice Slip API](https://api.adviceslip.com/)
- Click the dice to get a new piece of advice
- See the layout adapt between mobile and desktop
- See hover states on the dice button

## How it works

```
app/layout.tsx           Server  <html>, <body>, font, site metadata. Wraps every page.
app/loading.tsx          Server  Fallback shown while the page is waiting for data.
app/error.tsx            Client  Fallback with a retry button if the first load fails.
app/page.tsx             Server  Fetches the first advice before any HTML is sent.
components/
  AdviceGenerator.tsx    Client  "use client": keeps the advice in state, fetches a new one on click.
lib/getAdvice.ts         Shared  The only code that talks to the API. Validates the response with Zod.
```

1. **The first advice is fetched on the server.** `page.tsx` is an `async` Server Component that awaits `getAdvice()`. The visitor gets HTML that already contains the advice, so there's no empty card and no loading spinner from client-side JavaScript.
2. **The page is partially prerendered.** `next build` reports `/` as `◐ Partial Prerender`: the layout and loading fallback are built once as static HTML, and the advice is streamed in per request, because it must be fresh every visit.
3. **The button runs in the browser.** `AdviceGenerator` is the only Client Component. It starts with the server's advice as its initial state, then calls the same `getAdvice()` on click, with a loading state that disables the button while the request is in flight.
4. **The API response is validated.** `getAdvice()` parses the JSON with a Zod schema, so a changed or broken response fails loudly instead of rendering `undefined`. The TypeScript `Slip` type is inferred from the same schema.

### Details worth noting

- **No layout shift:** images get explicit `width`/`height` so the browser reserves space before they load.
- **Art direction:** the divider swaps between mobile and desktop SVGs with a plain `<picture>`. SVGs aren't optimized by `next/image`, so it isn't needed there.
- **`cache: "no-store"`:** the API sends `cache-control: max-age=2`, which made fast double-clicks return the same advice from the browser cache.
- **Error handling:** if the first load fails, `app/error.tsx` shows a retry button. If a click fails, the current advice stays on screen and an inline message explains what happened, with a separate message when the user is offline.
- **No "dead" clicks:** the API picks randomly, so it can return the slip already on screen. The click handler refetches (up to 3 times) when the `id` matches, so a click always visibly changes something.
- **Accessibility:** the icon-only button has an `aria-label` and a visible keyboard focus style; decorative images use `alt=""`; error messages are announced through a `role="status"` live region.
- **Lighthouse:** 98 Performance on the production build (`next build && next start`). The dev server scores much lower and isn't representative.

## Built with

- [Next.js 16](https://nextjs.org/) (App Router, Cache Components)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Zod](https://zod.dev/) for runtime validation
- [Biome](https://biomejs.dev/) for linting and formatting

## Running locally

Requires Node (see `.nvmrc`) and pnpm.

```sh
pnpm install
pnpm next dev          # development server at http://localhost:3000
pnpm next build        # production build
pnpm next start        # serve the production build
pnpm biome check .     # lint + format check
```

If a change to `@theme` in `globals.css` doesn't show up, stop the dev server, delete `.next`, and start it again. The build cache can hold on to an old Tailwind theme.

## What I learned

The short version is below. The full version, with diagrams and a self-quiz, is in [STUDY_GUIDE.md](STUDY_GUIDE.md).
- Server Components are the default; `"use client"` opts a file (and everything it imports) into shipping JavaScript, like an Astro island.
- _Where_ code runs (server vs browser) and _when_ HTML is made (build time vs request time) are two separate questions.
- `<html>` and `<body>` belong in the root layout, because `loading.tsx` and `error.tsx` replace the page _inside_ the layout.
- Handle errors where they happen: an error page when there's nothing to show, an inline message when there's still good content on screen.
- Image `width`/`height` prevent layout shift; "optimization" (resizing, WebP/AVIF) is a separate thing and doesn't apply to SVGs.
- Measure performance on a production build, never on the dev server.
