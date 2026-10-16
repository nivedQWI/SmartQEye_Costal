// ============================================================
// SmartQEye Coastal — AI & Models Management (/models & /config/models)
// Proposal 5.1.29, 6.5 & RFP §11 Compliance
// 7 Comprehensive Governance & Lifecycle Tabs:
// Registry | Datasets | Classes & Taxonomy | Training Runs | Evaluation | Deployment | Feedback Queue
// ============================================================

import { useState } from 'react';
import {
  Cpu, Play, Square, RefreshCw, CheckCircle2, AlertTriangle,
  HardDrive, Zap, Sliders, Radio, Activity, Layers, Shield,
  Database, GitBranch, ArrowLeftRight, RotateCcw, AlertOctagon,
  FileCheck2, Plus, Search, ChevronRight, Check, X, ShieldAlert,
  Info, ExternalLink, Filter, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UAVS } from '@/lib/mockData';
import { CENTRAL_DEPLOYMENT_CONFIG } from '@/config/deployment';
import { useAuthStore } from '@/lib/store';
import { auditApi } from '@/lib/api';
import type { AiModelItem } from '@/types';

// ─── Initial Model Registry (Phase 1 Entries) ─────────────────

const INITIAL_MODELS: (AiModelItem & { rollbackTarget?: string })[] = [
  {
    id: 'mod-1',
    name: 'RTMDet-L (MMDetection)',
    task: 'object detection, central GPU profile',
    version: 'v2.4.1-coastal',
    modality: 'RGB',
    licence: 'Apache-2.0',
    status: 'ACTIVE',
    state: 'ACTIVE',
    framework: 'OpenMMLab / TensorRT 10.2',
    vramMb: 3450,
    assignedDroneCodes: ['UAV-KL-01', 'UAV-KL-02', 'UAV-KL-03', 'UAV-KL-04'],
    fpsAverage: 31.4,
    latencyMs: 14.2,
    rollbackTarget: 'v2.3.9-coastal',
  },
  {
    id: 'mod-2',
    name: 'RTMDet-S',
    task: 'edge-laptop profile',
    version: 'v2.4.1-edge',
    modality: 'RGB',
    licence: 'Apache-2.0',
    status: 'ACTIVE',
    state: 'ACTIVE',
    framework: 'ONNX Runtime / TensorRT-LLM',
    vramMb: 1150,
    assignedDroneCodes: ['UAV-KL-05', 'UAV-KL-06'],
    fpsAverage: 42.0,
    latencyMs: 9.8,
    rollbackTarget: 'v2.3.8-edge',
  },
  {
    id: 'mod-3',
    name: 'RT-DETRv2',
    task: 'detection (candidate)',
    version: 'v2.0.0-rc3',
    modality: 'RGB',
    licence: 'Apache-2.0',
    status: 'CANDIDATE',
    state: 'STOPPED',
    framework: 'PaddleDetection / TensorRT',
    vramMb: 2850,
    assignedDroneCodes: [],
    fpsAverage: 36.5,
    latencyMs: 12.1,
  },
  {
    id: 'mod-4',
    name: 'RTMDet-Thermal (sensor-specific)',
    task: 'detection',
    version: 'v1.8.0-lwir',
    modality: 'THERMAL',
    licence: 'Apache-2.0',
    status: 'ACTIVE',
    state: 'ACTIVE',
    framework: 'OpenMMLab / TensorRT 10.2',
    vramMb: 2400,
    assignedDroneCodes: ['UAV-KL-01', 'UAV-KL-03'],
    fpsAverage: 29.1,
    latencyMs: 16.4,
    rollbackTarget: 'v1.7.4-lwir',
  },
  {
    id: 'mod-5',
    name: 'ByteTrack',
    task: 'multi-object tracking',
    version: 'v2.1.0',
    modality: 'BOTH',
    licence: 'MIT',
    status: 'ACTIVE',
    state: 'ACTIVE',
    framework: 'C++ CUDA / Cython Plugin',
    vramMb: 850,
    assignedDroneCodes: ['UAV-KL-01', 'UAV-KL-02', 'UAV-KL-03', 'UAV-KL-04', 'UAV-KL-05', 'UAV-KL-06'],
    fpsAverage: 45.0,
    latencyMs: 4.8,
    rollbackTarget: 'v2.0.4',
  },
  {
    id: 'mod-6',
    name: 'Density estimator (crowd)',
    task: 'crowd count',
    version: 'v3.0.1-crowd',
    modality: 'RGB',
    licence: 'Permissive — to be confirmed',
    status: 'ACTIVE',
    state: 'ACTIVE',
    framework: 'PyTorch CUDA 12.4',
    vramMb: 1950,
    assignedDroneCodes: ['UAV-KL-02', 'UAV-KL-06'],
    fpsAverage: 26.5,
    latencyMs: 19.4,
    rollbackTarget: 'v2.9.2-crowd',
  },
  {
    id: 'mod-7',
    name: 'Behaviour/temporal analytics engine (rule + learned)',
    task: 'behaviour',
    version: 'v3.1.2-kerala-context',
    modality: 'BOTH',
    licence: 'Proprietary (QWI)',
    status: 'ACTIVE',
    state: 'ACTIVE',
    framework: 'Rust + LibTorch C++ Engine',
    vramMb: 3100,
    assignedDroneCodes: ['UAV-KL-01', 'UAV-KL-02', 'UAV-KL-03', 'UAV-KL-04'],
    fpsAverage: 38.0,
    latencyMs: 11.2,
    rollbackTarget: 'v3.0.8-kerala-context',
  },
  {
    id: 'mod-8',
    name: 'Cognitive Frame Selector (QWI)',
    task: 'compute optimisation',
    version: 'v2.0.0-cfs',
    modality: 'BOTH',
    licence: 'Proprietary (QWI)',
    status: 'ACTIVE',
    state: 'ACTIVE',
    framework: 'Zero-Copy Optical Flow / CUDA',
    vramMb: 450,
    assignedDroneCodes: ['UAV-KL-01', 'UAV-KL-02', 'UAV-KL-03', 'UAV-KL-04', 'UAV-KL-05', 'UAV-KL-06'],
    fpsAverage: 120.0,
    latencyMs: 1.5,
  },
  {
    id: 'mod-9',
    name: 'Cognitive Keyframe Extractor (QWI)',
    task: 'evidence selection',
    version: 'v2.0.0-ckfe',
    modality: 'BOTH',
    licence: 'Proprietary (QWI)',
    status: 'ACTIVE',
    state: 'ACTIVE',
    framework: 'Post-Event Keyframe Salience Engine',
    vramMb: 600,
    assignedDroneCodes: ['UAV-KL-01', 'UAV-KL-02', 'UAV-KL-03'],
    fpsAverage: 85.0,
    latencyMs: 3.2,
  },
  {
    id: 'mod-10',
    name: 'ANPR OCR (License Plate)',
    task: 'vehicle registration recognition',
    version: 'v2.8-in-anpr',
    modality: 'RGB',
    licence: 'Apache-2.0',
    status: 'ACTIVE',
    state: 'ACTIVE',
    framework: 'PaddleInference / ONNX',
    vramMb: 1450,
    assignedDroneCodes: ['UAV-KL-01', 'UAV-KL-05'],
    fpsAverage: 24.8,
    latencyMs: 22.1,
    isOptionalModule: true,
  },
  {
    id: 'mod-11',
    name: 'Person Re-ID (Appearance Matching)',
    task: 'cross-camera re-identification',
    version: 'v1.4.2-r100',
    modality: 'RGB',
    licence: 'MIT',
    status: 'ACTIVE',
    state: 'ACTIVE',
    framework: 'InsightFace / TensorRT',
    vramMb: 2200,
    assignedDroneCodes: ['UAV-KL-01', 'UAV-KL-02'],
    fpsAverage: 28.2,
    latencyMs: 18.6,
    isOptionalModule: true,
  },
];

// ─── Datasets Data ────────────────────────────────────────────

interface DatasetItem {
  id: string;
  name: string;
  version: string;
  type: string;
  frameCount: number;
  classesCount: number;
  sizeGb: number;
  licenceOrProvenance: string;
  authorisingOfficer: string;
  retentionSchedule: string;
  hashSha256: string;
  modality: 'RGB' | 'THERMAL' | 'MULTIMODAL';
  status: 'VERIFIED_BASELINE' | 'ACTIVE_TRAINING' | 'MINING_SET' | 'ARCHIVED';
}

const INITIAL_DATASETS: DatasetItem[] = [
  {
    id: 'DS-01',
    name: 'Public Coastal Baseline',
    version: 'KB-BASE-2025.1',
    type: 'Public Benchmark + Sea Surface',
    frameCount: 24500,
    classesCount: 8,
    sizeGb: 14.2,
    licenceOrProvenance: 'OpenMaritime / CC-BY-4.0 (Pre-training baseline)',
    authorisingOfficer: 'DIG Coastal Police (Auth ref: KP/CD/2025/104)',
    retentionSchedule: 'Permanent Reference Baseline',
    hashSha256: '9f83c18b7625a6b0c2a8f331908d81e3a19b22a014a09101d782163158c54321',
    modality: 'RGB',
    status: 'VERIFIED_BASELINE',
  },
  {
    id: 'DS-02',
    name: 'Kerala-Authorised Coastal Footage',
    version: 'KL-AUTH-2026.1',
    type: 'Operational High-Resolution Surveillance',
    frameCount: 42000,
    classesCount: 14,
    sizeGb: 38.6,
    licenceOrProvenance: 'Kerala Police Cyber Division — Thiruvananthapuram & Kochi Shoreline',
    authorisingOfficer: 'SP Cyber Division (Auth ref: KP/DFL/2026/089)',
    retentionSchedule: '10 Years Statutory Section 65B Custody',
    hashSha256: 'a14092b7c625a8e0f1d3e4b5a6c7891234567890abcdef0123456789abcdef01',
    modality: 'RGB',
    status: 'ACTIVE_TRAINING',
  },
  {
    id: 'DS-03',
    name: 'Difficult-Example Hard-Negative Mining Set',
    version: 'KL-MINE-DIFF-2026.2',
    type: 'Clutter / Heavy Surf / Sun Glint / Rain Artifacts',
    frameCount: 9800,
    classesCount: 11,
    sizeGb: 8.4,
    licenceOrProvenance: 'Curated from false-positive operator flags & monsoon sorties',
    authorisingOfficer: 'DySP Drone Forensic Lab (Auth ref: KP/DFL/MINE/2026)',
    retentionSchedule: '5 Years Active Maintenance',
    hashSha256: 'e89c10f4325a76b0c1e8f231908d81e3a19b22a014a09101d782163158c99102',
    modality: 'RGB',
    status: 'MINING_SET',
  },
  {
    id: 'DS-04',
    name: 'Coastal Thermal LWIR Benchmark',
    version: 'KL-LWIR-THERMAL-2026.1',
    type: 'Long-Wave Infrared Night Surveillance',
    frameCount: 14200,
    classesCount: 7,
    sizeGb: 11.5,
    licenceOrProvenance: 'FLIR Tau 2 sensor recording — Vizhinjam & Kollam coastal belt',
    authorisingOfficer: 'IG Coastal Security (Auth ref: KP/CS/LWIR/2026/012)',
    retentionSchedule: '7 Years Statutory Custody',
    hashSha256: '7b204e18b7625a6b0c2a8f331908d81e3a19b22a014a09101d782163158c3344',
    modality: 'THERMAL',
    status: 'ACTIVE_TRAINING',
  },
];

// ─── Taxonomy Classes ─────────────────────────────────────────

interface TaxonomyClass {
  id: string;
  name: string;
  broadCategory: 'VESSEL' | 'PERSON' | 'VEHICLE' | 'OBJECT';
  keralaContextNotes: string;
  minSamplesRequired: number;
  trainingSamplesCount: number;
  ap50Score: number;
  requiresGovSignOff: boolean;
  status: 'CERTIFIED' | 'PROVISIONAL' | 'AWAITING_GOV_APPROVAL';
}

const INITIAL_TAXONOMY: TaxonomyClass[] = [
  { id: 'tax-1', name: 'Mechanised Trawler', broadCategory: 'VESSEL', keralaContextNotes: 'Steel/wooden trawler >15m, deep water trawl gear, inboard marine diesel.', minSamplesRequired: 2000, trainingSamplesCount: 3420, ap50Score: 92.4, requiresGovSignOff: true, status: 'CERTIFIED' },
  { id: 'tax-2', name: 'Motorised Country Craft', broadCategory: 'VESSEL', keralaContextNotes: 'FRP plywood craft with outboard motor (OBM 9.9–25 HP), nearshore artisanal.', minSamplesRequired: 2000, trainingSamplesCount: 2890, ap50Score: 84.6, requiresGovSignOff: true, status: 'CERTIFIED' },
  { id: 'tax-3', name: 'Traditional Wooden Craft', broadCategory: 'VESSEL', keralaContextNotes: 'Plank-built canoe / kettuvallam, non-mechanised or low-power propulsion.', minSamplesRequired: 1500, trainingSamplesCount: 1640, ap50Score: 78.9, requiresGovSignOff: false, status: 'CERTIFIED' },
  { id: 'tax-4', name: 'Catamaran / Canoe', broadCategory: 'VESSEL', keralaContextNotes: 'Log catamaran or small paddle canoe, low freeboard, surf launch capable.', minSamplesRequired: 1500, trainingSamplesCount: 1210, ap50Score: 71.3, requiresGovSignOff: false, status: 'CERTIFIED' },
  { id: 'tax-5', name: 'Coastal Patrol Interceptor', broadCategory: 'VESSEL', keralaContextNotes: 'Coastal Police Fast Patrol Craft, twin Yamaha 250HP outboards, law enforcement.', minSamplesRequired: 1000, trainingSamplesCount: 980, ap50Score: 94.2, requiresGovSignOff: true, status: 'CERTIFIED' },
  { id: 'tax-6', name: 'Recreational Craft / Water-Sports', broadCategory: 'VESSEL', keralaContextNotes: 'Tourist speedboats, jet skis, banana boats operating near Kovalam/Varkala beaches.', minSamplesRequired: 1000, trainingSamplesCount: 890, ap50Score: 81.5, requiresGovSignOff: false, status: 'CERTIFIED' },
  { id: 'tax-7', name: 'Unknown / Broad Vessel', broadCategory: 'VESSEL', keralaContextNotes: 'Weak-evidence maritime contact below fine-grained classification threshold.', minSamplesRequired: 500, trainingSamplesCount: 4200, ap50Score: 88.0, requiresGovSignOff: false, status: 'CERTIFIED' },
  { id: 'tax-8', name: 'Shoreline Pedestrian / Walker', broadCategory: 'PERSON', keralaContextNotes: 'Individual person walking on sandy foreshore or coastal promenade.', minSamplesRequired: 2000, trainingSamplesCount: 3100, ap50Score: 88.7, requiresGovSignOff: false, status: 'CERTIFIED' },
  { id: 'tax-9', name: 'Bather / Swimmer in Surf', broadCategory: 'PERSON', keralaContextNotes: 'Partially submerged individual in high-risk surf or restricted bathing area.', minSamplesRequired: 1500, trainingSamplesCount: 1420, ap50Score: 74.8, requiresGovSignOff: false, status: 'CERTIFIED' },
  { id: 'tax-10', name: 'Crowd Assembly / Shore Gathering', broadCategory: 'PERSON', keralaContextNotes: 'High-density clustering on beach (>15 persons in 20m radius) near harbour fish landing.', minSamplesRequired: 1000, trainingSamplesCount: 1150, ap50Score: 83.2, requiresGovSignOff: false, status: 'CERTIFIED' },
  { id: 'tax-11', name: 'Coastal Patrol Vehicle', broadCategory: 'VEHICLE', keralaContextNotes: 'Police Mahindra Bolero / 4x4 Quick Response Vehicle along coastal access tracks.', minSamplesRequired: 1000, trainingSamplesCount: 1300, ap50Score: 95.1, requiresGovSignOff: true, status: 'CERTIFIED' },
  { id: 'tax-12', name: 'Beach ATV / Quad Bike', broadCategory: 'VEHICLE', keralaContextNotes: 'Tourist and lifeguard all-terrain quad vehicle on beach sand.', minSamplesRequired: 800, trainingSamplesCount: 620, ap50Score: 82.0, requiresGovSignOff: false, status: 'PROVISIONAL' },
  { id: 'tax-13', name: 'Abandoned Luggage / Package', broadCategory: 'OBJECT', keralaContextNotes: 'Stationary unattended bag or box on sand/jetty exceeding 300s dwell limit.', minSamplesRequired: 1500, trainingSamplesCount: 1250, ap50Score: 83.1, requiresGovSignOff: true, status: 'CERTIFIED' },
  { id: 'tax-14', name: 'Marine Flotsam / Floating Hazard', broadCategory: 'OBJECT', keralaContextNotes: 'Drifting log, derelict netting or floating buoy hazardous to navigation.', minSamplesRequired: 1000, trainingSamplesCount: 780, ap50Score: 79.4, requiresGovSignOff: false, status: 'CERTIFIED' },
];

// ─── Training Runs Record ─────────────────────────────────────

interface TrainingRun {
  id: string;
  modelTarget: string;
  datasetVersion: string;
  hyperparameters: string;
  epochs: number;
  finalLoss: number;
  mAP50: number;
  dateIst: string;
  approvedBy: string;
  status: 'COMPLETED' | 'VALIDATING' | 'REJECTED' | 'SCHEDULED_PENDING_POLICE_SIGN_OFF';
}

const INITIAL_TRAINING_RUNS: TrainingRun[] = [
  {
    id: 'TR-2026-04',
    modelTarget: 'RTMDet-L (MMDetection) v2.4.1',
    datasetVersion: 'KL-AUTH-2026.1 + KL-MINE-DIFF-2026.2',
    hyperparameters: 'lr=0.001, batch=32, cosine_annealing, AdamW, mosaic=0.8',
    epochs: 80,
    finalLoss: 0.142,
    mAP50: 82.5,
    dateIst: '12-Oct-2026 18:40 IST',
    approvedBy: 'SP Cyber Division (PEN: 418290) & Model Custodian',
    status: 'COMPLETED',
  },
  {
    id: 'TR-2026-03',
    modelTarget: 'RTMDet-Thermal v1.8.0-lwir',
    datasetVersion: 'KL-LWIR-THERMAL-2026.1',
    hyperparameters: 'lr=0.0005, batch=16, thermal_contrast_norm=true',
    epochs: 60,
    finalLoss: 0.188,
    mAP50: 76.4,
    dateIst: '04-Oct-2026 14:15 IST',
    approvedBy: 'DySP Drone Forensic Lab (PEN: 554312) & Model Custodian',
    status: 'COMPLETED',
  },
  {
    id: 'TR-2026-02',
    modelTarget: 'ByteTrack v2.1.0 (Kalman Surf Filter)',
    datasetVersion: 'KL-AUTH-2026.1 (Occlusion Benchmark)',
    hyperparameters: 'track_thresh=0.45, match_thresh=0.7, max_time_lost=45',
    epochs: 40,
    finalLoss: 0.082,
    mAP50: 89.2,
    dateIst: '22-Sep-2026 11:30 IST',
    approvedBy: 'Model Custodian (QWI Engineering Lead)',
    status: 'COMPLETED',
  },
  {
    id: 'TR-2026-05',
    modelTarget: 'RT-DETRv2 Candidate Evaluation',
    datasetVersion: 'KB-BASE-2025.1 + KL-AUTH-2026.1',
    hyperparameters: 'lr=0.0002, batch=16, transformer_decoder_depth=6',
    epochs: 100,
    finalLoss: 0.119,
    mAP50: 84.1,
    dateIst: '15-Oct-2026 09:10 IST',
    approvedBy: 'Awaiting SP Cyber Division Formal Sign-Off',
    status: 'VALIDATING',
  },
];

// ─── Feedback Queue Items ─────────────────────────────────────

interface FeedbackItem {
  id: string;
  incidentCode: string;
  flaggedBy: string;
  timestampIst: string;
  originalClass: string;
  operatorSuggestion: string;
  droneFeed: string;
  confidenceAtFlag: number;
  reasonNotes: string;
  curationStatus: 'AWAITING_REVIEW' | 'ACCEPTED_INTO_MINING_SET' | 'DISMISSED';
}

const INITIAL_FEEDBACK: FeedbackItem[] = [
  {
    id: 'FB-801',
    incidentCode: 'INC-20261016-0042',
    flaggedBy: 'Cdr. Rajan Pillai (Coastal Police)',
    timestampIst: '16-Oct-2026 11:22:15 IST',
    originalClass: 'ABANDONED_OBJECT',
    operatorSuggestion: 'TRADITIONAL_WOODEN_CRAFT_ACCESSORY',
    droneFeed: 'UAV-KL-02 (Vypin)',
    confidenceAtFlag: 0.81,
    reasonNotes: 'Coir rope bundle and fishing net basket on sand misclassified as unattended package.',
    curationStatus: 'AWAITING_REVIEW',
  },
  {
    id: 'FB-802',
    incidentCode: 'INC-20261016-0038',
    flaggedBy: 'ASI Suresh Kumar (Cyber Cell)',
    timestampIst: '16-Oct-2026 08:45:00 IST',
    originalClass: 'VESSEL (UNKNOWN)',
    operatorSuggestion: 'CATAMARAN_CANOE',
    droneFeed: 'UAV-KL-01 (Vizhinjam)',
    confidenceAtFlag: 0.68,
    reasonNotes: 'Single fisherman in log catamaran paddle-boarding past breaker zone in heavy sea state 3.',
    curationStatus: 'AWAITING_REVIEW',
  },
  {
    id: 'FB-803',
    incidentCode: 'INC-20261015-0104',
    flaggedBy: 'SI Manoj K. (Kochi Marine Station)',
    timestampIst: '15-Oct-2026 22:18:30 IST',
    originalClass: 'INTRUSION_DETECTED',
    operatorSuggestion: 'FALSE_ALERT_WAKE_GLINT',
    droneFeed: 'UAV-KL-03 (Thermal LWIR)',
    confidenceAtFlag: 0.72,
    reasonNotes: 'Warm water outlet wake plume from coastal factory triggered false thermal vessel signature.',
    curationStatus: 'ACCEPTED_INTO_MINING_SET',
  },
  {
    id: 'FB-804',
    incidentCode: 'INC-20261014-0089',
    flaggedBy: 'HC Bindu K. (Drone Forensic Lab)',
    timestampIst: '14-Oct-2026 16:30:12 IST',
    originalClass: 'CROWD_ASSEMBLY',
    operatorSuggestion: 'TOURIST_BEACH_GATHERING',
    droneFeed: 'UAV-KL-04 (Kovalam)',
    confidenceAtFlag: 0.84,
    reasonNotes: 'Standard beach tourism cluster within safe leisure hours. Threshold appropriately calibrated.',
    curationStatus: 'DISMISSED',
  },
];

type ActiveTab = 'registry' | 'datasets' | 'taxonomy' | 'training' | 'evaluation' | 'deployment' | 'feedback';

export default function AIModelsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('registry');
  const [models, setModels] = useState(INITIAL_MODELS);
  const [datasets] = useState<DatasetItem[]>(INITIAL_DATASETS);
  const [taxonomy, setTaxonomy] = useState<TaxonomyClass[]>(INITIAL_TAXONOMY);
  const [trainingRuns, setTrainingRuns] = useState<TrainingRun[]>(INITIAL_TRAINING_RUNS);
  const [feedbackQueue, setFeedbackQueue] = useState<FeedbackItem[]>(INITIAL_FEEDBACK);

  // Notifications / Feedback modal states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isScheduleRunOpen, setIsScheduleRunOpen] = useState(false);
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [selectedModelForRollback, setSelectedModelForRollback] = useState<typeof INITIAL_MODELS[0] | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');

  // Add Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassCategory, setNewClassCategory] = useState<'VESSEL' | 'PERSON' | 'VEHICLE' | 'OBJECT'>('VESSEL');
  const [newClassSamples, setNewClassSamples] = useState(1500);
  const [newClassNotes, setNewClassNotes] = useState('');
  const [newClassGovApproval, setNewClassGovApproval] = useState(true);

  // Schedule Run Form State
  const [runModelTarget, setRunModelTarget] = useState('RTMDet-L (MMDetection)');
  const [runDataset, setRunDataset] = useState('KL-AUTH-2026.1 + KL-MINE-DIFF-2026.2');
  const [runOfficerPEN, setRunOfficerPEN] = useState('');
  const [runOfficerName, setRunOfficerName] = useState('');
  const [runRationale, setRunRationale] = useState('');

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  }

  // Hot-swap drone feeds
  function toggleModelDrone(modelId: string, droneCode: string) {
    setModels(models.map(m => {
      if (m.id !== modelId) return m;
      const assigned = m.assignedDroneCodes.includes(droneCode)
        ? m.assignedDroneCodes.filter(c => c !== droneCode)
        : [...m.assignedDroneCodes, droneCode];
      return { ...m, assignedDroneCodes: assigned };
    }));
    showToast(`Updated drone feed allocation for model`);
  }

  // Model state change
  function handleHotSwap(modelId: string, action: 'START' | 'STOP' | 'RESTART') {
    setModels(models.map(m => {
      if (m.id !== modelId) return m;
      if (action === 'START') return { ...m, state: 'ACTIVE', status: 'ACTIVE' };
      if (action === 'STOP') return { ...m, state: 'STOPPED', status: 'STOPPED' };
      return { ...m, state: 'ACTIVE', status: 'ACTIVE' };
    }));
    showToast(`Model ${action} executed successfully. Zero dropped frames.`);
  }

  // Execute Rollback
  async function confirmRollback() {
    if (!selectedModelForRollback) return;
    const model = selectedModelForRollback;
    const oldVersion = model.version;
    const targetVersion = model.rollbackTarget || 'v2.3.9-coastal';

    setModels(models.map(m => {
      if (m.id !== model.id) return m;
      return {
        ...m,
        version: targetVersion,
        status: 'ACTIVE',
        state: 'ACTIVE',
      };
    }));

    // Record audit event
    await auditApi.append({
      userId: user?.username || 'officer',
      userName: user?.fullName || 'Kerala Police Officer',
      userRole: 'SYS_ADMIN',
      action: 'AI_MODEL_ROLLBACK_EXECUTED',
      targetType: 'MODEL',
      targetId: model.name,
      outcome: 'SUCCESS',
      beforeAfterSummary: `Rollback executed: ${model.name} rolled back from ${oldVersion} to ${targetVersion}. Rationale: "${rollbackReason || 'Operational stability restoration'}".`,
    });

    setIsRollbackModalOpen(false);
    setSelectedModelForRollback(null);
    setRollbackReason('');
    showToast(`Rollback complete: ${model.name} restored to ${targetVersion}`);
  }

  // Propose New Taxonomy Class
  async function handleAddClassSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newClass: TaxonomyClass = {
      id: `tax-${Date.now()}`,
      name: newClassName.trim(),
      broadCategory: newClassCategory,
      keralaContextNotes: newClassNotes || 'Proposed fine-grained maritime class.',
      minSamplesRequired: newClassSamples,
      trainingSamplesCount: 0,
      ap50Score: 0.0,
      requiresGovSignOff: newClassGovApproval,
      status: 'AWAITING_GOV_APPROVAL',
    };

    setTaxonomy([...taxonomy, newClass]);

    await auditApi.append({
      userId: user?.username || 'officer',
      userName: user?.fullName || 'Kerala Police Officer',
      userRole: 'SYS_ADMIN',
      action: 'TAXONOMY_CLASS_PROPOSED',
      targetType: 'TAXONOMY',
      targetId: newClass.name,
      outcome: 'SUCCESS',
      beforeAfterSummary: `New class proposed: "${newClass.name}" under category ${newClass.broadCategory}. Requires Police Authority sign-off.`,
    });

    setIsAddClassOpen(false);
    setNewClassName('');
    setNewClassNotes('');
    showToast(`Taxonomy class "${newClass.name}" submitted for Kerala Police Cyber Division sign-off.`);
  }

  // Schedule Training Run
  async function handleScheduleRunSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!runOfficerPEN.trim() || !runOfficerName.trim()) {
      showToast('Error: Police Authority Name and PEN are mandatory.');
      return;
    }

    const newRun: TrainingRun = {
      id: `TR-2026-${String(trainingRuns.length + 1).padStart(2, '0')}`,
      modelTarget: runModelTarget,
      datasetVersion: runDataset,
      hyperparameters: 'lr=0.001, batch=32, cosine_decay, AdamW',
      epochs: 80,
      finalLoss: 0.0,
      mAP50: 0.0,
      dateIst: 'Scheduled (Awaiting Compute Allocation)',
      approvedBy: `${runOfficerName.trim()} (PEN: ${runOfficerPEN.trim()}) & Model Custodian`,
      status: 'SCHEDULED_PENDING_POLICE_SIGN_OFF',
    };

    setTrainingRuns([newRun, ...trainingRuns]);

    await auditApi.append({
      userId: user?.username || 'officer',
      userName: user?.fullName || 'Kerala Police Officer',
      userRole: 'SYS_ADMIN',
      action: 'TRAINING_RUN_AUTHORISED',
      targetType: 'TRAINING_PIPELINE',
      targetId: newRun.id,
      outcome: 'SUCCESS',
      beforeAfterSummary: `Offline training run scheduled: ${newRun.id} (${newRun.modelTarget}) authorised by ${newRun.approvedBy}. Rationale: "${runRationale}".`,
    });

    setIsScheduleRunOpen(false);
    setRunOfficerPEN('');
    setRunOfficerName('');
    setRunRationale('');
    showToast(`Training run ${newRun.id} logged and queued for offline GPU execution.`);
  }

  // Feedback action
  async function handleFeedbackAction(id: string, action: 'ACCEPTED_INTO_MINING_SET' | 'DISMISSED') {
    setFeedbackQueue(feedbackQueue.map(item => {
      if (item.id !== id) return item;
      return { ...item, curationStatus: action };
    }));

    await auditApi.append({
      userId: user?.username || 'officer',
      userName: user?.fullName || 'Kerala Police Officer',
      userRole: 'SYS_ADMIN',
      action: `FEEDBACK_CURATED_${action}`,
      targetType: 'FEEDBACK_QUEUE',
      targetId: id,
      outcome: 'SUCCESS',
      beforeAfterSummary: `Curated operator flag ${id} status set to ${action}. Disclaimed: Does not modify deployed models automatically.`,
    });

    showToast(`Feedback item ${id} updated to ${action.replace(/_/g, ' ')}`);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold bg-emerald-900 text-emerald-100 border border-emerald-500/50 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold">AI Models & Dataset Governance</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--sea-600)]/15 text-[var(--sea-600)] border border-[var(--sea-600)]/30">
                RFP §11 · Proposal 5.1.29
              </span>
            </div>
            <p className="text-xs opacity-70">
              License-conscious model registry, Kerala maritime datasets, taxonomy trees, training runs, evaluation metrics & feedback curation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-xs font-mono font-semibold text-[var(--sea-600)]">Active Stack: OpenMMLab / RT-DETR / ByteTrack</div>
            <div className="text-[10px] opacity-60 font-mono">100% Permissive (Apache-2.0 / MIT / QWI) · Zero AGPL Copyleft</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-6 pt-3 border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        {(
          [
            ['registry', 'Model Registry', Cpu],
            ['datasets', 'Coastal Datasets', Database],
            ['taxonomy', 'Classes & Taxonomy', GitBranch],
            ['training', 'Training Runs', Activity],
            ['evaluation', 'Evaluation & Benchmark', Sliders],
            ['deployment', 'Deployment & Rollback', ArrowLeftRight],
            ['feedback', 'Feedback Queue', AlertOctagon],
          ] as const
        ).map(([tabKey, tabLabel, Icon]) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer',
              activeTab === tabKey
                ? 'border-[var(--sea-600)] text-[var(--sea-600)] bg-[var(--surface)] font-bold'
                : 'border-transparent opacity-70 hover:opacity-100 hover:bg-[var(--surface)]/50'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{tabLabel}</span>
            {tabKey === 'feedback' && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                {feedbackQueue.filter(f => f.curationStatus === 'AWAITING_REVIEW').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content Container ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ══════════════════════════════════════════════════════════
            TAB 1: MODEL REGISTRY
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'registry' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                  <span>Registered Models</span>
                  <Cpu className="w-4 h-4 text-[var(--sea-600)]" />
                </div>
                <div className="text-2xl font-bold font-serif">{models.length}</div>
                <div className="text-[11px] font-mono text-emerald-600 mt-1">9 Active in Production</div>
              </div>

              <div className="p-4 rounded-xl border bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                  <span>Licensing Compliance</span>
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-serif text-emerald-600">100%</div>
                <div className="text-[11px] opacity-70 mt-1">Apache-2.0 / MIT / Proprietary</div>
              </div>

              <div className="p-4 rounded-xl border bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                  <span>Compute Allocation</span>
                  <HardDrive className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold font-serif">
                  {(models.filter(m => m.state === 'ACTIVE').reduce((acc, m) => acc + m.vramMb, 0) / 1024).toFixed(1)} GB
                </div>
                <div className="text-[11px] opacity-70 mt-1">Allocated across Central GPU Nodes</div>
              </div>

              <div className="p-4 rounded-xl border bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                  <span>Average Ingest Latency</span>
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold font-serif font-mono">11.8 ms</div>
                <div className="text-[11px] opacity-70 mt-1">Well below 40 ms real-time ceiling</div>
              </div>
            </div>

            {/* Model Registry Table */}
            <div className="rounded-xl border overflow-hidden bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[var(--sea-600)]" />
                  <h2 className="text-sm font-bold">Approved Coastal Intelligence Frameworks</h2>
                </div>
                <div className="text-xs opacity-60 font-mono">Click drone tag to hot-assign feed</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b uppercase font-mono text-[10px] tracking-wider opacity-60" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                    <tr>
                      <th className="py-3 px-4">Model & Task</th>
                      <th className="py-3 px-3">Modality</th>
                      <th className="py-3 px-3">Licence</th>
                      <th className="py-3 px-3">Version & Rollback</th>
                      <th className="py-3 px-3">Compute & FPS</th>
                      <th className="py-3 px-3">Assigned Feeds</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
                    {models.map(m => (
                      <tr key={m.id} className="hover:bg-[var(--surface)]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{m.name}</span>
                            {m.isOptionalModule && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                Optional Module
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] opacity-70">{m.task}</div>
                          <div className="text-[10px] font-mono opacity-50 mt-0.5">{m.framework}</div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
                              m.modality === 'RGB' && 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                              m.modality === 'THERMAL' && 'bg-orange-500/10 text-orange-600 border-orange-500/30',
                              m.modality === 'BOTH' && 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                            )}
                          >
                            {m.modality}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-mono text-[11px] font-semibold">{m.licence}</span>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-mono text-xs font-bold">{m.version}</div>
                          {m.rollbackTarget && (
                            <div className="text-[10px] font-mono opacity-60">Rollback: {m.rollbackTarget}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-mono text-xs">{m.fpsAverage} FPS · {m.latencyMs} ms</div>
                          <div className="text-[10px] opacity-60">{m.vramMb} MB VRAM</div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                            {UAVS.map(u => {
                              const isAssigned = m.assignedDroneCodes.includes(u.droneCode);
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => toggleModelDrone(m.id, u.droneCode)}
                                  className={cn(
                                    'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer',
                                    isAssigned
                                      ? 'bg-[var(--sea-600)] text-white border-[var(--sea-600)]'
                                      : 'bg-[var(--surface)] border-[var(--line)] opacity-40 hover:opacity-80'
                                  )}
                                  title={`Toggle ${m.name} assignment to ${u.droneCode}`}
                                >
                                  {u.droneCode.replace('UAV-KL-', 'KL-')}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border inline-flex items-center gap-1',
                              m.status === 'ACTIVE' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                              m.status === 'CANDIDATE' && 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
                              m.status === 'STANDBY' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse',
                              m.status === 'STOPPED' && 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30'
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', m.status === 'ACTIVE' ? 'bg-emerald-500' : m.status === 'CANDIDATE' ? 'bg-indigo-500' : 'bg-gray-400')} />
                            {m.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {m.state !== 'ACTIVE' ? (
                              <button
                                onClick={() => handleHotSwap(m.id, 'START')}
                                className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                              >
                                <Play className="w-3 h-3 inline fill-white mr-1" /> Start
                              </button>
                            ) : (
                              <button
                                onClick={() => handleHotSwap(m.id, 'STOP')}
                                className="px-2.5 py-1 rounded text-xs font-bold bg-gray-600 text-white hover:bg-gray-700 transition-colors cursor-pointer"
                              >
                                <Square className="w-3 h-3 inline fill-white mr-1" /> Stop
                              </button>
                            )}
                            <button
                              onClick={() => handleHotSwap(m.id, 'RESTART')}
                              className="p-1.5 rounded border hover:bg-[var(--surface)] transition-colors opacity-70 hover:opacity-100 cursor-pointer"
                              title="Hot-Swap / Reload Model Pipeline"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: COASTAL DATASETS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'datasets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-serif">Kerala Coastal Surveillance Training Datasets</h2>
                <p className="text-xs opacity-70">
                  Versioned drone imagery repositories with statutory Section 65B authorisations and SHA-256 seal.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[var(--surface)] border" style={{ borderColor: 'var(--line)' }}>
                Total Curated Frames: 90,500
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datasets.map(ds => (
                <div key={ds.id} className="p-5 rounded-xl border bg-[var(--panel)] space-y-3" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{ds.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--surface)] border" style={{ borderColor: 'var(--line)' }}>
                          {ds.version}
                        </span>
                      </div>
                      <div className="text-xs opacity-70 mt-0.5">{ds.type}</div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border',
                        ds.status === 'ACTIVE_TRAINING' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                        ds.status === 'VERIFIED_BASELINE' && 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                        ds.status === 'MINING_SET' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      )}
                    >
                      {ds.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs py-2 border-y" style={{ borderColor: 'var(--line)' }}>
                    <div>
                      <div className="opacity-60 text-[10px]">FRAMES</div>
                      <div className="font-mono font-bold">{ds.frameCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="opacity-60 text-[10px]">CLASSES</div>
                      <div className="font-mono font-bold">{ds.classesCount} Categories</div>
                    </div>
                    <div>
                      <div className="opacity-60 text-[10px]">STORAGE</div>
                      <div className="font-mono font-bold">{ds.sizeGb} GB</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div>
                      <span className="opacity-60 font-semibold">Provenance: </span>
                      <span>{ds.licenceOrProvenance}</span>
                    </div>
                    <div>
                      <span className="opacity-60 font-semibold">Authorising Officer: </span>
                      <span className="font-medium text-[var(--sea-600)]">{ds.authorisingOfficer}</span>
                    </div>
                    <div>
                      <span className="opacity-60 font-semibold">Retention: </span>
                      <span className="font-mono">{ds.retentionSchedule}</span>
                    </div>
                    <div className="pt-1">
                      <span className="opacity-60 font-semibold font-mono text-[10px]">SHA-256 SEAL: </span>
                      <span className="font-mono text-[10px] opacity-80 break-all">{ds.hashSha256}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3: CLASSES & TAXONOMY
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'taxonomy' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-serif">Kerala Coastal Object & Craft Taxonomy</h2>
                <p className="text-xs opacity-70">
                  Hierarchical classification rules. Weak evidence defaults to broad class UNKNOWN_VESSEL.
                </p>
              </div>
              <button
                onClick={() => setIsAddClassOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--sea-600)] text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Propose New Class
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['VESSEL', 'PERSON', 'VEHICLE', 'OBJECT'] as const).map(cat => {
                const classItems = taxonomy.filter(t => t.broadCategory === cat);
                return (
                  <div key={cat} className="p-4 rounded-xl border bg-[var(--panel)] space-y-3" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--sea-600)] border" style={{ borderColor: 'var(--line)' }}>
                          {cat}
                        </span>
                        <span className="text-xs font-bold">{classItems.length} Defined Classes</span>
                      </div>
                    </div>

                    <div className="divide-y space-y-2" style={{ borderColor: 'var(--line)' }}>
                      {classItems.map(item => (
                        <div key={item.id} className="pt-2 flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold">{item.name}</span>
                              <span
                                className={cn(
                                  'px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border',
                                  item.status === 'CERTIFIED' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                                  item.status === 'PROVISIONAL' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
                                  item.status === 'AWAITING_GOV_APPROVAL' && 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                )}
                              >
                                {item.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-[11px] opacity-70 leading-relaxed">{item.keralaContextNotes}</p>
                            <div className="text-[10px] font-mono opacity-50">
                              Samples: {item.trainingSamplesCount} / {item.minSamplesRequired} min req · AP50: {item.ap50Score}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 4: TRAINING RUNS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'training' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-serif">Offline AI Training Runs (Audit Log Only)</h2>
                <p className="text-xs opacity-70">
                  Model training is performed strictly offline on air-gapped forensic compute clusters with dual police sign-off.
                </p>
              </div>
              <button
                onClick={() => setIsScheduleRunOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--sea-600)] text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Request Training Run
              </button>
            </div>

            <div className="rounded-xl border overflow-hidden bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
              <table className="w-full text-xs text-left">
                <thead className="border-b uppercase font-mono text-[10px] tracking-wider opacity-60" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                  <tr>
                    <th className="py-3 px-4">Run ID & Architecture</th>
                    <th className="py-3 px-3">Dataset Version</th>
                    <th className="py-3 px-3">Hyperparameters</th>
                    <th className="py-3 px-3">Epochs & Loss</th>
                    <th className="py-3 px-3">Validation mAP50</th>
                    <th className="py-3 px-3">Police Authority Approval</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
                  {trainingRuns.map(run => (
                    <tr key={run.id} className="hover:bg-[var(--surface)]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-sm text-[var(--sea-600)]">{run.id}</div>
                        <div className="font-medium text-xs">{run.modelTarget}</div>
                        <div className="text-[10px] opacity-60 font-mono">{run.dateIst}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">{run.datasetVersion}</td>
                      <td className="py-3 px-3 font-mono text-[11px] opacity-80 max-w-xs truncate" title={run.hyperparameters}>
                        {run.hyperparameters}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">
                        {run.epochs} ep · Loss {run.finalLoss}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs font-bold text-emerald-600">
                        {run.mAP50 > 0 ? `${run.mAP50}%` : 'Pending'}
                      </td>
                      <td className="py-3 px-3 text-xs">
                        <div className="font-medium">{run.approvedBy}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border inline-flex items-center gap-1',
                            run.status === 'COMPLETED' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                            run.status === 'VALIDATING' && 'bg-blue-500/10 text-blue-600 border-blue-500/30 animate-pulse',
                            run.status === 'SCHEDULED_PENDING_POLICE_SIGN_OFF' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          )}
                        >
                          {run.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 5: EVALUATION & BENCHMARKS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'evaluation' && (
          <div className="space-y-6">
            {/* Mandatory Disclaimer Alert */}
            <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <span className="font-bold">Evaluation Governance Notice (Rule 6 Compliance): </span>
                Metrics shown below are <span className="font-semibold underline">Reference / Simulated until validated on authorized Kerala Police coastal data</span>.
                Field deployment benchmarks must be calibrated on approved drone hardware under monsoon and summer coastal conditions.
              </div>
            </div>

            {/* AP by Size Bucket */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border bg-[var(--panel)] space-y-2" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between text-xs opacity-70">
                  <span>Small-Object AP50 (&lt; 32 px)</span>
                  <span className="font-mono text-[10px]">Long-range Maritime</span>
                </div>
                <div className="text-3xl font-bold font-serif text-[var(--sea-600)]">64.2%</div>
                <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--sea-600)] h-full" style={{ width: '64.2%' }} />
                </div>
                <p className="text-[11px] opacity-70">Critical for detecting unmotorised canoes and distant fishing vessels at 100m AGL.</p>
              </div>

              <div className="p-4 rounded-xl border bg-[var(--panel)] space-y-2" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between text-xs opacity-70">
                  <span>Medium-Object AP50 (32–96 px)</span>
                  <span className="font-mono text-[10px]">Nearshore Craft</span>
                </div>
                <div className="text-3xl font-bold font-serif text-emerald-600">82.5%</div>
                <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full" style={{ width: '82.5%' }} />
                </div>
                <p className="text-[11px] opacity-70">High fidelity on motorised country craft and shoreline beach assemblies.</p>
              </div>

              <div className="p-4 rounded-xl border bg-[var(--panel)] space-y-2" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between text-xs opacity-70">
                  <span>Large-Object AP50 (&gt; 96 px)</span>
                  <span className="font-mono text-[10px]">Deep-water Trawlers</span>
                </div>
                <div className="text-3xl font-bold font-serif text-indigo-600">91.8%</div>
                <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full" style={{ width: '91.8%' }} />
                </div>
                <p className="text-[11px] opacity-70">Reliable vessel classification and hull registration identification.</p>
              </div>
            </div>

            {/* Per-Class Precision & Recall Table */}
            <div className="rounded-xl border overflow-hidden bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                <h3 className="text-sm font-bold">Per-Class Precision, Recall & False-Alert Rate</h3>
                <span className="text-xs font-mono opacity-70">Operational False-Alert Rate: 0.18 alerts / flight hour</span>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="border-b uppercase font-mono text-[10px] tracking-wider opacity-60" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                  <tr>
                    <th className="py-2.5 px-4">Kerala Class Category</th>
                    <th className="py-2.5 px-3">Precision</th>
                    <th className="py-2.5 px-3">Recall</th>
                    <th className="py-2.5 px-3">F1-Score</th>
                    <th className="py-2.5 px-3">False Alert Rate</th>
                    <th className="py-2.5 px-4">Validation Modality</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
                  {[
                    { name: 'Mechanised Trawler', p: '92.4%', r: '89.1%', f1: '0.907', far: '0.04 / hr', mod: 'RGB + Thermal' },
                    { name: 'Motorised Country Craft', p: '84.6%', r: '81.2%', f1: '0.829', far: '0.08 / hr', mod: 'RGB + Thermal' },
                    { name: 'Traditional Wooden Craft', p: '78.9%', r: '74.5%', f1: '0.766', far: '0.12 / hr', mod: 'RGB' },
                    { name: 'Catamaran / Canoe', p: '71.3%', r: '68.8%', f1: '0.700', far: '0.16 / hr', mod: 'RGB' },
                    { name: 'Shoreline Pedestrian', p: '88.7%', r: '85.3%', f1: '0.870', far: '0.05 / hr', mod: 'RGB' },
                    { name: 'Abandoned Luggage', p: '83.1%', r: '79.6%', f1: '0.813', far: '0.09 / hr', mod: 'RGB' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-[var(--surface)]/50">
                      <td className="py-2.5 px-4 font-semibold">{row.name}</td>
                      <td className="py-2.5 px-3 font-mono">{row.p}</td>
                      <td className="py-2.5 px-3 font-mono">{row.r}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{row.f1}</td>
                      <td className="py-2.5 px-3 font-mono opacity-70">{row.far}</td>
                      <td className="py-2.5 px-4 font-mono text-[10px]">{row.mod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 6: DEPLOYMENT PIPELINE & ROLLBACK
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'deployment' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border bg-[var(--panel)] space-y-4" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-serif">Staged Model Rollout Lifecycle</h3>
                  <p className="text-xs opacity-70">Promote candidate weights to production across edge and central GPU nodes.</p>
                </div>
                <button
                  onClick={() => {
                    const activeModel = models.find(m => m.id === 'mod-1');
                    if (activeModel) {
                      setSelectedModelForRollback(activeModel);
                      setIsRollbackModalOpen(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> One-Click Model Rollback
                </button>
              </div>

              {/* 5-Stage Stepper */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                {[
                  { step: '1', title: 'Candidate Weights', desc: 'RT-DETRv2 v2.0.0-rc3', status: 'COMPLETE' },
                  { step: '2', title: 'Offline Validation', desc: 'mAP > 80% on KL-AUTH', status: 'COMPLETE' },
                  { step: '3', title: 'Police Authority Sign-Off', desc: 'SP Cyber Division Gate', status: 'PENDING' },
                  { step: '4', title: 'Staged Rollout (10%)', desc: 'UAV-KL-05 Canary Feed', status: 'WAITING' },
                  { step: '5', title: 'Active Production', desc: 'Fleet-wide Deployment', status: 'WAITING' },
                ].map(s => (
                  <div
                    key={s.step}
                    className={cn(
                      'p-3 rounded-lg border text-xs space-y-1',
                      s.status === 'COMPLETE' && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200',
                      s.status === 'PENDING' && 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200 font-bold',
                      s.status === 'WAITING' && 'bg-[var(--surface)] opacity-50 border-[var(--line)]'
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span>STEP {s.step}</span>
                      <span>{s.status}</span>
                    </div>
                    <div className="font-semibold text-xs">{s.title}</div>
                    <div className="text-[10px] opacity-70">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-Feed Hot-Swap Matrix */}
            <div className="p-4 rounded-xl border bg-[var(--panel)] space-y-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Per-Feed Model Assignment (Zero Dropped Frames)</h3>
                  <p className="text-xs opacity-70">Dynamically bind detector and tracker profiles per active UAV sortie.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {UAVS.map(u => (
                  <div key={u.id} className="p-3.5 rounded-lg border bg-[var(--surface)] space-y-2" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-[var(--sea-600)]" />
                        <span className="font-mono font-bold text-xs">{u.droneCode}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600">
                        {u.isActive ? 'LIVE RTSP' : 'STANDBY'}
                      </span>
                    </div>
                    <div className="text-xs">
                      <div className="opacity-60 text-[10px]">ACTIVE DETECTOR PROFILE</div>
                      <div className="font-semibold font-mono text-[11px] truncate">
                        {u.droneCode === 'UAV-KL-05' || u.droneCode === 'UAV-KL-06'
                          ? 'RTMDet-S (Edge Profile)'
                          : 'RTMDet-L (Central GPU)'}
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="opacity-60 text-[10px]">TRACKER / SCHEDULER</div>
                      <div className="font-mono text-[11px]">ByteTrack v2.1.0 + CFS v2.0</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 7: FEEDBACK QUEUE
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* Mandatory Banner per Rule 8 & RFP §11 */}
            <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-900 dark:text-red-200">
                <span className="font-bold">Human-in-the-Loop AI Feedback Governance (RFP §11 & Master Rule 8): </span>
                <span className="font-semibold underline">Feedback never modifies deployed models automatically.</span>
                All operator false-positive and false-negative submissions are routed to this forensic queue for manual verification, ground-truth annotation by Cyber Division personnel, and scheduled regression testing before integration into future dataset releases.
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden bg-[var(--panel)]" style={{ borderColor: 'var(--line)' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                <h3 className="text-sm font-bold">Operator False-Positive & Misclassification Submissions</h3>
                <span className="text-xs opacity-60 font-mono">
                  {feedbackQueue.length} items logged from Incident Dossiers
                </span>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {feedbackQueue.map(item => (
                  <div key={item.id} className="p-4 hover:bg-[var(--surface)]/50 transition-colors space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[var(--sea-600)]">{item.id}</span>
                          <span className="text-xs font-semibold">{item.incidentCode}</span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-[var(--surface)] border" style={{ borderColor: 'var(--line)' }}>
                            {item.droneFeed}
                          </span>
                        </div>
                        <div className="text-xs opacity-70 mt-0.5">
                          Flagged by <span className="font-medium">{item.flaggedBy}</span> at {item.timestampIst}
                        </div>
                      </div>

                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border',
                          item.curationStatus === 'AWAITING_REVIEW' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
                          item.curationStatus === 'ACCEPTED_INTO_MINING_SET' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                          item.curationStatus === 'DISMISSED' && 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30'
                        )}
                      >
                        {item.curationStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[var(--surface)]/60 p-2.5 rounded-lg">
                      <div>
                        <span className="opacity-60 text-[10px] block font-mono">ORIGINAL AI CLASSIFICATION</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{item.originalClass}</span>
                        <span className="text-[10px] opacity-60 ml-1">({(item.confidenceAtFlag * 100).toFixed(0)}% conf)</span>
                      </div>
                      <div>
                        <span className="opacity-60 text-[10px] block font-mono">OPERATOR CORRECTION SUGGESTION</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.operatorSuggestion}</span>
                      </div>
                    </div>

                    <p className="text-xs opacity-80 italic">&ldquo;{item.reasonNotes}&rdquo;</p>

                    {item.curationStatus === 'AWAITING_REVIEW' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleFeedbackAction(item.id, 'ACCEPTED_INTO_MINING_SET')}
                          className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 inline mr-1" /> Accept into Hard-Negative Mining Set
                        </button>
                        <button
                          onClick={() => handleFeedbackAction(item.id, 'DISMISSED')}
                          className="px-2.5 py-1 rounded text-xs font-bold border hover:bg-[var(--surface)] transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 inline mr-1" /> Dismiss Flag
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Propose New Class Modal ── */}
      {isAddClassOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border bg-[var(--raised)] text-[var(--text)] p-5 space-y-4 shadow-2xl" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[var(--sea-600)] dark:text-[var(--sea-accent)]" />
                <h3 className="font-bold text-sm">Propose New Taxonomy Class</h3>
              </div>
              <button onClick={() => setIsAddClassOpen(false)} className="opacity-60 hover:opacity-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddClassSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block opacity-70 mb-1 font-semibold" style={{ color: 'var(--text-muted)' }}>Class Name (e.g. Jet-Ski, Dugout Canoe)</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="e.g. Mechanised Gillnetter"
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text)] font-medium outline-none focus:ring-1 focus:ring-[var(--sea-600)]"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div>
                <label className="block opacity-70 mb-1 font-semibold" style={{ color: 'var(--text-muted)' }}>Broad Parent Category</label>
                <select
                  value={newClassCategory}
                  onChange={e => setNewClassCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text)] font-medium outline-none"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <option value="VESSEL">VESSEL (Maritime Craft)</option>
                  <option value="PERSON">PERSON (Shore Activity)</option>
                  <option value="VEHICLE">VEHICLE (Coastal Road / Sand)</option>
                  <option value="OBJECT">OBJECT (Shore / Sea Hazard)</option>
                </select>
              </div>

              <div>
                <label className="block opacity-70 mb-1 font-semibold" style={{ color: 'var(--text-muted)' }}>Minimum Required Training Samples</label>
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={newClassSamples}
                  onChange={e => setNewClassSamples(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text)] font-mono outline-none"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div>
                <label className="block opacity-70 mb-1 font-semibold" style={{ color: 'var(--text-muted)' }}>Kerala Context &amp; Recognition Notes</label>
                <textarea
                  rows={2}
                  value={newClassNotes}
                  onChange={e => setNewClassNotes(e.target.value)}
                  placeholder="Visual traits, hull shape, typical operational zone in Kerala..."
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text)] outline-none"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="govApproval"
                  checked={newClassGovApproval}
                  onChange={e => setNewClassGovApproval(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="govApproval" className="text-[11px] opacity-80 cursor-pointer" style={{ color: 'var(--text)' }}>
                  Requires Cyber Division / Drone Forensic Lab Gazette sign-off
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
                <button
                  type="button"
                  onClick={() => setIsAddClassOpen(false)}
                  className="px-3 py-1.5 rounded-lg border hover:bg-[var(--surface)] cursor-pointer"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)', background: 'var(--surface)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-bold bg-[var(--sea-600)] text-white hover:opacity-90 cursor-pointer"
                >
                  Submit for Sign-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Request Training Run Modal ── */}
      {isScheduleRunOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border bg-[var(--raised)] text-[var(--text)] p-5 space-y-4 shadow-2xl" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--sea-600)] dark:text-[var(--sea-accent)]" />
                <h3 className="font-bold text-sm">Schedule Air-Gapped Training Run</h3>
              </div>
              <button onClick={() => setIsScheduleRunOpen(false)} className="opacity-60 hover:opacity-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleRunSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block opacity-70 mb-1 font-semibold" style={{ color: 'var(--text-muted)' }}>Target Architecture</label>
                <select
                  value={runModelTarget}
                  onChange={e => setRunModelTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text)] outline-none"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <option value="RTMDet-L (MMDetection)">RTMDet-L (MMDetection) - Central GPU Profile</option>
                  <option value="RTMDet-S (MMDetection)">RTMDet-S (MMDetection) - Edge Laptop Profile</option>
                  <option value="RTMDet-Thermal LWIR">RTMDet-Thermal LWIR - Sensor-Specific Night Vision</option>
                  <option value="RT-DETRv2 Transformer">RT-DETRv2 Transformer - High Precision Candidate</option>
                </select>
              </div>

              <div>
                <label className="block opacity-70 mb-1 font-semibold" style={{ color: 'var(--text-muted)' }}>Dataset Version</label>
                <select
                  value={runDataset}
                  onChange={e => setRunDataset(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text)] outline-none"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <option value="KL-AUTH-2026.1 + KL-MINE-DIFF-2026.2">KL-AUTH-2026.1 + KL-MINE-DIFF-2026.2 (51,800 frames)</option>
                  <option value="KL-LWIR-THERMAL-2026.1">KL-LWIR-THERMAL-2026.1 (14,200 frames)</option>
                  <option value="KB-BASE-2025.1">KB-BASE-2025.1 Baseline (24,500 frames)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block opacity-70 mb-1 font-semibold" style={{ color: 'var(--text-muted)' }}>Authorising Officer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SP Cyber Division"
                    value={runOfficerName}
                    onChange={e => setRunOfficerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text)] outline-none"
                    style={{ borderColor: 'var(--line)' }}
                  />
                </div>
                <div>
                  <label className="block opacity-70 mb-1 font-semibold" style={{ color: 'var(--text-muted)' }}>Officer PEN Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PEN: 418290"
                    value={runOfficerPEN}
                    onChange={e => setRunOfficerPEN(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text)] font-mono outline-none"
                    style={{ borderColor: 'var(--line)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block opacity-70 mb-1 font-semibold" style={{ color: 'var(--text-muted)' }}>Operational Rationale</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Reason for training run, e.g. monsoon sea clutter adaptation..."
                  value={runRationale}
                  onChange={e => setRunRationale(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text)] outline-none"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
                <button
                  type="button"
                  onClick={() => setIsScheduleRunOpen(false)}
                  className="px-3 py-1.5 rounded-lg border hover:bg-[var(--surface)] cursor-pointer"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)', background: 'var(--surface)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-bold bg-[var(--sea-600)] text-white hover:opacity-90 cursor-pointer"
                >
                  Authorise &amp; Queue Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Model Rollback Modal ── */}
      {isRollbackModalOpen && selectedModelForRollback && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border bg-[var(--raised)] text-[var(--text)] p-5 space-y-4 shadow-2xl" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm">Confirm Production Rollback</h3>
              </div>
              <button onClick={() => setIsRollbackModalOpen(false)} className="opacity-60 hover:opacity-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="opacity-80">
                You are rolling back <span className="font-bold">{selectedModelForRollback.name}</span> from{' '}
                <span className="font-mono font-bold text-red-600">{selectedModelForRollback.version}</span> to previous validated release{' '}
                <span className="font-mono font-bold text-emerald-600">{selectedModelForRollback.rollbackTarget || 'v2.3.9-coastal'}</span>.
              </p>

              <div>
                <label className="block opacity-70 mb-1 font-semibold" style={{ color: 'var(--text-muted)' }}>Mandatory Audit Justification</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Operational reason for rollback..."
                  value={rollbackReason}
                  onChange={e => setRollbackReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text)] outline-none"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
                <button
                  type="button"
                  onClick={() => setIsRollbackModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border hover:bg-[var(--surface)] cursor-pointer"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)', background: 'var(--surface)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRollback}
                  className="px-4 py-1.5 rounded-lg font-bold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
                >
                  Execute Immediate Rollback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
