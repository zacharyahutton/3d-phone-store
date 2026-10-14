# 3d-phone-store

A product page for a fictional phone, the Titan 17 Pro, where the phone is a real-time 3D model you can spin, recolour and configure, with scroll-driven camera moves between sections and a demo checkout.

I made it to see how far a single product page could go with WebGL in a normal Next.js app: loading GLB models, animating them on scroll, and keeping the UI state (colour, size, storage, saved builds) in sync with the 3D scene without hurting performance.

## Features

- Two GLB phone models rendered with React Three Fiber, with drag to rotate via `PresentationControls`
- Scroll-linked animation between sections with GSAP ScrollTrigger and Lenis smooth scrolling
- Live frame colour changes applied to specific materials of the model
- Storage and size options shared between the UI and the 3D scene through a Zustand store
- Saved builds and a simple profile kept in `localStorage`
- Demo checkout flow with shipping options (no real payments)
- Animated shader background and loading screen

## Stack

Next.js 16 (App Router), React 19, TypeScript, Three.js, React Three Fiber, drei, postprocessing, GSAP, Framer Motion, Zustand, Tailwind CSS 4, Radix UI.

## How it works

- `components/Experience.jsx` loads `phone.glb` and `phone_2.glb`, collects the materials that can be recoloured, and updates them whenever the store's `frameColor` changes. It also ties model position and rotation to ScrollTrigger timelines.
- `store.js` holds the configurator state (colour, scale, storage). `components/store.js` holds scroll progress.
- `app/page.tsx` is the page itself: sections, configurator panels, saved builds, profile and the checkout overlay.
- `ui/` contains the loading screen, floating nav, feature callouts and the scroll synchroniser that keeps sections and the 3D scene lined up.

## Setup

```bash
git clone https://github.com/zacharyahutton/3d-phone-store.git
cd 3d-phone-store
npm install
npm run dev
```

Then open http://localhost:3000.

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Project structure

```
app/          layout, global styles, main page
components/   3D experience, phone, visual effects, shadcn/ui primitives
ui/           loading screen, nav, callouts, scroll sync
public/       GLB models, textures, images
store.js      configurator state (Zustand)
```

## Roadmap

- Split `app/page.tsx` into smaller section components
- Lazy load the second model and compress GLBs with Draco
- Lower quality mode for low-end phones
- Lighthouse and frame-time measurements in this README
