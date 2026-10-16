# Kerala Coastal Police — SmartQEye Operator Manual

## 1. System Overview & Mandate
SmartQEye Coastal is designed for maritime intelligence and shoreline security for the Kerala Police Coastal Division.

## 2. Ingestion & Multi-Modality
- **Video Streams**: 1080p optical RGB and 640x512 LWIR thermal feeds from tethered and long-range UAVs.
- **Cognitive Frame Selection (CFS)**: Dynamically adjusts inference frame rate (8–25 FPS) based on scene entropy to preserve GPU compute on open ocean.
- **Thermal Ironbow**: Press `T` to toggle ironbow false-color imaging for night operations.

## 3. Incident Investigation & ELIR
1. Acknowledge real-time alerts within 120 seconds.
2. Review the 3 CKFE evidence keyframes with HUD burn-in data.
3. Determine vessel context according to Kerala Maritime Craft taxonomy.
4. Escalate to station Duty Officer or record false-positive justification.

> **Operational Warning**: AI outputs are strictly decision-support advisories. The investigating police officer retains sole statutory authority for dispatch, interceptor launch, and enforcement.
