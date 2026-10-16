# SmartQEye Coastal — Video Sidecar Generation Tools

This directory provides offline tooling to generate synchronised `<clip>.detections.json` sidecar files from aerial coastal drone video clips, in full compliance with Kerala Police RFP §3 & §5 specifications.

---

## 🛠️ Tool 1: `make_sidecar.py` (Automated Offline Pipeline)

Executes an object detector (RTMDet / RT-DETR, Apache-2.0) and multi-object tracker (ByteTrack, MIT) offline over an MP4 video, exporting bounding boxes, tracks, contact codes (`C-1042`), Cognitive Frame Selection (CFS) states, and telemetry.

### Installation

```bash
pip install opencv-python numpy torch torchvision supervision
# Optional for full MMDetection support:
pip install mmdet
```

### Usage

```bash
# Basic run on any drone clip:
python make_sidecar.py --video coastal_patrol.mp4

# With custom UAV and Mission identifiers:
python make_sidecar.py --video coastal_patrol.mp4 --uav UAV-KL-03 --mission MSN-20261016-0830-01-VIZHINJAM --output public/demo/vizhinjam_patrol.detections.json
```

---

## ✏️ Tool 2: `annotate.html` (Zero-Dependency Offline GUI)

A standalone single-file HTML5/Canvas application for manual ground-truth annotation, inspection, and verification without installing Python or GPU libraries.

### Features:
- **100% Offline**: Zero external network dependencies, libraries, or CDNs.
- **1 FPS Keyframe Stepping**: Step backward/forward frame-by-frame or second-by-second.
- **Interactive Drag-and-Drop Boxes**: Click and drag to create bounding boxes directly over video frames.
- **Kerala Coastal Taxonomy**: Pre-configured with artisanal and commercial vessel classes (`Small Craft`, `Mechanised Trawler`, `Motorised Country Craft`, `Catamaran`).
- **One-Click JSON Export**: Downloads standard `.detections.json` formatted for the SmartQEye Coastal video engine.

### Usage:
1. Double-click `tools/annotate.html` to open in any modern browser (Chrome, Edge, Firefox).
2. Click **"Open MP4 Video..."** to load a local clip.
3. Draw target boxes and assign contact codes.
4. Click **"Export Sidecar JSON"** and place the exported file into `public/demo/<scene>.detections.json`.
