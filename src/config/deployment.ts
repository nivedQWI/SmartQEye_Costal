// ============================================================
// SmartQEye Coastal — Deployment & Infrastructure Configuration
// Single source of truth for deployment profiles, hardware nodes, and versions
// ============================================================

export interface GpuNodeConfig {
  id: string;
  name: string;
  role: string;
  hardwareString: string;
  vramTotalGb: number;
  cudaVersion: string;
  tensorRtVersion: string;
  status: 'ONLINE' | 'STANDBY' | 'DEGRADED';
}

export const CENTRAL_DEPLOYMENT_CONFIG = {
  platformName: 'SmartQEye Coastal',
  vendor: 'Quantumweave Intelligence Pvt. Ltd.',
  vendorLocation: 'Thiruvananthapuram, Kerala, India',
  productVersion: '1.2.0-coastal',
  modelBundleVersion: 'v2.4.1-coastal',
  supportContact: 'coastal-ops@quantumweave.in',
  emergencyDesk: '+91 471 255 0100',
  buildHash: typeof __BUILD_HASH__ !== 'undefined' ? __BUILD_HASH__ : '7fd198f',

  // Neutral Node definitions (no hard-coded proprietary marketing claims in UI)
  nodes: {
    primaryGpuNode: {
      id: 'node-central-a',
      name: 'Central GPU Node A',
      role: 'Primary Tactical Inference & Tracking (RGB/Thermal)',
      hardwareString: 'Central GPU Node A (Target: 2x 24GB VRAM Server)',
      vramTotalGb: 48,
      cudaVersion: '12.4',
      tensorRtVersion: '10.2.1',
      status: 'ONLINE',
    } as GpuNodeConfig,
    secondaryGpuNode: {
      id: 'node-central-b',
      name: 'Central GPU Node B',
      role: 'Secondary Forensic Analytics & Hot Standby (ELIR & Re-ID)',
      hardwareString: 'Central GPU Node B (Target: 2x 24GB VRAM Server)',
      vramTotalGb: 48,
      cudaVersion: '12.4',
      tensorRtVersion: '10.2.1',
      status: 'ONLINE',
    } as GpuNodeConfig,
    edgeProfile: {
      id: 'profile-edge-laptop',
      name: 'Tactical Edge Mobile Node',
      role: 'Edge-Laptop Profile (On-Scene Mobile Quick Deploy)',
      hardwareString: 'Edge Mobile Workstation (Target: 1x 16GB VRAM Laptop)',
      vramTotalGb: 16,
      cudaVersion: '12.2',
      tensorRtVersion: '10.0',
      status: 'ONLINE',
    } as GpuNodeConfig,
  },

  // 4 Deployment Architectures (as per RFP §5 & Proposal §4.2)
  deploymentModels: [
    {
      id: 'DEP-CENTRAL',
      name: 'Central GPU Command Server',
      target: 'Kerala Police State Coastal Command & Cyber Division HQ',
      specs: 'Central GPU Node A & B (High-throughput multi-stream inference)',
    },
    {
      id: 'DEP-LOCAL-EDGE',
      name: 'Local Coastal Station Edge Unit',
      target: 'Vizhinjam / Neendakara Coastal Police Stations',
      specs: 'Local Micro-Server / Accelerated Edge Gateway',
    },
    {
      id: 'DEP-COOP-EDGE',
      name: 'Tactical Cooperative Edge Node',
      target: 'Surveillance Van / Coastal Interceptor Boat Patrol',
      specs: 'Ruggedized In-Vehicle Edge Compute Box',
    },
    {
      id: 'DEP-POST-MISSION',
      name: 'Forensic Post-Mission Lab',
      target: 'Drone Forensic Lab, Cyber Division, Thiruvananthapuram',
      specs: 'Offline ELIR Deep Review & Frame Analysis Workstation',
    },
  ],
};
