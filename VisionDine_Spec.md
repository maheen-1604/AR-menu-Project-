# Vision Dine — Full App Specification
**Tagline:** Redefining the Future of Fine Dining

---

## Brand & Design Tokens

| Token | Value |
|---|---|
| Primary Background (Admin) | `#FAFAFA` |
| Primary Background (User) | `#FAF8F4` (warm beige) |
| Primary Text | `#0D0D0D` |
| Accent / Gold | `#B8960C` |
| Muted Text | `#888888` |
| Card Background | `#FFFFFF` |
| Font — Headings | Elegant serif (e.g. Playfair Display) |
| Font — Body | Clean sans-serif (e.g. DM Sans) |

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Auth & Database:** Supabase
- **AR Viewer:** `<model-viewer>` web component (WebXR, no app install needed)
- **QR Generation:** `qrcode` npm package
- **Styling:** Tailwind CSS
- **File Storage:** Supabase Storage (images, .glb, .usdz files)

---

## Page Navigation Map

```
ADMIN FLOW (Desktop/Web):
Login Page
  └──> Add Restaurant Page
          └──> Restaurant List Page
                    └──> Add New Dish Page
                              └──> Dish List Page

USER FLOW (Mobile Browser via QR Scan):
Dish Info Page
  └──> AR Loading Page
            └──> AR Viewer Page
```

---

## ADMIN PAGES

---

### Page 1: Login Page
**Route:** `/login`
**Layout:** Desktop + Mobile responsive

**UI Elements:**
- Light white background `#FAFAFA`
- Centered card (max-width 420px), soft shadow
- Vision Dine logo at top of card
- Tagline below logo: *"Redefining the future of fine dining"* — small italic grey
- Heading: "Welcome Back"
- Email input field
- Password input field
- "Login" button — full width, dark gold background `#B8960C`, white text
- Powered by Supabase Auth (email/password)

**Navigation:**
- On successful login → redirect to `/restaurants`
- If already logged in → skip to `/restaurants`

---

### Page 2: Add Restaurant Page
**Route:** `/restaurants/new`
**Layout:** Desktop two-column, stacks on mobile

**UI Elements:**
- Light white background `#FAFAFA`
- Top nav bar: Vision Dine logo left, Admin avatar/name right
- Page title: "Create Your Restaurant"
- Left column — Form fields:
  - Restaurant Name (text input, required)
  - Upload Logo (image upload, drag-drop area)
  - Upload Banner (wide image upload, drag-drop area)
- Right column — Live card preview showing how the restaurant card will look with entered data
- "Save & Continue" button — full width, dark gold, white text

**Navigation:**
- On save → redirect to `/restaurants`
- Top nav logo → `/restaurants`

---

### Page 3: Restaurant List Page
**Route:** `/restaurants`
**Layout:** Desktop grid, responsive

**UI Elements:**
- Light white background `#FAFAFA`
- Top nav bar: Vision Dine logo left, page title "Your Restaurants" center, admin avatar right
- "+ Add New Restaurant" button — top right, solid dark gold
- Grid of restaurant cards:
  - 4 columns desktop / 2 columns tablet / 1 column mobile
  - Each card: banner image on top, logo overlaid bottom-left, restaurant name, "Manage Menu" button (gold outline)
- Empty state: "No restaurants yet. Add your first one!" with add button

**Navigation:**
- "+ Add New Restaurant" → `/restaurants/new`
- "Manage Menu" on card → `/restaurants/[id]/dishes`

---

### Page 4: Add New Dish Page
**Route:** `/restaurants/[id]/dishes/new`
**Layout:** Desktop three-column, stacks on mobile

**UI Elements:**
- Light white background `#FFFFFF`
- Top nav bar: Vision Dine logo left, back arrow + "Add New Dish" center, admin avatar right
- **Left column — Form fields:**
  - Dish Name (text input, required)
  - Price (number input with currency symbol, required)
  - Calories (number input)
  - Ingredients / Description (textarea)
  - Upload Dish Image — 2D photo (image upload box)
  - Upload 3D Model — .glb / .usdz (file upload box, clearly labeled)
- **Center column — AR Scale Slider:**
  - Large vertical slider, prominent, impossible to miss
  - Dark gold slider thumb `#B8960C`
  - Top label: "AR Scale"
  - Shows dual value in real time:
    - Scale multiplier: `0.1x` → `2.0x`
    - Physical size: `1cm` → `100cm`
  - Current value displayed below slider in large text
- **Right column — Mobile Preview Panel:**
  - Phone mockup frame
  - Live preview of customer-facing dish page updating as fields are filled
  - Shows dish image, name, price, description, "Place on Your Table" button
- "Generate QR & Save Dish" button — full width, dark gold, white text, bottom of page
- **Mobile layout:** Form → Slider → Phone Preview (stacked, no overlap)

**Navigation:**
- On save → redirect to `/restaurants/[id]/dishes`
- Back arrow → `/restaurants/[id]/dishes`

---

### Page 5: Dish List Page
**Route:** `/restaurants/[id]/dishes`
**Layout:** Desktop grid, responsive

**UI Elements:**
- Light white background `#FAFAFA`
- Top nav bar: Vision Dine logo left, restaurant name center, admin avatar right
- Page title: "Dish Inventory" left
- "+ Add New Dish" button — top right, solid dark gold
- Grid of dish cards:
  - 4 columns desktop / 2 columns tablet / 1 column mobile
  - Each card: dish image on top, dish name, price in gold, "View QR" button
- "View QR" → opens centered modal:
  - Full size QR code
  - Unique shareable URL for the dish
  - "Copy Link" button
  - "Download QR" button
  - Close button (X)
- Empty state: "No dishes yet. Add your first dish!" with add button

**Navigation:**
- "+ Add New Dish" → `/restaurants/[id]/dishes/new`
- Top nav Vision Dine logo → `/restaurants`

---

## USER PAGES
*(Accessed via QR scan in mobile browser — no app install required)*

---

### Page 6: Dish Info Page
**Route:** `/dish/[id]`
**Layout:** Mobile-first, full screen

**UI Elements:**
- Warm beige background `#FAF8F4`
- Large dish image — full width, slightly rounded corners, top of screen
- Dish name — bold elegant serif font, black, large
- Price — large, dark gold `#B8960C`, prominent
- Description — calories and ingredients — soft grey muted text
- ONE big button: **"Place on Your Table"**
  - Full width, dark gold background, white text
  - Large rounded corners
  - Fixed at bottom or prominent below description
- Maximum whitespace — clean, minimal, no navigation bar, no clutter

**Navigation:**
- "Place on Your Table" button → `/dish/[id]/loading`

---

### Page 7: AR Loading Page
**Route:** `/dish/[id]/loading`
**Layout:** Full screen, mobile

**UI Elements:**
- Light beige/white full-screen background `#FAF8F4`
- Vision Dine logo centered on screen
- Subtle soft pulse animation on logo
- Loading text below: *"Preparing your AR experience…"* — muted grey, elegant
- Smooth fade transition into AR viewer once model is ready
- Purpose: keeps user engaged while .glb model and AR session load

**Navigation:**
- Auto-redirects to `/dish/[id]/ar` once model is loaded

---

### Page 8: AR Viewer Page
**Route:** `/dish/[id]/ar`
**Layout:** Full screen, mobile camera view

**UI Elements:**
- Full screen back camera feed via WebXR / `<model-viewer>`
- 3D `.glb` dish model anchored to table surface
- Entrance animation: fast grow + rotate when model first appears
- Faint gold AR placement ring/circle beneath the dish on the table
- **Top area (minimal):**
  - "VISION DINE" — small, top-center, white elegant font
  - Dish name below it — white serif font
- **Bottom area (only 2 elements):**
  - ONE large circular shutter button — center bottom, white or gold outline
    - Tap → captures photo, saves directly to device gallery
    - Hold → records video, saves directly to device gallery
  - Instagram gradient icon — bottom-right corner only (purple→pink→orange)
    - Tap → shares captured media to Instagram Stories with restaurant watermark
- No other buttons, no bars, no labels, no clutter
- Pure immersive AR environment

**Navigation:**
- Back/close → `/dish/[id]`

---

## Full Navigation Flow Summary

```
/login
  └── [login success] ──────────────────> /restaurants
                                              ├── [+ Add New Restaurant] ──> /restaurants/new
                                              │       └── [Save] ──────────> /restaurants
                                              │
                                              └── [Manage Menu] ──────────> /restaurants/[id]/dishes
                                                      ├── [+ Add New Dish] > /restaurants/[id]/dishes/new
                                                      │       └── [Save] ──> /restaurants/[id]/dishes
                                                      │
                                                      └── [View QR] ──────> Modal (QR code + URL)


/dish/[id]                    ← User scans QR, lands here
  └── [Place on Your Table] ─> /dish/[id]/loading
                                    └── [auto] ──> /dish/[id]/ar
```

---

## Key Rules

- No sidebars anywhere
- No analytics panels
- No dark backgrounds (admin is light white, user is warm beige)
- No complex charts or tables
- Everything mobile-responsive — nothing overlaps on small screens
- AR Scale Slider must be large and prominent on Add Dish page
- All text in English only throughout the entire app
- User flow requires zero app installation — works entirely in mobile browser
