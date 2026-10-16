# SmartQEye Coastal — Third-Party Software & Licensing Register
**Customer:** Kerala Police Coastal Police / Cyber Division  
**Compliance Requirement:** Permissive Licences Only (MIT, Apache-2.0, BSD-2/3-Clause, ISC). No AGPL or GPL dependencies.

---

## 1. Runtime Dependencies

| Package | Version | Licence | Purpose |
| :--- | :--- | :--- | :--- |
| `react` | 19.2.8 | MIT | Core UI component engine |
| `react-dom` | 19.2.8 | MIT | DOM rendering layer |
| `react-router-dom` | 7.18.4 | MIT | Client-side SPA routing |
| `@tanstack/react-query` | 5.104.1 | MIT | Asynchronous state & cache management |
| `zustand` | 5.0.15 | MIT | Lightweight global state store |
| `tailwindcss` | 4.3.3 | MIT | Utility-first design system styling |
| `@tailwindcss/vite` | 4.3.3 | MIT | Tailwind Vite integration plugin |
| `clsx` | 2.1.1 | MIT | Class name utility |
| `tailwind-merge` | 3.7.0 | MIT | Tailwind class conflict resolution |
| `lucide-react` | 1.54.0 | ISC | Tactical icon library |
| `recharts` | 3.10.1 | MIT | Real-time charts and telemetry visualisations |
| `maplibre-gl` | 6.13.0 | BSD-3-Clause | Hardware-accelerated offline vector/raster GIS maps |
| `date-fns` | 4.4.0 | MIT | IST and UTC timestamp parsing & formatting |
| `geojson` | 0.5.0 | MIT | Geographic polygon and track data types |
| `cmdk` | 1.1.1 | MIT | Command palette and quick-action launcher |
| `@radix-ui/react-dialog` | 1.2.0 | MIT | Accessible modal dialog primitives |
| `@radix-ui/react-dropdown-menu` | 2.1.25 | MIT | Accessible context and navigation menus |
| `@radix-ui/react-tabs` | 1.1.22 | MIT | Accessible tab interfaces |
| `@radix-ui/react-tooltip` | 1.3.0 | MIT | Accessible hover contextual guidance |
| `@radix-ui/react-switch` | 1.3.8 | MIT | Accessible toggle controls |
| `@radix-ui/react-slider` | 1.5.0 | MIT | Range controls and video scrubbers |
| `@radix-ui/react-popover` | 1.2.0 | MIT | Contextual popover panels |
| `@radix-ui/react-separator` | 1.1.16 | MIT | Accessible layout separators |
| `@radix-ui/react-progress` | 1.1.17 | MIT | Telemetry and health progress bars |
| `@fontsource/fraunces` | 5.3.0 | OFL-1.1 | Bundled offline display serif typography |
| `@fontsource/manrope` | 5.3.0 | OFL-1.1 | Bundled offline UI body typography |
| `@fontsource/jetbrains-mono` | 5.3.0 | Apache-2.0 | Bundled offline tactical telemetry typography |

---

## 2. Neural Network Architecture & Model Licences

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
