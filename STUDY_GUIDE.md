# Learning Next.js by Building One Small App

This is my study guide from building the [advice generator](README.md). I came from Astro, and a lot of Next.js felt hidden or magical at first, so this guide explains the *why* behind each thing I ran into, using this app as the example. If you're on a similar path, I hope it saves you some confusion.

Each section ends with a short **Check yourself** question. The answers are in collapsible blocks so you can try first.

**Contents**

1. [The two questions: *where* and *when*](#1-the-two-questions-where-and-when)
2. [Server vs Client Components](#2-server-vs-client-components)
3. [Static vs dynamic: when HTML gets made](#3-static-vs-dynamic-when-html-gets-made)
4. [Files: layout, page, loading](#4-files-layout-page-loading)
5. [Fetching data](#5-fetching-data)
6. [Images](#6-images)
7. [Fonts](#7-fonts)
8. [Tailwind v4 notes](#8-tailwind-v4-notes)
9. [Debugging lessons](#9-debugging-lessons)
10. [Glossary](#10-glossary)
11. [What I thought vs what's true](#11-what-i-thought-vs-whats-true)

---

## 1. The two questions: *where* and *when*

Most of my confusion came from mixing up two separate questions:

| Question | Options | Controlled by |
|---|---|---|
| **Where** does this code run? | Server only, or server **and** browser | `"use client"` |
| **When** is the HTML made? | Once at build time (static), or on every request (dynamic) | What data the code uses |

They're independent. A Server Component can be static or dynamic. A Client Component's HTML can also be static or dynamic. Keep these two questions apart and most of Next.js makes sense.

<details>
<summary><b>Check yourself:</b> Does adding <code>"use client"</code> make a page dynamic?</summary>

No. `"use client"` answers *where* (it ships the component's JavaScript to the browser). Whether the HTML is static or dynamic depends on the data it uses.
</details>

---

## 2. Server vs Client Components

Every component in the `app/` folder is a **Server Component** by default. You opt into browser JavaScript by putting `"use client"` at the top of a file.

| | Server Component (default) | Client Component (`"use client"`) |
|---|---|---|
| Renders to HTML on the server | ✅ | ✅ **also** |
| Its JavaScript is sent to the browser | ❌ | ✅, then it *hydrates* |
| `useState`, `onClick`, `useEffect` | ❌ | ✅ |
| `async` / `await` directly in the component | ✅ | ❌ |
| Can use secrets, databases, server-only code | ✅ | ❌ (everything ships to the browser) |
| Astro equivalent | a `.astro` component | a framework component with `client:load` |

**Client Components are still rendered on the server first.** The visitor gets finished HTML, then React loads in the browser and attaches the event handlers (*hydration*). That's exactly what an Astro island with `client:load` does.

### The boundary flows downward through imports

`"use client"` marks a **file**, and everything *that file imports* also becomes client code:

```
page.tsx (server)            ← runs getAdvice() on the server, ships no JS
 └─ <AdviceGenerator>        ← "use client": this file + its imports go to the browser
      ├─ next/image
      ├─ the SVG imports
      └─ lib/getAdvice.ts    ← imported here, so it (and Zod) ship to the browser too
```

The page *renders* a Client Component, but that doesn't make the page a Client Component. The boundary only goes down the tree.

### Props crossing the boundary must be plain data

When a Server Component passes props to a Client Component, they're sent over the network. Strings, numbers, plain objects and arrays work. Functions and class instances don't. (Astro islands have the same rule.)

<details>
<summary><b>Check yourself:</b> In this app, which code runs in the browser?</summary>

`AdviceGenerator.tsx` and everything it imports: `next/image`, the SVG imports, React's `useState`, and `lib/getAdvice.ts` (including Zod). `page.tsx`, `layout.tsx` and `loading.tsx` never ship their own JavaScript.
</details>

---

## 3. Static vs dynamic: when HTML gets made

| | Static | Dynamic |
|---|---|---|
| HTML made | once, at `next build` | on every request |
| Served from | a CDN, as a file | a server function (on Vercel, a serverless function) |
| Speed | fastest | waits for the server and any data it fetches |
| Good for | content that's the same for everyone | fresh or per-user data |

### Next.js decides automatically

In Astro you mark pages with `export const prerender = true/false`. In Next.js there's no switch to flip. **A route is static unless it uses something that can only be known at request time:**

- an uncached `fetch` or database call
- `cookies()`, `headers()`, `searchParams`

### Partial Prerendering: both in one page

This project has `cacheComponents: true` in `next.config.ts`. With that on, a page doesn't have to be all-static or all-dynamic. The build output for this app shows:

```
Route (app)
┌ ◐ /
└ ○ /_not-found

○  (Static)             prerendered as static content
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
```

For `/`, that means:

```
┌─ static shell (built once, served instantly from the CDN) ──────┐
│  <html> <body>  ← layout.tsx                                     │
│    "Loading advice…"  ← loading.tsx                              │
│                                                                  │
│    ┌─ dynamic hole (filled per request, streamed in) ─────────┐  │
│    │  page.tsx awaits getAdvice() → advice card replaces it   │  │
│    └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

The rule with Cache Components: **any uncached data must sit inside a `<Suspense>` boundary** (or a `loading.tsx`, which creates one for you). That boundary marks where the static shell ends and the per-request part begins. Without one you get a "blocking route" / "uncached data outside Suspense" error.

### Turning dynamic into static

If the data doesn't need to be fresh on every request, cache it with `"use cache"`:

```ts
import { cacheLife } from "next/cache";

export async function getAdvice() {
  "use cache";
  cacheLife("hours");
  // ...fetch
}
```

Now the result becomes part of the static output and is refreshed on the schedule you set. In this app that would show every visitor the same advice for an hour, so I didn't use it.

To *guarantee* a route stays static (the closest thing to Astro's `prerender = true`), use `export const ensureStatic = "navigation"`. The build then fails if someone later adds request-time data. (With Cache Components on, the older `export const dynamic = "force-static"` config is removed.)

### "Static HTML" is not the same as "static JavaScript"

These are easy to mix up:

- **HTML** is either prerendered (static) or rendered per request (dynamic). That's what this section is about.
- **JavaScript bundles** for Client Components are *always* static files on the CDN, built once at `next build`. Whether a page is static or dynamic doesn't change that.

<details>
<summary><b>Check yourself:</b> Why is <code>/</code> partially prerendered instead of fully static?</summary>

`page.tsx` awaits an uncached `fetch` (`cache: "no-store"`) because the advice should be fresh every visit. Everything outside the Suspense boundary (layout, loading fallback) can still be built once. Only the part inside it renders per request.
</details>

---

## 4. Files: layout, page, loading

In the App Router, **file names have meaning**. Each folder in `app/` is a URL segment, and special files inside it play specific roles:

| File | Role |
|---|---|
| `layout.tsx` | Wraps every page below it. **Stays mounted** when you navigate between pages. The root one must render `<html>` and `<body>`. |
| `page.tsx` | The content for this URL. Without it, the folder isn't a route. |
| `loading.tsx` | Fallback shown while the page waits for data. |
| `error.tsx`, `not-found.tsx` | Other fallbacks (not used here). |

### Why `<body>` has to be in the layout

This is what Next.js actually builds from those files:

```tsx
<RootLayout>                          // layout.tsx
  <Suspense fallback={<Loading />}>   // loading.tsx
    <Page />                          // page.tsx
  </Suspense>
</RootLayout>
```

`loading.tsx` **replaces the page**, inside the layout. So:

- If `<body>` is in the **layout**: while loading you get `<html><body><p>Loading…</p></body></html>`. ✅ Valid.
- If `<body>` is in the **page**: while loading you get `<html><p>Loading…</p></html>`. ❌ No body. Next.js validates the loading shell, fails, and in my case showed a confusing "Invariant… this is a bug in Next.js" error.

And if *both* render `<body>`, you get a `<body>` nested inside a `<body>`: invalid HTML, hydration errors, and a lower Lighthouse Best Practices score.

**Rule:** `<html>` and `<body>` live in the root layout. Pages return their content (`<main>`, etc.).

### Metadata

Both layouts and pages can `export const metadata`. They **merge**: the page wins on fields both define, and inherits the rest. For example, the page sets a `title` and still gets the layout's favicon. This only works in Server Components.

<details>
<summary><b>Check yourself:</b> You add a second page, <code>app/about/page.tsx</code>. Which parts of the current UI does it get for free?</summary>

Everything in the root layout: `<html>`, `<body>` with its background and flex classes, the Manrope font, `globals.css`, and the site-wide metadata. It also inherits `app/loading.tsx`, because special files apply to their own folder and everything below it. To give `/about` a different loading state, add `app/about/loading.tsx`.
</details>

---

## 5. Fetching data

This app fetches in two places, for two different reasons:

```
first visit                           clicking the dice
───────────                           ─────────────────
server fetches advice                 browser fetches advice
→ HTML already contains the text      → state updates, text swaps
(page.tsx, Server Component)          (AdviceGenerator.tsx, Client Component)
```

### On the server: just `await`

```tsx
// app/page.tsx
export default async function Page() {
  const slip = await getAdvice();
  return <AdviceGenerator advice={slip.advice} id={slip.id} />;
}
```

No `useEffect`, no loading flash. A Server Component can be `async`.

### In the browser: state + a click handler

```tsx
// components/AdviceGenerator.tsx
"use client";

const [slip, setSlip] = useState<Slip>({ advice, id }); // server data = starting value
const [isLoading, setIsLoading] = useState(false);

async function handleClick() {
  setIsLoading(true);
  try {
    setSlip(await getAdvice());
  } finally {
    setIsLoading(false); // runs even if the request fails
  }
}
```

- **Props are only the starting value.** The JSX reads from `slip` (state), because only state changes trigger a re-render.
- **`disabled={isLoading}`** prevents five clicks from firing five requests.
- **`finally`** makes sure the button isn't stuck disabled if the request throws.

### Validate where outside data enters

`res.json()` returns `any`. A TypeScript type on it is a *promise you make*, not a check. Zod actually checks:

```ts
// lib/getAdvice.ts
const SlipSchema = z.object({ advice: z.string(), id: z.number() });
const AdviceResponseSchema = z.object({ slip: SlipSchema });
export type Slip = z.infer<typeof SlipSchema>; // type comes from the schema

export async function getAdvice(): Promise<Slip> {
  const response = await fetch("https://api.adviceslip.com/advice", { cache: "no-store" });
  if (!response.ok) throw new Error(`Advice API failed: ${response.status}`);
  return AdviceResponseSchema.parse(await response.json()).slip;
}
```

- **`response.ok`:** `fetch` only throws on network failure, *not* on a 404 or 500. You have to check.
- **One function, one place** that knows the API's shape. Server and client both import it.
- **Trade-off:** importing this into a Client Component ships Zod to the browser. For a small app that's fine.
- **`cache: "no-store"`:** this API sends `cache-control: max-age=2`, so quick double-clicks got the same advice from the browser cache.

<details>
<summary><b>Check yourself:</b> <code>getAdvice</code> has no <code>"use client"</code>. When you click the dice, does the request go to your server or to api.adviceslip.com?</summary>

Straight to `api.adviceslip.com`. A function runs wherever the code that *calls* it runs. The click handler runs in the browser, so the fetch does too. Open DevTools → Network and click to see it.
</details>

---

## 6. Images

Two separate benefits, often mixed up:

| | Resizing / converting (WebP, AVIF) | Reserving space before load |
|---|---|---|
| `<img>` | ❌ | only if you write `width`/`height` |
| `<Image>` with jpg/png | ✅ (Vercel does it automatically) | ✅ automatically |
| `<Image>` with SVG | ❌ skipped on purpose | ✅ automatically |

### `width` and `height` prevent layout shift

They tell the browser the image's size **before it downloads**, so it reserves a box. Without them, the box is 0×0, and when the image arrives, everything below it jumps down. That jump is **CLS** (Cumulative Layout Shift), and Lighthouse penalizes it.

When you `import` an image, Next reads its size at build time, so `<Image src={importedImage} />` sets both for you.

### SVGs aren't optimized

SVGs are vectors: they scale losslessly and have no pixels to resize. Next skips optimizing them. For SVGs, `<Image>` only saves you writing `width`/`height`.

### Swapping images per screen size

Use a plain `<picture>`. Biome allows `<img>` inside `<picture>`:

```tsx
<picture>
  <source media="(min-width: 1440px)" srcSet={desktop.src} width={desktop.width} height={desktop.height} />
  <img src={mobile.src} width={mobile.width} height={mobile.height} alt="" />
</picture>
```

- **Mobile file as the fallback, `min-width` on the source:** mobile-first. Small screens get the default, and big screens opt in.
- **`<source>` gets its own `width`/`height`** because the desktop file has a different size.
- I used `<img>`, not `<Image>`, here because `<Image>`'s dev warning compares the rendered size against *its* attributes, and it doesn't know the `<picture>` swapped in a bigger file. For photos, see `getImageProps()` in the Next docs.

### Loading priority

- `<Image>` is **lazy by default**: it waits until the image is near the viewport. For images visible on first load, that only slows things down. Use `loading="eager"`.
- `preload` (which replaced `priority` in Next 16) also adds a `<link rel="preload">` in `<head>`. Use it for one hero image per page at most.
- **LCP** (Largest Contentful Paint) is when the biggest visible thing finishes rendering. If that's a lazy image, your score suffers.

### Alt text

- Decorative images (dividers, icons inside labelled buttons): `alt=""`, so screen readers skip them.
- Icon-only buttons: put the label on the button: `<button aria-label="Get new advice">`.

<details>
<summary><b>Check yourself:</b> Does <code>&lt;picture&gt;</code> optimize images?</summary>

No. It's plain HTML. The browser picks one file based on `media` and downloads it as-is. Optimization only happens through `<Image>` / `getImageProps()`, and never for SVGs.
</details>

---

## 7. Fonts

```tsx
// app/layout.tsx
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
<html className={manrope.variable}>
```

`next/font` downloads the font at build time, serves it from your own domain, and adds a size-matched fallback so text doesn't jump when the font loads (CLS again). `variable` exposes it as a CSS variable.

Then make it the default in Tailwind:

```css
@theme inline {
  --font-sans: var(--font-manrope);
}
```

Tailwind's base styles use `--font-sans` for the whole page, so every element gets Manrope without a class.

**Don't** write `--font-manrope: var(--font-manrope)`. That points the variable at itself. It only "worked" for me because next/font's rule happened to win the CSS cascade.

**"Preloaded but not used" warning:** Next preloads the font. If the first thing on screen (like a loading message) doesn't use it, the browser says the preload was wasted. Making it the default font fixes that.

---

## 8. Tailwind v4 notes

| You want to reuse… | Use |
|---|---|
| nothing (used once) | inline classes |
| a design **value** (color, shadow, radius, breakpoint) | a token in `@theme` → e.g. `shadow-card`, `desktop:` |
| a piece of **markup** | a React component |
| a CSS property Tailwind lacks | `@utility` (e.g. my `no-ligatures`) |

- **`@theme` vs `@theme inline`:** use `inline` when the value references another variable (`var(--dark-blue)`); plain `@theme` for literal values.
- **Custom breakpoint:** `--breakpoint-desktop: 1440px;` gives you `desktop:`. If you also hard-code `1440px` in a `<picture>` `media`, keep them in sync.
- **`hover:` only works on devices that can hover:** v4 wraps it in `@media (hover: hover)`. In DevTools' mobile emulation, hover styles won't show. That's intentional.
- **A typo is silently ignored:** `track-[-0.257px]` instead of `tracking-[...]` just does nothing. The Tailwind CSS IntelliSense editor extension catches these.
- **Box sizing:** `max-w-135` (540px) *includes* padding. With `px-12` (48px a side), the content is 444px, matching the design's divider width.
- **Breakpoints describe the layout, not the mockup.** Frontend Mentor's 1440px is just the mockup width. Switch where your layout needs to change.

---

## 9. Debugging lessons

- **Lighthouse on the dev server is meaningless.** Dev ships unminified code, hot-reload, and React's dev build. I got bad scores in dev and **98** with `next build && next start`.
- **Stale build cache.** Twice, a change to `@theme` didn't show up, even after restarting. The cause was Turbopack's on-disk cache in `.next/dev/cache`. Fix: stop the server, `rm -rf .next`, start again. It's all generated, so deleting it is safe.
- **Check what's actually served.** When CSS "doesn't work", look at the CSS file in DevTools → Network (or `curl` it). If your class isn't in there, the problem is the build, not your code.
- **"This is a bug in Next.js"** errors are usually not bugs in Next.js. Mine was a missing `<body>` in the loading state.
- **Hover a variable to see its type.** If it says `any`, something upstream isn't typed. (Mine was a leftover local function shadowing the imported one.)

---

## 10. Glossary

| Term | Meaning |
|---|---|
| **SSR** (server-side rendering) | Turning components into HTML on the server. |
| **Hydration** | React loading in the browser and attaching event handlers to server-made HTML. |
| **Client boundary** | The `"use client"` file where browser code starts. Everything it imports is client code. |
| **Serializable** | Data that can be sent over the network (strings, numbers, plain objects/arrays). |
| **Static / prerendered** | HTML made once at build time. |
| **Dynamic** | HTML made on each request. |
| **Partial Prerendering (PPR)** | Static shell + dynamic parts streamed into `<Suspense>` holes. |
| **Suspense** | React boundary that shows a fallback until its children's data is ready. |
| **Streaming** | Sending HTML in chunks as it becomes ready instead of all at once. |
| **CLS** | Cumulative Layout Shift: how much content jumps around while loading. |
| **LCP** | Largest Contentful Paint: when the biggest visible element finishes rendering. |
| **CDN** | Servers around the world that serve static files from close to the visitor. |

---

## 11. What I thought vs what's true

| I thought… | Actually… |
|---|---|
| "Next.js always runs on the server, and `use client` makes it static HTML otherwise." | Server Components run on the server; Client Components run on the server **and** the browser. Static vs dynamic is a separate question (section 3). |
| "Without `use client` it's just static HTML from the cloud." | Server Components can be static (built once) **or** dynamic (rendered per request). It depends on the data they use. |
| "I need `export const prerender` like Astro." | Next.js is static by default and goes dynamic automatically when it sees request-time data. `"use cache"` makes data static; `ensureStatic` enforces it. |
| "Static vs server doesn't matter, it's all served from the cloud." | Static HTML comes straight from a CDN, so it's instant. Dynamic HTML waits for a server function and any API it calls. JS bundles are static either way. |
| "`<body>` can go in the page." | It must be in the root layout, because `loading.tsx` replaces the page *inside* the layout. |
| "`h-full` should fill the screen." | Percentage heights need a parent with a fixed `height`. `min-h-*` doesn't count. Use `flex-1` in a flex column instead. |
| "`<picture>` optimizes images." | It only picks a file. Optimization is `<Image>`, and never for SVGs. |
| "My Lighthouse score is terrible." | It was the dev server. Production scored 98. |

---

## Where to go next

Projects that build on this, roughly in order:

1. **Forms and mutations:** Server Actions, validation, error and success states.
2. **Auth and a database:** login, a Postgres database with an ORM, per-user data (which also means real dynamic rendering).
3. **Multiple routes:** shared layouts, `<Link>`, dynamic routes like `app/posts/[id]/page.tsx`.

The official docs bundled with your installed version are in `node_modules/next/dist/docs/`. They match the version you're actually running, which matters because Next.js changes fast.
