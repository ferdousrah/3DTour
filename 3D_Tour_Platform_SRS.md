# Software Requirements Specification
## Interactive 3D Virtual Tour Platform

A CMS-driven web platform for creating, managing, and sharing interactive 3D walkthroughs of interior design projects.

| | |
|---|---|
| **Document Version** | 1.0 |
| **Status** | Draft for Development |
| **Prepared By** | Technocrats Digital |
| **Primary Stack** | Laravel 11 · MySQL 8 · React · Three.js |
| **Intended Audience** | Development team, stakeholders, QA |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Functional Requirements](#3-functional-requirements)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [System Architecture](#6-system-architecture)
7. [Data Model](#7-data-model)
8. [API Specifications](#8-api-specifications)
9. [UI/UX Specifications](#9-uiux-specifications)
10. [Development Phases](#10-development-phases)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Appendices](#12-appendices)

---

# 1. Introduction

## 1.1 Purpose

This Software Requirements Specification (SRS) defines the functional and non-functional requirements for the Interactive 3D Virtual Tour Platform — a web-based system that enables design agencies, interior firms, real estate developers, and architectural studios to publish immersive 3D walkthroughs of their projects to end clients via shareable public links.

The document is written to be implementation-ready and may be used directly as input to AI-assisted development workflows including Claude Code.

## 1.2 Scope

**In scope:**
- Admin panel for uploading 3D models (glTF/GLB), placing navigation waypoints and content hotspots visually inside a 3D editor, and managing per-project content.
- Public viewer that loads a tour from a unique shareable URL and allows end users to navigate the 3D scene on desktop and mobile.
- Sharing and visibility controls: public, unlisted, private; password protection; tour expiry; social media preview metadata.
- Analytics capturing anonymous engagement data (views, session duration, per-waypoint visits).
- Embeddable iframe support for integration into third-party websites.

**Out of scope for v1:**
- 3D model authoring tools — models created in external software (Blender, SketchUp, 3ds Max) and uploaded as glTF/GLB.
- Automatic model optimization, re-topology, or texture baking.
- VR/WebXR headset support (planned for later phase).
- Multi-user live collaborative tours.
- E-commerce checkout — hotspot prices are display-only in v1.

## 1.3 Definitions and Abbreviations

| Term | Definition |
|---|---|
| **Tour** | A published 3D project consisting of a 3D model, waypoints, and hotspots. |
| **Waypoint** | A named point in 3D space the camera can teleport to. Used for navigation. |
| **Hotspot** | A point in 3D space attached to an object or location, linked to descriptive content. |
| **glTF / GLB** | GL Transmission Format — an open standard for 3D scenes; GLB is the binary single-file variant. |
| **Admin** | A back-office user authenticated via the admin panel who creates and manages tours. |
| **Viewer** | A typically unauthenticated end-user consuming a tour via its shareable URL. |
| **Raycasting** | Projecting a ray from the camera through a screen point into the scene to detect the hit object; used for placing waypoints and hotspots by clicking. |
| **Slug** | A short URL-safe string identifying a tour publicly (e.g. `a7f3k9x2`). |
| **R3F** | React Three Fiber — the React renderer for Three.js. |
| **RBAC** | Role-Based Access Control. |

## 1.4 References

- IEEE Std 830-1998, Recommended Practice for Software Requirements Specifications
- Khronos Group — glTF 2.0 Specification
- Three.js Documentation — https://threejs.org/docs/
- React Three Fiber Documentation — https://r3f.docs.pmnd.rs/
- Laravel 11 Documentation — https://laravel.com/docs/11.x
- Inertia.js Documentation — https://inertiajs.com/
- OWASP Top 10 — Web Application Security Risks
- RFC 2119 — Key words for use in RFCs

## 1.5 Document Conventions

Requirements use the following identifier scheme:
- `FR-XXX` — Functional Requirement
- `NFR-XXX` — Non-Functional Requirement
- `UC-XXX` — Use Case
- `API-XXX` — API Endpoint

The keywords MUST, SHALL, SHOULD, MAY, and WILL carry their RFC 2119 meanings.

---

# 2. Overall Description

## 2.1 Product Perspective

The Interactive 3D Virtual Tour Platform is a greenfield product delivered as a web application with a public-facing viewer and a protected admin panel. It integrates with S3-compatible object storage for 3D models and media, and uses MySQL for structured tour data.

Initial deployment targets a self-managed Ubuntu VPS using Docker and Coolify, consistent with existing Technocrats Digital infrastructure.

## 2.2 Product Features (Summary)

- **Authentication and role management** — admins sign in to the CMS; RBAC controls capabilities.
- **Tour CRUD** — create, read, update, delete tours with metadata.
- **3D model upload and validation** — upload glTF/GLB with size, format, and integrity checks.
- **In-browser 3D editor** — visually place waypoints and hotspots by clicking on the rendered model.
- **Waypoint and hotspot management** — add, edit, reorder, reposition, delete points.
- **Rich content per hotspot** — title, description, image gallery, optional BDT price, optional external link.
- **Public tour viewer** — responsive 3D viewer with waypoint navigation and hotspot interaction.
- **Shareable URLs** — short slug-based links, custom slugs, OG metadata, QR codes.
- **Access control** — visibility levels, password protection, expiry, domain-restricted embedding.
- **Analytics** — views, session duration, waypoint frequency, device and referrer breakdown.
- **Embed support** — iframe embedding with branding toggle.

## 2.3 User Classes

| User Class | Authenticated | Description | Frequency |
|---|---|---|---|
| **Admin** | Yes | Platform owner. Manages users, tours, branding, and system settings. | Daily |
| **Editor** | Yes | Authenticated user — creates and edits tours but cannot manage users. | Daily / weekly |
| **Client (optional)** | Optional | A client granted view-only access to private tours via invite. | Occasional |
| **Public Viewer** | No | Anonymous end-user accessing a tour via a public or unlisted link. | Primary audience |

## 2.4 Operating Environment

### 2.4.1 Server Environment
- Ubuntu Server 22.04 LTS or later
- Docker Engine 24+ with Docker Compose
- Coolify for container orchestration
- Traefik for reverse proxy and TLS termination
- PHP 8.3 with FPM
- MySQL 8.0+
- Redis 7+ for cache, sessions, queues
- Node.js 20 LTS for the frontend build pipeline
- S3-compatible object storage (S3, R2, MinIO, or Spaces)

### 2.4.2 Client Environment (Admin)
- Chrome 110+, Firefox 110+, Edge 110+, Safari 16+
- Minimum screen 1366 × 768; recommended 1920 × 1080
- Hardware-accelerated WebGL 2.0
- Minimum 8 GB RAM; integrated or discrete GPU

### 2.4.3 Client Environment (Public Viewer)
- Desktop/mobile browsers on Android 10+, iOS 14+, Windows 10+, macOS 11+
- Current release and one version back for Chrome, Safari, Firefox, Edge
- WebGL 2.0 required; static fallback image for unsupported browsers
- Minimum 2 GB device RAM recommended

## 2.5 Design and Implementation Constraints

- **Fixed stack**: Laravel 11, PHP 8.3, MySQL 8, React 18, TypeScript, Inertia.js, Three.js (r160+), React Three Fiber.
- **Model format**: glTF 2.0 — `.glb` preferred; `.gltf` + assets also accepted.
- **Max model size**: 100 MB per upload in v1.
- **Browser floor**: WebGL 2.0 required.
- **Bandwidth**: viewer must degrade gracefully on ≤3 Mbps or low-end mobile. Primary audience is Bangladesh.
- **Localization**: English UI in v1; all strings externalized for later Bengali translation.
- **Currency**: BDT (Bangladeshi Taka) default; multi-currency planned for later phase.
- **Data residency**: DB and primary storage in the same region for latency.

## 2.6 Assumptions and Dependencies

- Clients supply their own optimized glTF/GLB models; platform performs no mesh simplification or texture compression in v1.
- End users have a connection sufficient to download the 3D model (5–50 MB typical).
- SMTP service available for transactional email.
- A CDN (Cloudflare or similar) sits in front of S3 for asset delivery.
- Domain names and TLS certificates managed via Coolify + Let's Encrypt.

---

# 3. Functional Requirements

## 3.1 Authentication and Authorization

### FR-001 — Admin login
The system SHALL provide a login page where admin users authenticate using email and password.

**Acceptance criteria:**
- Valid credentials grant access to the admin dashboard and set a session cookie.
- Invalid credentials return a generic error (never distinguishing wrong email vs wrong password).
- Five consecutive failed attempts within 10 minutes from the same IP trigger a 15-minute lockout.
- Passwords hashed using bcrypt with cost factor ≥ 12.
- Session expires after 120 minutes of inactivity or on explicit logout.

### FR-002 — Password reset
Users SHALL be able to request a password reset via email.

**Acceptance criteria:**
- Reset email sent regardless of whether the address exists (prevents enumeration).
- Reset token is single-use and expires after 60 minutes.
- New password must be ≥ 10 chars, mixed case, digit, symbol.

### FR-003 — Role-Based Access Control

| Role | Capabilities |
|---|---|
| **Admin** | Full access; manage users, system settings, branding; create/edit/delete/publish tours; view analytics. |
| **Editor** | Create and edit tours; cannot manage users or delete tours. |
| **Viewer (authed)** | View tours; grantable to clients for private tour access. |

- Every protected route and API endpoint verifies role and returns HTTP 403 on failure.
- Each user holds a single role, stored as a column on `users`.

### FR-004 — User invitation
Admins SHALL invite new users via email.

- Invitation specifies email + role.
- Invitee receives single-use link (72-hour expiry) to set password and join.
- Pending invitations visible in the user list, revocable and resendable.

## 3.2 Tour Management

### FR-010 — Create tour
- Form captures name (required), description, client name, project date, thumbnail.
- Auto-generated `public_slug` (8 chars, lowercase alphanumeric) assigned on creation.
- New tour starts as `visibility='private'`, `status='draft'`.
- User is redirected to the tour's 3D editor view.

### FR-011 — List tours
- Paginated list (25/page) showing: thumbnail, name, client, status, visibility, last modified, view count, actions.
- Filters: status, visibility, client.
- Full-text search across name, description, client name.
- Sort: name, last modified, view count, created date.

### FR-012 — Edit tour metadata
- Editable fields: name, description, client name, thumbnail, OG metadata.
- Slug changes require confirmation; old slug preserved as redirect for 30 days.
- Audit log entry per change.

### FR-013 — Delete tour
- Soft-delete: marked `deleted_at`, hidden from UI for 30 days, then purged.
- Requires typing tour name to confirm.
- Associated waypoints, hotspots, media soft-deleted in same transaction.
- Public URL returns 404 immediately.

### FR-014 — Duplicate tour
- Copies waypoints, hotspots, content. Does NOT copy analytics or views.
- New `public_slug`; name suffixed " (Copy)".
- Starts as `status='draft'`, `visibility='private'`.
- Media referenced (not cloned).

### FR-015 — Publish / unpublish
- Publish requires: valid 3D model, ≥ 1 waypoint, non-empty name.
- Unpublished tours return 404 on public URL.
- `published_at` timestamp recorded.

## 3.3 3D Model Upload

### FR-020 — Upload 3D model
- Accepted: `.glb` (preferred), `.gltf` + assets as `.zip`.
- Max size: 100 MB.
- Resumable upload (tus protocol or chunked) for files > 10 MB.
- Server-side validation: parseable JSON for gltf, valid GLB header, no external URL references.
- Storage: `tours/{tour_id}/models/{uuid}.glb`
- Upload progress shown as percentage.
- On success, model auto-loads into editor.

### FR-021 — Replace 3D model
- Confirmation warning (waypoint/hotspot positions may break).
- Previous model retained 30 days in versioned path for recovery.
- Admin prompted to review waypoint/hotspot positions after replacement.

### FR-022 — Model metadata extraction
On upload, extract and store:
- File size in bytes
- Triangle count (approximate)
- Bounding box `{min_x, min_y, min_z, max_x, max_y, max_z}`
- Counts: materials, textures, meshes, nodes
- glTF version

## 3.4 3D Editor (Admin)

### FR-030 — Scene rendering
- Renders uploaded glTF in an interactive 3D scene.
- Load progress indicator if > 5 MB.
- Camera auto-framed to model bounding box.
- Ambient lighting applied if model has no lights.
- Orbit controls: drag rotate, scroll zoom, right-drag pan.
- "Reset view" button returns to default.

### FR-031 — Editor modes

| Mode | Behavior |
|---|---|
| **View** | Orbit camera only; clicking scene has no effect. |
| **Add waypoint** | Click on floor/walkable surface to place waypoint. |
| **Add hotspot** | Click on any surface to place hotspot and open content form. |
| **Edit** | Click existing points to select; drag to reposition. |

### FR-032 — Waypoint placement (raycasting)
- Raycaster identifies clicked mesh and 3D point.
- Waypoint Y-coordinate offset by +1.6 m above clicked floor (eye height).
- Default label "Waypoint N"; rename inline.
- Rendered as glowing floor disk, visible through walls.

### FR-033 — Hotspot placement
- Position = exact raycast intersection (no Y offset).
- Content form: title, description, type (info/product/link), optional price, optional URL, media uploads.
- Cancel discards position.
- Rendered as numbered billboard pin (faces camera).

### FR-034 — Edit and reposition
- Click waypoint → selects, shows label/order/rotation panel.
- Click hotspot → opens full content form.
- Drag waypoint → moves along floor plane (Y-locked).
- Drag hotspot → moves freely along placement surface.
- Delete key or trash icon removes selected point after confirmation.

### FR-035 — Sidebar list
- Waypoints listed in display order; drag-and-drop reorders.
- Hotspots listed below, sortable by name or creation date.
- Click item → selects in scene, animates camera to frame it.
- Edit/delete icons on hover.

### FR-036 — Default camera
- "Set as default view" button captures current orbit position + target.
- Default view used as initial camera when public viewer loads.

### FR-037 — Autosave
- Position/content changes save to backend within 2s of edit.
- Indicator shows "Saving…" and "Saved" states.
- Failed saves retry up to 3× with exponential backoff; then prompt user.

## 3.5 Waypoint Management

### FR-040 — Waypoint properties

| Field | Type | Notes |
|---|---|---|
| `id` | bigint | Primary key |
| `tour_id` | bigint | Foreign key to `tours` |
| `label` | varchar(120) | Display name, e.g. "Living Room" |
| `position` | JSON | `{x, y, z}` camera world position |
| `look_at` | JSON | `{x, y, z}` camera target point |
| `display_order` | int | Order in navigation list |
| `transition_ms` | int | Camera transition duration (default 1200) |
| `thumbnail_url` | varchar(500) | Optional mini-map image |
| `created_at` / `updated_at` | timestamp | Audit timestamps |

### FR-041 — Waypoint navigation (viewer)
- Waypoints render as glowing floor circles, scaled by camera distance.
- Click/tap triggers camera tween: ease-in-out over `transition_ms`.
- During transition, UI is locked (no click-through).
- Sidebar/bottom-sheet shows ordered waypoint list.
- Keyboard: `ArrowRight` / `ArrowLeft` → next/previous waypoint.

## 3.6 Hotspot Management

### FR-050 — Hotspot properties

| Field | Type | Notes |
|---|---|---|
| `id` | bigint | Primary key |
| `tour_id` | bigint | Foreign key |
| `title` | varchar(200) | Hotspot title |
| `description` | text | Rich HTML (sanitized) |
| `position` | JSON | `{x, y, z}` world position |
| `normal` | JSON | `{x, y, z}` surface normal for pin orientation |
| `type` | enum | `info` \| `product` \| `link` |
| `price_bdt` | decimal(12,2) | Nullable; used when `type='product'` |
| `external_url` | varchar(500) | Nullable; used when `type='link'` |
| `icon` | varchar(50) | Icon identifier (info/cart/link/star) |
| `color` | varchar(7) | Hex pin color `#RRGGBB` |
| `display_order` | int | Listing order |
| `is_visible` | boolean | Draft toggle — hidden hotspots skipped in viewer |

### FR-051 — Hotspot media (table `hotspot_media`)

| Field | Type | Notes |
|---|---|---|
| `id` | bigint | Primary key |
| `hotspot_id` | bigint | Foreign key |
| `file_url` | varchar(500) | S3 URL |
| `mime_type` | varchar(50) | jpeg/png/webp |
| `alt_text` | varchar(255) | Accessibility text |
| `caption` | varchar(500) | Optional caption |
| `display_order` | int | Gallery order |

### FR-052 — Hotspot interaction (viewer)
- Pins billboarded (face camera); configurable opacity through occluded geometry.
- Click/tap opens side panel (desktop) or bottom sheet (mobile) with content.
- Panel shows: title, swipeable image gallery, description, optional price, optional "Visit link" button.
- Click outside or `Esc` closes.
- URL hash updates to `#h/{hotspot_id}` for shareable deep links.

## 3.7 Content Management

### FR-060 — Media library
- Library supporting JPG/PNG/WebP/GIF up to 10 MB per file.
- Stored in S3, served via CDN.
- Thumbnails (200×200, 400×400, 800×800) generated async via queued job.
- Reusable across hotspots/tours.
- Deletion blocked if referenced by any hotspot.

### FR-061 — Rich-text descriptions
- Editor supports: bold, italic, underline, unordered list, ordered list, link.
- Pasted HTML sanitized server-side (HTMLPurifier or equivalent).
- Rendered output sanitized again at display time (DOMPurify).

## 3.8 Public Viewer

### FR-070 — Tour load
- URL pattern: `/t/{slug}` or `/t/{custom_slug}`.
- Resolution: try `public_slug` first, then `custom_slug`.
- Not found → 404 with branded page.
- Expired → 410 with "expired" message.
- Private → 404 (do not reveal existence).
- Password-protected → password prompt page first.

### FR-071 — Loading experience
- Branded splash with thumbnail + progress bar during model download.
- Progress reflects actual bytes downloaded.
- "Start Tour" button revealed when loading completes and first frame rendered.
- On failure → retry button and support link.

### FR-072 — Camera controls
- Desktop: orbit (drag rotate, scroll zoom).
- Mobile: touch drag orbit, pinch zoom, two-finger drag pan.
- Optional first-person mode (WASD + mouse look) behind a toggle.
- "Fullscreen" button uses browser Fullscreen API.

### FR-073 — Viewer UI elements

| Element | Description |
|---|---|
| **Waypoint list** | Left side (desktop), bottom sheet (mobile). Ordered waypoints with thumbnails. |
| **Hotspot pins** | Always rendered in the 3D scene. |
| **Mini-map (optional)** | Top-right overlay; floor plan with camera indicator. |
| **Info panel** | Opens when a hotspot is clicked. |
| **Fullscreen toggle** | Top-right. |
| **Share button** | Top-right; menu with copy link, WhatsApp, Facebook, email, QR. |
| **Branding bar** | Bottom; shows tour name, company logo, "Powered by Technocrats" (hidden in embed). |

### FR-074 — Responsive design
- Mobile (≤ 768px): bottom-sheet UI, touch-optimized controls, compact top bar.
- Tablet (769–1024px): compact sidebar + bottom sheet hybrid.
- Desktop (> 1024px): full sidebar + side panel.
- Respects iOS safe areas (notch, home indicator).

### FR-075 — Accessibility (WCAG 2.1 AA where feasible)
- Tab cycles focusable elements; Enter activates; Esc closes panels.
- Text contrast ≥ 4.5:1.
- All images have alt text.
- Screen-reader announcements on waypoint arrival: "Now viewing: Living Room."
- Respects `prefers-reduced-motion` — camera tweens become instant jumps.

## 3.9 Shareable Links

### FR-080 — Public slug
- Auto-generated, 8 lowercase alphanumeric chars (`a-z0-9`).
- Collision-checked against `tours` table.
- Immutable except via deliberate admin action; old slug 301-redirects for 30 days.

### FR-081 — Custom slug
- Pattern: `[a-z0-9-]{3,120}`; must not match reserved words (`admin`, `api`, `t`, `login`, etc.).
- Uniqueness enforced globally (shared public path).
- Change preserves previous slug as redirect for 30 days.

### FR-082 — Share menu (admin)
- Copy-to-clipboard for public URL.
- WhatsApp (wa.me prefilled), Facebook (fb.com/sharer), Email (mailto:).
- QR code generation — downloadable as PNG and SVG.
- Embed code snippet with copy button.

### FR-083 — Social preview metadata
- Meta tags: `og:title`, `og:description`, `og:image` (1200×630), `og:url`, `og:type=website`, `twitter:card=summary_large_image`.
- `og:image` defaults to tour thumbnail; admin may upload custom social image.
- `og:title` defaults to tour name; admin may override.

## 3.10 Visibility and Access Control

### FR-090 — Visibility levels

| Level | Behavior |
|---|---|
| `private` | Public URL returns 404. Only authenticated users may view. |
| `unlisted` | Anyone with the link may view. `robots` meta `noindex`. Default after upload. |
| `public` | Anyone may view; listed in the public gallery; indexed by search engines. |

### FR-091 — Password protection
- Optional password in tour settings.
- Stored hashed with bcrypt (cost ≥ 10).
- Public URL first displays password prompt if set.
- Correct password → session flag `tour_unlocked_{id}=true` with 24-hour lifetime.
- Rate limit: 5 failed attempts per IP per hour triggers 1-hour cooldown.

### FR-092 — Expiry
- Optional `expires_at` timestamp (datetime picker in UTC, local-tz display).
- After expiry, public URL returns 410 "expired" page.
- "Expired" badge on tour list.
- Admin may clear expiry to restore access.

### FR-093 — Embed domain allow-list
- Default: embedding allowed from any domain.
- Optional allowed-domains list (wildcard, e.g. `*.interiorvillabd.com`).
- Enforced via `Content-Security-Policy: frame-ancestors` header.

## 3.11 Analytics

### FR-100 — Event logging
- Writes to `tour_views` table.
- Fields: `tour_id`, `ip_hash` (SHA-256 of IP + secret salt), `user_agent`, `referrer`, `country` (GeoIP), `device_type`, `viewed_at`, `session_duration_seconds` (on unload), `waypoints_visited` (JSON array in order).
- Session ID: client-generated UUID grouping events within a session.
- No cookies used (cookieless).

### FR-101 — Dashboard
- Per-tour dashboard visible to authenticated users.
- Overview cards: total views, unique visitors, avg session duration, engagement rate.
- Time-series (views per day).
- Top 10 referrers.
- Device pie chart.
- Top 10 countries + map.
- Waypoint heatmap (visits and dwell time).
- Date presets: 7d, 30d, 90d, All time + custom range.

### FR-102 — Export
- CSV export for selected range.
- Ranges > 30 days generated async; admin receives email with download link.

## 3.12 Embedding

### FR-110 — Iframe embed
- Query param `?embed=1` activates embed mode.
- Embed mode hides: share bar, branding footer, external share buttons.
- Embed snippet includes `width=100% height=600 allowfullscreen`.
- `X-Frame-Options` omitted for public/unlisted; `CSP frame-ancestors` handles restriction.

### FR-111 — PostMessage API
- Viewer emits on waypoint change: `{ type: 'waypoint', id, label }`.
- Viewer emits on hotspot open: `{ type: 'hotspot', id, title }`.
- Host may send `{ action: 'goto_waypoint', id }` to trigger navigation.
- All messages include origin validation.

## 3.13 Application Settings

### FR-120 — Branding and global settings
- Configurable: company name, logo, favicon, primary brand color, support email, default tour visibility.
- Logo displayed in public viewer branding bar.
- Primary color applied to buttons and accents in both admin and viewer.
- Stored as a single `settings` row (or key-value table) editable by Admin only.

---

# 4. External Interface Requirements

## 4.1 User Interfaces
- **Admin Dashboard** — authenticated, desktop-first responsive; Inertia.js + React + Tailwind CSS.
- **3D Editor** — integrated route in admin dashboard; R3F canvas with side panels.
- **Public Viewer** — unauthenticated, mobile-first responsive; R3F canvas with overlay UI.

Detailed UI specs in §9.

## 4.2 Hardware Interfaces
No direct hardware integration. GPU via WebGL 2.0 provided by the browser.

## 4.3 Software Interfaces

| Interface | Purpose | Protocol / Format |
|---|---|---|
| MySQL 8.0 | Primary datastore | TCP/IP over SSL; MySQL wire protocol |
| Redis 7 | Cache, sessions, queue | TCP/IP; RESP |
| S3-compatible | Model and media files | HTTPS; S3 API |
| SMTP provider | Transactional email | SMTP or HTTPS API (SendGrid/Postmark/Mailgun) |
| GeoIP | Country detection | MaxMind GeoLite2 local DB (preferred) or HTTPS API |
| CDN | Asset delivery | HTTPS |

## 4.4 Communication Interfaces
- All external communication over HTTPS (TLS 1.2+).
- Internal comms on private network; TLS recommended for cloud deployments.
- Future webhooks sign requests with HMAC-SHA256.
- Future WebSocket connections: `wss://` with token auth.

---

# 5. Non-Functional Requirements

## 5.1 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-001 | Admin page TTI | ≤ 2.5s on broadband |
| NFR-002 | Public viewer initial render (model excluded) | ≤ 2.0s |
| NFR-003 | 3D model load (20 MB, 20 Mbps) | ≤ 10s |
| NFR-004 | Waypoint camera transition FPS | ≥ 30 on mid-range mobile |
| NFR-005 | API p95 response | ≤ 300ms |
| NFR-006 | API p99 response | ≤ 800ms |
| NFR-007 | Upload throughput (100 MB, 10 Mbps) | ≤ 120s |
| NFR-008 | Concurrent public viewers per tour | ≥ 500 |
| NFR-009 | Concurrent admin users | ≥ 20 |

## 5.2 Security
- All traffic over HTTPS; HTTP redirects to HTTPS.
- HSTS `max-age ≥ 31536000` with `includeSubDomains`.
- CSRF protection on all state-changing admin routes (Laravel default).
- XSS prevention via output escaping and CSP header.
- SQL injection prevented via parameterized queries (Eloquent default).
- Password hashing: bcrypt cost ≥ 12.
- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax`.
- Rate limits: 60 req/min per IP on authed endpoints; 30/min on public endpoints.
- File upload: MIME sniffing server-side, size limits, extension whitelist, optional ClamAV virus scan.
- Audit log of privileged actions (user changes, tour deletion, publish).
- Secrets in env vars only; rotated on suspicion of compromise.
- Dependencies scanned weekly (Dependabot); high/critical CVEs patched within 7 days.

## 5.3 Reliability and Availability
- Target uptime 99.5% monthly (~3.6h downtime).
- Maintenance windows announced ≥ 48h in advance.
- Automated health checks with alerting (Uptime Kuma or similar).
- DB backups: daily full + hourly binlog; retained 30 days; monthly restore test.
- Object storage versioning enabled on model and media buckets.
- DR: RTO ≤ 4h, RPO ≤ 1h.

## 5.4 Usability
- Admin tasks (upload + 5 waypoints + publish) completable in ≤ 10 min by a first-time user after 10-min onboarding video.
- Consistent terminology across admin and viewer.
- Inline validation on all forms.
- Destructive actions require confirmation.
- First-use onboarding tour highlights key editor features.
- Contextual help tooltips on complex fields.

## 5.5 Maintainability
- PSR-12 (PHP) and Airbnb React TS style guides, enforced in CI.
- Unit test coverage ≥ 70% on backend domain logic.
- E2E tests cover §11 critical-path scenarios.
- Feature flags during rollout (Laravel Pennant).
- Reversible DB migrations where practical.
- API versioned (`/api/v1/...`); breaking changes bump version.

## 5.6 Scalability
- Stateless app; session state in Redis; horizontally scalable via container replicas.
- Read replica offloading possible in Phase 2.
- File storage scales independently.
- Phase 1 capacity target: 1,000 tours, 100 concurrent admin users, 5,000 concurrent public viewers system-wide.

## 5.7 Compatibility
- Browser support as §2.4.
- Models from Blender, SketchUp, 3ds Max, Revit, Rhino (via glTF exporters) must render correctly; conformance test plan includes reference exports from each.
- Fallback: tours on devices without WebGL 2.0 show a static image + message.

## 5.8 Legal and Compliance
- Privacy policy and ToS on first admin login; linked in viewer footer.
- GDPR-like handling: users may request export and deletion of personal data.
- Analytics cookieless; IPs anonymized via hashing before storage.
- Copyright for uploaded models/media is the operator's responsibility; ToS disclaims platform liability.

---

# 6. System Architecture

## 6.1 High-Level Architecture

```
                    +---------------------+
                    |    CDN (Cloudflare) |
                    +----------+----------+
                               |
    +------------+------+------+------+-------------------+
    |                   |             |                   |
+--------+       +-----------+   +---------+       +-------------+
| Public |       |  Admin    |   |  Admin  |       | S3 Storage  |
| Viewer |       |  Panel    |   |  3D     |       | (models,    |
| (React)|       | (Inertia) |   | Editor  |       |  media)     |
+---+----+       +-----+-----+   +----+----+       +-------------+
    |                  |              |
    +---------+--------+----+---------+
              |             |
         +---------+   +---------+
         |  Nginx  |   | Traefik |
         +----+----+   +----+----+
              |             |
              +------+------+
                     |
            +--------+---------+
            |  Laravel (PHP)   |
            |  • Admin routes  |
            |  • Public routes |
            |  • API routes    |
            |  • Queue workers |
            +---+----------+---+
                |          |
          +-----+---+  +---+-----+
          | MySQL 8 |  | Redis 7 |
          +---------+  +---------+
```

## 6.2 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| OS | Ubuntu Server | 22.04 LTS |
| Container runtime | Docker | 24+ |
| Orchestration | Coolify | Latest stable |
| Reverse proxy | Traefik (via Coolify) | 3.x |
| Language (backend) | PHP | 8.3 |
| Web framework | Laravel | 11.x |
| Frontend bridge | Inertia.js | 2.x |
| Language (frontend) | TypeScript | 5.x |
| UI framework | React | 18.x |
| Styling | Tailwind CSS | 3.x |
| 3D rendering | Three.js | r160+ |
| React 3D integration | React Three Fiber + drei | Latest |
| Database | MySQL | 8.0+ |
| Cache / queue | Redis | 7+ |
| Object storage | S3-compatible | S3 API 2006-03-01 |
| Build tool | Vite | 5.x |
| Package managers | Composer + pnpm | Latest |
| Testing (backend) | Pest PHP | 2.x |
| Testing (frontend) | Vitest + Playwright | Latest |

## 6.3 Deployment Architecture

Containers managed by Coolify via `docker-compose.yml`:

- `app` — Laravel web app (PHP-FPM + Nginx)
- `worker` — queue worker (thumbnails, analytics aggregation, email)
- `scheduler` — Laravel scheduler for cron (expiry checks, backup cleanup)
- `mysql` — MySQL 8
- `redis` — Redis cache and queue
- `minio` (optional) — self-hosted S3, or use external (R2 / S3)

Secrets managed in Coolify's secret store. Environment variables drive configuration.

## 6.4 Directory Structure

```
interactive-3d-tour/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/
│   │   │   │   ├── TourController.php
│   │   │   │   ├── WaypointController.php
│   │   │   │   ├── HotspotController.php
│   │   │   │   ├── MediaController.php
│   │   │   │   └── AnalyticsController.php
│   │   │   └── Public/
│   │   │       ├── TourViewerController.php
│   │   │       └── TourAnalyticsIngestController.php
│   │   ├── Middleware/
│   │   │   └── CheckTourPassword.php
│   │   └── Requests/
│   ├── Models/
│   │   ├── User.php
│   │   ├── Tour.php
│   │   ├── Waypoint.php
│   │   ├── Hotspot.php
│   │   ├── HotspotMedia.php
│   │   └── TourView.php
│   ├── Services/
│   │   ├── TourService.php
│   │   ├── ModelUploadService.php
│   │   ├── SlugGenerator.php
│   │   ├── AnalyticsService.php
│   │   └── GltfValidator.php
│   ├── Jobs/
│   │   ├── ProcessUploadedModel.php
│   │   ├── GenerateThumbnails.php
│   │   ├── AggregateAnalytics.php
│   │   └── PurgeExpiredTours.php
│   └── Policies/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── resources/
│   ├── js/
│   │   ├── Pages/
│   │   │   ├── Admin/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Tours/Index.tsx
│   │   │   │   ├── Tours/Editor.tsx
│   │   │   │   └── Analytics/Show.tsx
│   │   │   └── Public/
│   │   │       ├── TourViewer.tsx
│   │   │       └── PasswordGate.tsx
│   │   ├── Components/
│   │   │   ├── Editor/
│   │   │   │   ├── Scene.tsx
│   │   │   │   ├── WaypointMarker.tsx
│   │   │   │   ├── HotspotPin.tsx
│   │   │   │   ├── Toolbar.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   └── Viewer/
│   │   │       ├── TourScene.tsx
│   │   │       ├── HotspotPanel.tsx
│   │   │       └── WaypointList.tsx
│   │   └── Lib/
│   │       ├── three-helpers.ts
│   │       ├── raycaster.ts
│   │       └── camera-tween.ts
│   └── views/
├── routes/
│   ├── web.php
│   ├── api.php
│   └── console.php
├── tests/
│   ├── Feature/
│   └── Unit/
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

# 7. Data Model

## 7.1 Entity Relationships

```
users     (1) ──< (many) tours       (via created_by_user_id)
tours     (1) ──< (many) waypoints
tours     (1) ──< (many) hotspots
hotspots  (1) ──< (many) hotspot_media
tours     (1) ──< (many) tour_views  (analytics)
users     (1) ──< (many) media_library (via uploaded_by)
```

## 7.2 MySQL 8 Schema

All tables use `utf8mb4` charset with `utf8mb4_unicode_ci` collation. Timestamps stored in UTC.

### 7.2.1 users

```sql
CREATE TABLE users (
  id                 BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name               VARCHAR(150) NOT NULL,
  email              VARCHAR(255) NOT NULL UNIQUE,
  password           VARCHAR(255) NOT NULL,
  email_verified_at  TIMESTAMP NULL,
  remember_token     VARCHAR(100) NULL,
  role               ENUM('admin','editor','viewer') NOT NULL DEFAULT 'editor',
  created_at         TIMESTAMP NULL,
  updated_at         TIMESTAMP NULL,
  deleted_at         TIMESTAMP NULL,
  INDEX idx_role (role)
) ENGINE=InnoDB;
```

### 7.2.2 tours

```sql
CREATE TABLE tours (
  id                   BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  created_by_user_id   BIGINT UNSIGNED NOT NULL,
  name                 VARCHAR(200) NOT NULL,
  description          TEXT NULL,
  client_name          VARCHAR(150) NULL,
  project_date         DATE NULL,
  thumbnail_url        VARCHAR(500) NULL,
  model_url            VARCHAR(500) NULL,
  model_file_size      BIGINT UNSIGNED NULL,
  model_metadata       JSON NULL,
  default_camera       JSON NULL,

  status               ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  visibility           ENUM('private','unlisted','public') NOT NULL DEFAULT 'private',

  public_slug          VARCHAR(12) NOT NULL UNIQUE,
  custom_slug          VARCHAR(120) NULL UNIQUE,

  password_hash        VARCHAR(255) NULL,
  expires_at           TIMESTAMP NULL,
  allow_embed          BOOLEAN NOT NULL DEFAULT TRUE,
  embed_allowed_hosts  JSON NULL,

  og_title             VARCHAR(200) NULL,
  og_description       TEXT NULL,
  og_image_url         VARCHAR(500) NULL,

  view_count           BIGINT UNSIGNED NOT NULL DEFAULT 0,
  published_at         TIMESTAMP NULL,
  created_at           TIMESTAMP NULL,
  updated_at           TIMESTAMP NULL,
  deleted_at           TIMESTAMP NULL,

  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_public_slug (public_slug),
  INDEX idx_custom_slug (custom_slug),
  INDEX idx_expires (expires_at),
  INDEX idx_deleted (deleted_at),
  FULLTEXT INDEX ft_search (name, description, client_name)
) ENGINE=InnoDB;
```

### 7.2.3 waypoints

```sql
CREATE TABLE waypoints (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tour_id        BIGINT UNSIGNED NOT NULL,
  label          VARCHAR(120) NOT NULL,
  position       JSON NOT NULL,
  look_at        JSON NOT NULL,
  display_order  INT UNSIGNED NOT NULL DEFAULT 0,
  transition_ms  INT UNSIGNED NOT NULL DEFAULT 1200,
  thumbnail_url  VARCHAR(500) NULL,
  created_at     TIMESTAMP NULL,
  updated_at     TIMESTAMP NULL,
  FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  INDEX idx_tour_order (tour_id, display_order)
) ENGINE=InnoDB;
```

### 7.2.4 hotspots

```sql
CREATE TABLE hotspots (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tour_id        BIGINT UNSIGNED NOT NULL,
  title          VARCHAR(200) NOT NULL,
  description    TEXT NULL,
  position       JSON NOT NULL,
  normal         JSON NULL,
  type           ENUM('info','product','link') NOT NULL DEFAULT 'info',
  price_bdt      DECIMAL(12,2) NULL,
  external_url   VARCHAR(500) NULL,
  icon           VARCHAR(50) NOT NULL DEFAULT 'info',
  color          VARCHAR(7) NOT NULL DEFAULT '#2C4F7D',
  display_order  INT UNSIGNED NOT NULL DEFAULT 0,
  is_visible     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP NULL,
  updated_at     TIMESTAMP NULL,
  FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  INDEX idx_tour_visible (tour_id, is_visible)
) ENGINE=InnoDB;
```

### 7.2.5 hotspot_media

```sql
CREATE TABLE hotspot_media (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  hotspot_id     BIGINT UNSIGNED NOT NULL,
  file_url       VARCHAR(500) NOT NULL,
  mime_type      VARCHAR(50) NOT NULL,
  alt_text       VARCHAR(255) NULL,
  caption        VARCHAR(500) NULL,
  display_order  INT UNSIGNED NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NULL,
  updated_at     TIMESTAMP NULL,
  FOREIGN KEY (hotspot_id) REFERENCES hotspots(id) ON DELETE CASCADE,
  INDEX idx_hotspot_order (hotspot_id, display_order)
) ENGINE=InnoDB;
```

### 7.2.6 media_library

```sql
CREATE TABLE media_library (
  id                 BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  uploaded_by        BIGINT UNSIGNED NOT NULL,
  file_name          VARCHAR(255) NOT NULL,
  file_url           VARCHAR(500) NOT NULL,
  mime_type          VARCHAR(50) NOT NULL,
  file_size          BIGINT UNSIGNED NOT NULL,
  width              INT UNSIGNED NULL,
  height             INT UNSIGNED NULL,
  thumbnail_sm_url   VARCHAR(500) NULL,
  thumbnail_md_url   VARCHAR(500) NULL,
  thumbnail_lg_url   VARCHAR(500) NULL,
  created_at         TIMESTAMP NULL,
  updated_at         TIMESTAMP NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB;
```

### 7.2.7 tour_views (analytics)

```sql
CREATE TABLE tour_views (
  id                        BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tour_id                   BIGINT UNSIGNED NOT NULL,
  session_id                CHAR(36) NOT NULL,
  ip_hash                   CHAR(64) NOT NULL,
  user_agent                VARCHAR(500) NULL,
  referrer                  VARCHAR(500) NULL,
  country                   CHAR(2) NULL,
  device_type               ENUM('desktop','mobile','tablet','bot','other') NOT NULL DEFAULT 'other',
  viewed_at                 TIMESTAMP NOT NULL,
  session_duration_seconds  INT UNSIGNED NULL,
  waypoints_visited         JSON NULL,
  hotspots_opened           JSON NULL,
  completed                 BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  INDEX idx_tour_time (tour_id, viewed_at),
  INDEX idx_session (session_id)
) ENGINE=InnoDB
  PARTITION BY RANGE (UNIX_TIMESTAMP(viewed_at)) (
    -- partitions added monthly via scheduler
  );
```

### 7.2.8 audit_logs

```sql
CREATE TABLE audit_logs (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NULL,
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50)  NOT NULL,
  entity_id     BIGINT UNSIGNED NOT NULL,
  metadata      JSON NULL,
  ip_address    VARCHAR(45) NULL,
  created_at    TIMESTAMP NOT NULL,
  INDEX idx_user_time (user_id, created_at),
  INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB;
```

### 7.2.9 slug_redirects

```sql
CREATE TABLE slug_redirects (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  old_slug       VARCHAR(120) NOT NULL UNIQUE,
  tour_id        BIGINT UNSIGNED NOT NULL,
  expires_at     TIMESTAMP NOT NULL,
  created_at     TIMESTAMP NULL,
  FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;
```

## 7.3 Tour Eloquent Model (excerpt)

```php
class Tour extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'created_by_user_id', 'name', 'description',
        'client_name', 'project_date', 'thumbnail_url',
        'model_url', 'model_file_size', 'model_metadata',
        'default_camera', 'status', 'visibility',
        'public_slug', 'custom_slug', 'password_hash',
        'expires_at', 'allow_embed', 'embed_allowed_hosts',
        'og_title', 'og_description', 'og_image_url',
    ];

    protected $casts = [
        'model_metadata'      => 'array',
        'default_camera'      => 'array',
        'embed_allowed_hosts' => 'array',
        'allow_embed'         => 'boolean',
        'expires_at'          => 'datetime',
        'published_at'        => 'datetime',
        'project_date'        => 'date',
    ];

    protected $hidden = ['password_hash'];

    public function creator()   { return $this->belongsTo(User::class, 'created_by_user_id'); }
    public function waypoints() { return $this->hasMany(Waypoint::class)->orderBy('display_order'); }
    public function hotspots()  { return $this->hasMany(Hotspot::class)->where('is_visible', true); }
    public function views()     { return $this->hasMany(TourView::class); }

    public function getPublicUrlAttribute(): string
    {
        return url('/t/' . ($this->custom_slug ?: $this->public_slug));
    }

    protected static function booted(): void
    {
        static::creating(function (Tour $tour) {
            $tour->public_slug ??= app(SlugGenerator::class)->generateUnique();
        });
    }
}
```

---

# 8. API Specifications

All admin endpoints are authenticated via session + Sanctum. Public endpoints are unauthenticated but rate-limited. Responses are JSON.

## 8.1 Authentication

| ID | Method + Path | Description |
|---|---|---|
| API-001 | `POST /login` | Authenticate admin user; sets session cookie |
| API-002 | `POST /logout` | Terminate session |
| API-003 | `POST /password/forgot` | Request password reset email |
| API-004 | `POST /password/reset` | Complete password reset via token |
| API-005 | `GET /me` | Return current user + role |

## 8.2 Tour Management

| ID | Method + Path | Description |
|---|---|---|
| API-010 | `GET /api/v1/tours` | List tours (paginated, filterable) |
| API-011 | `POST /api/v1/tours` | Create tour |
| API-012 | `GET /api/v1/tours/{id}` | Retrieve tour with waypoints and hotspots |
| API-013 | `PATCH /api/v1/tours/{id}` | Update tour metadata |
| API-014 | `DELETE /api/v1/tours/{id}` | Soft-delete tour |
| API-015 | `POST /api/v1/tours/{id}/duplicate` | Duplicate tour |
| API-016 | `POST /api/v1/tours/{id}/publish` | Publish tour |
| API-017 | `POST /api/v1/tours/{id}/unpublish` | Unpublish tour |
| API-018 | `POST /api/v1/tours/{id}/model` | Upload 3D model (multipart) |
| API-019 | `DELETE /api/v1/tours/{id}/model` | Remove 3D model |

## 8.3 Waypoints

| ID | Method + Path | Description |
|---|---|---|
| API-020 | `GET /api/v1/tours/{tour}/waypoints` | List waypoints |
| API-021 | `POST /api/v1/tours/{tour}/waypoints` | Create waypoint |
| API-022 | `PATCH /api/v1/waypoints/{id}` | Update label/position/order |
| API-023 | `DELETE /api/v1/waypoints/{id}` | Delete waypoint |
| API-024 | `POST /api/v1/tours/{tour}/waypoints/reorder` | Bulk reorder |

## 8.4 Hotspots

| ID | Method + Path | Description |
|---|---|---|
| API-030 | `GET /api/v1/tours/{tour}/hotspots` | List hotspots |
| API-031 | `POST /api/v1/tours/{tour}/hotspots` | Create hotspot |
| API-032 | `PATCH /api/v1/hotspots/{id}` | Update hotspot |
| API-033 | `DELETE /api/v1/hotspots/{id}` | Delete hotspot |
| API-034 | `POST /api/v1/hotspots/{id}/media` | Attach media |
| API-035 | `DELETE /api/v1/hotspot-media/{id}` | Detach media |

## 8.5 Media Library

| ID | Method + Path | Description |
|---|---|---|
| API-040 | `GET /api/v1/media` | List media (paginated) |
| API-041 | `POST /api/v1/media` | Upload file (multipart) |
| API-042 | `DELETE /api/v1/media/{id}` | Delete media (blocked if referenced) |

## 8.6 Analytics

| ID | Method + Path | Description |
|---|---|---|
| API-050 | `GET /api/v1/tours/{id}/analytics/overview` | Overview cards for range |
| API-051 | `GET /api/v1/tours/{id}/analytics/timeseries` | Daily views time-series |
| API-052 | `GET /api/v1/tours/{id}/analytics/referrers` | Top referrers |
| API-053 | `GET /api/v1/tours/{id}/analytics/devices` | Device breakdown |
| API-054 | `GET /api/v1/tours/{id}/analytics/waypoints` | Waypoint visit heatmap |
| API-055 | `POST /api/v1/tours/{id}/analytics/export` | Request CSV export |

## 8.7 Public Endpoints (Unauthenticated)

| ID | Method + Path | Description |
|---|---|---|
| API-060 | `GET /t/{slug}` | Public tour viewer HTML (Inertia page) |
| API-061 | `GET /api/public/tours/{slug}` | Public tour JSON (for SPA viewer) |
| API-062 | `POST /api/public/tours/{slug}/unlock` | Submit password; sets session flag |
| API-063 | `POST /api/public/tours/{slug}/view` | Analytics ingest — fired on view start |
| API-064 | `POST /api/public/tours/{slug}/view/end` | Analytics ingest — fired on unload with session data |

## 8.8 Request / Response Examples

### Create Waypoint

**Request**

```http
POST /api/v1/tours/42/waypoints
Content-Type: application/json

{
  "label": "Living Room",
  "position": {"x": 2.3, "y": 1.6, "z": -1.8},
  "look_at":  {"x": 0.0, "y": 1.6, "z":  0.0},
  "display_order": 1,
  "transition_ms": 1200
}
```

**Response 201**

```json
{
  "id": 127,
  "tour_id": 42,
  "label": "Living Room",
  "position": {"x": 2.3, "y": 1.6, "z": -1.8},
  "look_at":  {"x": 0.0, "y": 1.6, "z":  0.0},
  "display_order": 1,
  "transition_ms": 1200,
  "thumbnail_url": null,
  "created_at": "2026-04-22T09:00:00Z",
  "updated_at": "2026-04-22T09:00:00Z"
}
```

### Public Tour JSON

**Request** — `GET /api/public/tours/a7f3k9x2`

**Response 200**

```json
{
  "tour": {
    "id": 42,
    "name": "Gulshan Residence",
    "client_name": "Mr. Rahman",
    "model_url": "https://cdn.example.com/models/xyz.glb",
    "default_camera": { "position": {"x":0,"y":1.6,"z":5}, "target": {"x":0,"y":1.6,"z":0} },
    "og_title": "Gulshan Residence — Interior Walkthrough",
    "og_image_url": "https://cdn.example.com/og/42.jpg",
    "branding": { "company_name": "Interior Villa", "logo_url": "..." }
  },
  "waypoints": [ { "id": 101, "label": "Entry", "position": {...}, "look_at": {...} } ],
  "hotspots":  [ { "id": 201, "title": "Italian sofa", "type": "product", "price_bdt": "185000.00" } ]
}
```

## 8.9 Error Format

All errors follow this shape:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "label": ["The label field is required."]
  },
  "code": "VALIDATION_FAILED"
}
```

Status codes: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict (slug taken), `410` gone (expired tour), `422` unprocessable, `429` rate limited, `500` server.

---

# 9. UI/UX Specifications

## 9.1 Admin Panel — Information Architecture

```
/admin
├── /dashboard              — overview, recent tours, quick stats
├── /tours                  — list of tours
│   └── /tours/{id}/editor  — 3D editor
│   └── /tours/{id}/settings
│   └── /tours/{id}/analytics
│   └── /tours/{id}/share
├── /media                  — media library
├── /users                  — user management (Admin only)
├── /settings               — application settings
│   └── /settings/branding
│   └── /settings/billing   — Phase 3
└── /profile                — user profile, password change
```

## 9.2 3D Editor Layout

```
+-------------------------------------------------------------+
|  Top bar: Tour name · status · Save indicator · Publish     |
+-----------+-------------------------------------+-----------+
|           |                                     |           |
|  Sidebar  |                                     |  Property |
|  (left)   |          3D Canvas                  |  Panel    |
|           |                                     |  (right)  |
|  - Tools  |  - Orbit controls                   |           |
|  - List   |  - Floor grid                       |  Edit     |
|    of     |  - Waypoint rings                   |  selected |
|    way-   |  - Hotspot pins                     |  point    |
|    points |  - Selection highlight              |           |
|  - List   |                                     |           |
|    of     |                                     |           |
|    hot-   |                                     |           |
|    spots  |                                     |           |
+-----------+-------------------------------------+-----------+
|  Bottom bar: camera info · FPS · fullscreen toggle           |
+-------------------------------------------------------------+
```

## 9.3 Public Viewer — Desktop

```
+-------------------------------------------------------------+
|  Logo · Tour name · Share · Fullscreen                       |
+-----------+-------------------------------------+-----------+
|           |                                     |           |
|  Way-     |                                     | Hotspot   |
|  point    |          3D Canvas                  | Info      |
|  list     |                                     | Panel     |
|           |  - Touch/mouse controls             | (opens    |
|  Clicks   |  - Waypoint markers                 |  when     |
|  jump     |  - Hotspot pins                     |  hotspot  |
|  camera   |                                     |  clicked) |
|           |                                     |           |
+-----------+-------------------------------------+-----------+
|  Footer: Powered by Technocrats (hidden in embed)            |
+-------------------------------------------------------------+
```

## 9.4 Public Viewer — Mobile

```
+----------------------------------+
|  Logo     Tour title    ≡  ⛶     |
+----------------------------------+
|                                  |
|                                  |
|         3D Canvas                |
|         (full width)             |
|                                  |
|                                  |
+----------------------------------+
|  ↑ Drag up for waypoint list     |
|                                  |
|  [ Bottom sheet ]                |
|  • Living Room                   |
|  • Kitchen                       |
|  • Bedroom                       |
+----------------------------------+
```

## 9.5 Design Tokens

- Primary color: `#1F3A5F` (configurable in application settings)
- Accent color: `#E19A3C` (default; configurable)
- Typography: Inter for UI; system font fallback
- Corner radius: 8px default, 12px cards, 9999px pills
- Shadow: Tailwind `shadow-md` two-layer soft
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
- Motion: 200ms ease-out for UI; 1200ms ease-in-out for camera transitions

---

# 10. Development Phases

## 10.1 Phase 1 — MVP (Target: 6–8 weeks)

| Week | Deliverables |
|---|---|
| 1 | Project scaffold. Laravel 11 + Inertia + React + Tailwind + TypeScript. Docker compose. Auth (email/password). |
| 2 | Tours CRUD + MySQL schema + migrations + seeders. Basic admin UI: list, create, edit, delete tours. |
| 3 | 3D model upload (resumable). GLB validation. Media library. Cloud storage integration. |
| 4 | 3D editor skeleton: R3F canvas, orbit controls, model loading. |
| 5 | Waypoint placement (raycasting), editing, reorder. Autosave. Sidebar list. |
| 6 | Hotspot placement, content form, media attachment, billboarding. |
| 7 | Public viewer: slug routing, model loading, waypoint navigation, hotspot interaction. Mobile responsive. |
| 8 | Shareable links, QR, social metadata. Bug fixes. Smoke tests. Deploy to Coolify staging. |

## 10.2 Phase 2 — Polish (Target: 4–5 weeks)

- Application settings, branding.
- Password protection, expiry, visibility levels.
- Analytics ingest + dashboard.
- Iframe embed + postMessage API.
- User invitations, RBAC refinement.
- WCAG AA compliance pass.
- Load testing (k6 or similar); performance tuning.

## 10.3 Phase 3 — Scale + Advanced (Target: 6+ weeks)

- Bengali (Bangla) UI localization.
- First-person walk mode with collision detection.
- Waypoint thumbnails auto-generated from camera snapshots.
- Hotspot comments (client review workflow).
- Billing + subscription plans (Stripe or local gateway).
- API tokens for third-party integrations.
- WebXR / VR headset support.

---

# 11. Acceptance Criteria

The following E2E scenarios SHALL pass before production release.

## 11.1 First-time tour creation

**Actor:** Admin. **Preconditions:** Verified account.

**Steps:**
1. Log in to the admin panel.
2. Click "New Tour"; fill in name and description; submit.
3. On the editor page, upload a 25 MB `.glb` file.
4. Place three waypoints at different rooms.
5. Add two hotspots with title, description, and one image each.
6. Click "Publish".
7. Copy the public URL from the share menu.
8. Open the URL in an incognito browser.

**Expected:** Public viewer loads the tour, shows three waypoints, allows navigation to each, opens hotspot content when clicked. No authentication prompt. No console errors.

## 11.2 Private tour protection

**Actor:** Public Viewer. **Preconditions:** Tour with `visibility='private'`.

**Steps:** Open the tour URL in incognito.

**Expected:** HTTP 404. No tour content revealed.

## 11.3 Password-protected tour

**Steps:**
1. Open a password-protected tour URL.
2. Enter correct password; submit.
3. Navigate the tour.
4. Close browser and reopen within 24 hours.
5. Re-open the same URL.

**Expected:** First visit prompts for password; unlock reveals tour. Reopen within 24 hours does not re-prompt. After 24 hours, password required again.

## 11.4 Mobile viewer performance

**Actor:** Public Viewer on mid-range Android (e.g., Redmi 10) on 4G.

**Steps:**
1. Open a public tour URL with a 25 MB model.
2. Wait for model to load.
3. Navigate between 5 waypoints.
4. Open 3 hotspots.

**Expected:** Model loads within 20s. Waypoint transitions ≥ 25 FPS. Hotspot panel opens within 200ms of tap. No crashes.

## 11.5 Analytics accuracy

**Steps:**
1. Open a published tour 10 times from 3 different devices.
2. Close each session after visiting different waypoints.
3. Wait 2 minutes for analytics to flush.
4. As Admin, open the tour's analytics dashboard.

**Expected:** Total views = 10. Unique visitors ≈ 3 (IP-hashed). Waypoint heatmap reflects visits. Session durations non-zero.

## 11.6 Embed integration

**Steps:**
1. As Admin, open a public tour's share menu.
2. Copy the embed code.
3. Paste into a plain HTML page hosted on a different domain.
4. Load the HTML page in a browser.

**Expected:** Tour renders inside iframe. Branding hidden. Fullscreen works. Waypoint navigation works.

---

# 12. Appendices

## Appendix A — Third-Party Libraries

| Library | Purpose | License |
|---|---|---|
| Laravel 11 | Backend framework | MIT |
| Inertia.js | Server-driven SPA bridge | MIT |
| React 18 | UI rendering | MIT |
| Three.js | 3D rendering engine | MIT |
| React Three Fiber | React renderer for Three.js | MIT |
| drei | R3F helpers | MIT |
| TweenJS | Camera animation | MIT |
| Tailwind CSS | Utility CSS | MIT |
| Radix UI | Accessible primitives | MIT |
| Lucide | Icons | ISC |
| Chart.js | Analytics charts | MIT |
| qrcode.js | QR code generation | MIT |
| DOMPurify | HTML sanitization (frontend) | Apache 2.0 / MPL 2.0 |
| HTMLPurifier | HTML sanitization (backend) | LGPL |
| MaxMind GeoLite2 | GeoIP database | CC BY-SA 4.0 |

## Appendix B — `.env.example`

```dotenv
APP_NAME="3D Tour Platform"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tours.technocratsdigital.com

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=tours
DB_USERNAME=tours_user
DB_PASSWORD=

REDIS_HOST=redis
REDIS_PASSWORD=
REDIS_PORT=6379

QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
CACHE_STORE=redis

FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=auto
AWS_BUCKET=tours-production
AWS_ENDPOINT=https://xxx.r2.cloudflarestorage.com
AWS_USE_PATH_STYLE_ENDPOINT=false

MAIL_MAILER=smtp
MAIL_HOST=smtp.postmarkapp.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=noreply@technocratsdigital.com
MAIL_FROM_NAME="${APP_NAME}"

GEOIP_DATABASE_PATH=/var/lib/geoip/GeoLite2-Country.mmdb

# Application-specific
TOUR_MODEL_MAX_SIZE=104857600          # 100 MB
TOUR_PUBLIC_SLUG_LENGTH=8
TOUR_VIEW_COOLDOWN_SECONDS=1800
ANALYTICS_IP_HASH_SALT=                # long random string
SLUG_REDIRECT_DAYS=30
```

## Appendix C — Claude Code Prompting Strategy

Break the build into focused prompts, each pointing Claude Code at the relevant sections of this SRS:

1. **Scaffold** — "Scaffold a Laravel 11 project with Inertia.js, React 18, TypeScript, Tailwind, Vite, Docker, and Coolify-friendly docker-compose. Reference §6 of SRS.md."
2. **Data layer** — "Generate all MySQL migrations and Eloquent models per §7. Include foreign keys, indexes, and soft deletes."
3. **Auth** — "Implement authentication per FR-001 through FR-004, including the role enum on `users`."
4. **Tour CRUD (admin)** — "Build Tour list, create, edit, delete, duplicate, publish flows per FR-010 through FR-015."
5. **Model upload** — "Implement 3D model upload service per FR-020 through FR-022 using resumable uploads and server-side GLB validation."
6. **3D editor** — "Build the React Three Fiber editor per FR-030 through FR-037: modes, raycasting, sidebar, autosave."
7. **Public viewer** — "Build the public viewer per FR-070 through FR-075, mobile-first."
8. **Shareable links** — "Implement slug generation, share menu, QR, social metadata, visibility, password per FR-080 through FR-093."
9. **Analytics** — "Implement ingest + dashboard per FR-100 through FR-102."
10. **Embed** — "Implement iframe embed + postMessage per FR-110 through FR-111."
11. **E2E tests** — "Write Playwright E2E tests covering §11 scenarios."
12. **Security pass** — "Harden the app against OWASP Top 10; cross-check §5.2."

For each prompt: work in a dedicated branch, commit after each atomic step, run tests after each stage. Use `claude-code` with this SRS as a pinned context file.

## Appendix D — Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 3D models too large for mobile | High | High | Enforce 100 MB cap; guide clients on compression; show triangle-count warnings in admin UI. |
| Browser WebGL inconsistency | Medium | Medium | Maintain test matrix; graceful static fallback. |
| Slug collisions at scale | Low | Low | 8-char alphanumeric = 2.8T combinations; collision-check-and-retry on insert. |
| Analytics storage growth | High | Medium | Monthly partitioning of `tour_views`; archival job after 180 days. |
| Unauthorized model downloads | Medium | Medium | Signed S3 URLs with 10-minute expiry; Referer/Origin checks. |
| DDoS on public viewer | Medium | High | Rate limiting; Cloudflare front; static fallback on overload. |
| 3D artist delivers malformed GLB | High | Medium | Server-side validator rejects with clear error; link to optimization guide. |

## Appendix E — Measurement Conventions

- All times UTC unless marked "local".
- All distances in meters (Three.js world units).
- All file sizes in bytes; UI formats as KB/MB/GB (1 KB = 1024 B).
- All currencies BDT unless otherwise noted; stored as `DECIMAL(12,2)`.
- All rate limits in requests per minute per IP unless otherwise noted.

---

**End of Document**
