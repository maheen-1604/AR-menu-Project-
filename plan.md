# 🏺 Vision Dine — Hackathon Master Plan
**Version:** 1.0 (Hackathon MVP)  
**Vision:** Redefining the Future of Fine Dining through Immersive Augmented Reality.

---

## 🎯 Project Core Vision
*   **Goal:** A premium, web-based AR Menu system designed for high-end dining establishments.
*   **Design System:** "Ultra-Premium Minimalist" — clean lines, generous negative space, and smooth transitions.
*   **Color Palette:**
    *   `Matte Black`: `#0a0a0a` (Primary Surface)
    *   `Dark Metallic Gold`: `#b8860b` (Accents & Primary CTAs)
    *   `Off-White`: `#fafafa` (Typography & Contrast)
*   **Typography:**
    *   **Headers:** Serif (e.g., *Playfair Display*) — for elegance and heritage.
    *   **Body:** Sans-serif (e.g., *Inter*) — for clarity and modern readability.

---

## 🛠 Detailed Tech Stack
*   **Framework:** Next.js 15 (App Router) + TypeScript.
*   **Styling:** Tailwind CSS (Theme-configured for Matte Black/Gold).
*   **Backend & Auth:** Supabase (PostgreSQL for data, Auth for Admin Portal, Storage for 3D/2D assets).
*   **Deployment:** Vercel.
*   **AR Engine:** Google `<model-viewer>` web component (WebXR/QuickLook/SceneViewer).

---

## 📊 Database Schema (Blueprint)

### Table: `restaurants`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (gen_random_uuid()) |
| `owner_id` | UUID | FK to `auth.users` |
| `name` | TEXT | Restaurant name |
| `logo_url` | TEXT | URL to hosted logo (Supabase Storage) |
| `banner_url` | TEXT | URL to hosted banner image |
| `theme_color` | TEXT | Default: `#b8860b` |

### Table: `dishes`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `restaurant_id` | UUID | FK to `restaurants.id` |
| `name` | TEXT | Dish title |
| `price` | NUMERIC | Price (2 decimal places) |
| `description` | TEXT | Short culinary description |
| `category` | TEXT | Starter, Main, Dessert, Drink, etc. |
| `image_2d_url` | TEXT | Menu thumbnail |
| `model_3d_url` | TEXT | URL to .glb (Android) / .usdz (iOS) |
| `scale_factor` | FLOAT | Default: 1.0 (AR scaling calibration) |

---

## 🚀 Feature Roadmap (MVP Scope)

### Phase 1: Admin Dashboard
*   **Secure Access:** Premium login flow via Supabase Auth.
*   **Restaurant Profile:** Create/Edit restaurant identity (Logo/Banner).
*   **Menu Management:** Full CRUD for dishes including asset uploads.
*   **QR Automation:** Auto-generate dynamic QR codes linked to the `/dish/[id]` public route.

### Phase 2: User AR Experience
*   **Dynamic Routing:** `/dish/[id]` handles data fetching for specific menu items.
*   **Mobile-First UI:** Responsive, immersive interface for smartphone browsers.
*   **AR Entry:** One-tap "View in AR" button using `<model-viewer>`.

### Phase 3: The "Wow" Shutter Logic
*   **Scene Capture:** Logic to trigger `<model-viewer>.toBlob()` or screenshot.
*   **Watermarking:** Canvas-based overlay applying the restaurant logo (30% opacity) at top-center.
*   **Device Save:** Direct download/save functionality for the captured AR moment.

### Phase 4: Viral Loop
*   **Instagram Integration:** "Share to Instagram Story" button.
*   **API Usage:** Implementation of the **Web Share API** (`navigator.share`) for native OS sharing.

---

## 👥 Role-Specific Integration Logic

*   **Lead (Usaid):**
    *   Orchestrates code logic and AI prompt engineering.
    *   Final code review and feature integration.
*   **Backend (Maheen):**
    *   Manages Supabase schema, RLS policies, and asset storage buckets (`models`, `images`).
    *   Handles database connectivity and API route efficiency.
*   **QA / Pitch (Armeen):**
    *   Owns Vercel deployment and CI/CD monitoring.
    *   Cross-device testing (iOS/Android AR compatibility).
    *   Crafts the narrative and visual presentation for the final demo.

---

## ⏱ The "5-Hour Sprint" Timeline

| Time | Goal | Action Items |
| :--- | :--- | :--- |
| **Hour 1** | **Scaffolding & DB** | Next.js init, Tailwind setup, Supabase Schema, Auth config. |
| **Hour 1.5** | **Transition** | Shift to Cursor IDE, GitHub repository push, Environment variables sync. |
| **Hour 2-3** | **Core AR & Shutter** | Implement `<model-viewer>`, AR capture logic, Watermark canvas, Web Share API. |
| **Hour 4** | **Testing & Deck** | Bug squashing, Vercel prod deployment, Pitch deck finalization. |
| **Hour 5** | **Live Rehearsal** | Final demo walkthrough, performance optimization, Live Pitch. |

---

## 🛡 Security & Constraints
*   **RLS (Row Level Security):** Enabled on all tables. Users only see/edit their own restaurant.
*   **Public Access:** Public read-only access for `dishes` to enable customer viewing.
*   **Asset Support:** Must support both `.glb` (Universal) and `.usdz` (iOS QuickLook).
