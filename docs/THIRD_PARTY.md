# SmartQEye Coastal — Third-Party Software & Licensing Register

**Platform:** SmartQEye Coastal  
**Customer:** Kerala Police Coastal Police / Cyber Division – Drone Forensic Lab  
**Procurement Reference:** KSUM RFP "Development, Deployment and Commissioning of AI-Based Coastal Drone Surveillance and Video Analytics Software"  
**Compliance Mandate:** Permissive Licences Only (MIT, Apache-2.0, BSD-2/3-Clause, ISC, OFL-1.1). Zero AGPL or GPL dependencies.

---

## 1. Production Runtime Dependencies (`package.json`)

| Package | Version | Licence | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| `@fontsource/fraunces` | ^5.3.0 | OFL-1.1 | Bundled offline display serif typography |
| `@fontsource/jetbrains-mono` | ^5.3.0 | Apache-2.0 | Bundled offline tactical telemetry typography |
| `@fontsource/manrope` | ^5.3.0 | OFL-1.1 | Bundled offline UI body typography |
| `@radix-ui/react-alert-dialog` | ^1.1.24 | MIT | Accessible modal confirmation dialogs |
| `@radix-ui/react-avatar` | ^1.2.7 | MIT | Officer profile avatar primitives |
| `@radix-ui/react-checkbox` | ^1.3.12 | MIT | Multi-select filters and table toggles |
| `@radix-ui/react-dialog` | ^1.2.0 | MIT | Accessible modal dialog primitives |
| `@radix-ui/react-dropdown-menu` | ^2.1.25 | MIT | Contextual menus and role selectors |
| `@radix-ui/react-popover` | ^1.2.0 | MIT | Tactical popover panels |
| `@radix-ui/react-progress` | ^1.1.17 | MIT | Telemetry and health progress bars |
| `@radix-ui/react-radio-group` | ^1.4.8 | MIT | Single-choice tactical settings |
| `@radix-ui/react-scroll-area` | ^1.3.0 | MIT | Custom styled scroll containers |
| `@radix-ui/react-select` | ^2.3.8 | MIT | Accessible dropdown selector primitives |
| `@radix-ui/react-separator` | ^1.1.16 | MIT | Visual divider primitives |
| `@radix-ui/react-slider` | ^1.5.0 | MIT | Scrubbers and threshold sliders |
| `@radix-ui/react-switch` | ^1.3.8 | MIT | Accessible toggle controls |
| `@radix-ui/react-tabs` | ^1.1.22 | MIT | Accessible tab interfaces |
| `@radix-ui/react-toggle` | ^1.1.19 | MIT | Button state toggles |
| `@radix-ui/react-toggle-group` | ^1.1.20 | MIT | Segmented button groups |
| `@radix-ui/react-tooltip` | ^1.3.0 | MIT | Contextual hover guidance tooltips |
| `@tailwindcss/vite` | ^4.3.3 | MIT | Tailwind CSS v4 Vite integration |
| `@tanstack/react-query` | ^5.104.1 | MIT | Asynchronous state & cache management |
| `@types/maplibre-gl` | ^1.13.2 | MIT | TypeScript definitions for MapLibre GL |
| `clsx` | ^2.1.1 | MIT | Utility for constructing className strings |
| `cmdk` | ^1.1.1 | MIT | Fast command palette & shortcut launcher |
| `date-fns` | ^4.4.0 | MIT | IST and UTC timestamp parsing & formatting |
| `geojson` | ^0.5.0 | MIT | Geographic polygon and track data types |
| `lucide-react` | ^1.54.0 | ISC | Tactical icon library |
| `maplibre-gl` | ^6.13.0 | BSD-3-Clause | Hardware-accelerated offline vector/raster GIS maps |
| `react` | ^19.2.8 | MIT | Core UI component engine |
| `react-dom` | ^19.2.8 | MIT | DOM rendering layer |
| `react-router-dom` | ^7.18.4 | MIT | Client-side SPA routing |
| `recharts` | ^3.10.1 | MIT | Real-time charts and telemetry visualisations |
| `tailwind-merge` | ^3.7.0 | MIT | Tailwind class conflict resolution |
| `tailwindcss` | ^4.3.3 | MIT | Utility-first design system styling |
| `zustand` | ^5.0.15 | MIT | Lightweight global state store |

---

## 2. Development Dependencies

| Package | Version | Licence | Purpose |
| :--- | :--- | :--- | :--- |
| `@types/geojson` | ^7946.0.16 | MIT | TypeScript types for GeoJSON |
| `@types/node` | ^24.13.3 | MIT | Node.js standard library types |
| `@types/react` | ^19.2.18 | MIT | React TypeScript definitions |
| `@types/react-dom` | ^19.2.7 | MIT | React DOM TypeScript definitions |
| `@vitejs/plugin-react` | ^6.1.1 | MIT | Vite plugin for React Fast Refresh |
| `oxlint` | ^1.81.0 | MIT / Apache-2.0 | High-performance linter engine |
| `typescript` | ~6.0.2 | Apache-2.0 | Strict type checker and compiler |
| `vite` | ^8.3.0 | MIT | Fast frontend build tool & dev server |

---

## 3. Permissive Neural Architectures (Licence-Conscious AI)

In compliance with procurement regulations avoiding AGPL-3.0 (e.g. Ultralytics YOLO):

| Model / Pipeline Component | Open-Source Origin | Licence | Status |
| :--- | :--- | :--- | :--- |
| **RTMDet** | OpenMMLab / MMDetection | Apache-2.0 | Approved for deployment |
| **RT-DETR / RT-DETRv2** | Baidu / PaddleDetection | Apache-2.0 | Approved for deployment |
| **ByteTrack** | ByteDance Research | MIT | Approved for deployment |
| **CSRNet** | VGG / Crowd Counting | MIT | Approved for deployment |
| **PaddleOCR / CRNN** | PaddlePaddle | Apache-2.0 | Approved for deployment |
| **OSNet-IBN (Re-ID)** | Torbreck / Kaiyang Zhou | MIT | Approved for deployment |
| **ArcFace / InsightFace** | DeepInsight | MIT / Apache-2.0 | Authorisation gated |
