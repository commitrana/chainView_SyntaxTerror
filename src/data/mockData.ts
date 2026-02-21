export type SupplyChainLevel = 'Factory' | 'Quality Check' | 'Warehouse' | 'Distributor' | 'Retailer' | 'Customer';

export type ProductStatus = 'Active' | 'Rerouted' | 'Flagged';

export type StepStatus = 'completed' | 'current' | 'pending' | 'skipped';

export interface RouteStep {
  level: SupplyChainLevel;
  status: StepStatus;
  timestamp?: string;
  scannedBy?: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  timestamp: string;
  actor: string;
  type: 'scan' | 'override' | 'reroute' | 'system';
}

export interface Product {
  id: string;
  name: string;
  currentState: SupplyChainLevel;
  routeVersion: number;
  status: ProductStatus;
  route: RouteStep[];
  activityLog: ActivityEntry[];
  createdAt: string;
}

export interface Entity {
  id: string;
  name: string;
  type: 'Factory' | 'Retailer' | 'Warehouse' | 'Distributor';
  acceptanceRate: number;
  rejectionRate: number;
  avgProcessingTime: string;
  location: string;
  productsHandled: number;
}

export const DEFAULT_ROUTE: SupplyChainLevel[] = [
  'Factory', 'Quality Check', 'Warehouse', 'Distributor', 'Retailer', 'Customer'
];

export const products: Product[] = [
  {
    id: 'PRD-001', name: 'Industrial Sensor Module', currentState: 'Warehouse', routeVersion: 1, status: 'Active',
    route: [
      { level: 'Factory', status: 'completed', timestamp: '2024-01-15 09:00', scannedBy: 'Op-101' },
      { level: 'Quality Check', status: 'completed', timestamp: '2024-01-15 14:30', scannedBy: 'QC-203' },
      { level: 'Warehouse', status: 'current', timestamp: '2024-01-16 08:00', scannedBy: 'WH-045' },
      { level: 'Distributor', status: 'pending' },
      { level: 'Retailer', status: 'pending' },
      { level: 'Customer', status: 'pending' },
    ],
    activityLog: [
      { id: '1', action: 'Product registered in system', timestamp: '2024-01-15 08:45', actor: 'System', type: 'system' },
      { id: '2', action: 'Scanned at Factory', timestamp: '2024-01-15 09:00', actor: 'Op-101', type: 'scan' },
      { id: '3', action: 'Passed Quality Check', timestamp: '2024-01-15 14:30', actor: 'QC-203', type: 'scan' },
      { id: '4', action: 'Received at Warehouse', timestamp: '2024-01-16 08:00', actor: 'WH-045', type: 'scan' },
    ],
    createdAt: '2024-01-15',
  },
  {
    id: 'PRD-002', name: 'Precision Valve Assembly', currentState: 'Distributor', routeVersion: 2, status: 'Rerouted',
    route: [
      { level: 'Factory', status: 'completed', timestamp: '2024-01-10 10:15', scannedBy: 'Op-088' },
      { level: 'Quality Check', status: 'completed', timestamp: '2024-01-10 16:00', scannedBy: 'QC-115' },
      { level: 'Warehouse', status: 'completed', timestamp: '2024-01-11 07:30', scannedBy: 'WH-022' },
      { level: 'Distributor', status: 'current', timestamp: '2024-01-12 09:00', scannedBy: 'DS-007' },
      { level: 'Retailer', status: 'pending' },
      { level: 'Customer', status: 'pending' },
    ],
    activityLog: [
      { id: '1', action: 'Product registered', timestamp: '2024-01-10 09:50', actor: 'System', type: 'system' },
      { id: '2', action: 'Scanned at Factory', timestamp: '2024-01-10 10:15', actor: 'Op-088', type: 'scan' },
      { id: '3', action: 'Passed Quality Check', timestamp: '2024-01-10 16:00', actor: 'QC-115', type: 'scan' },
      { id: '4', action: 'Route modified by Admin', timestamp: '2024-01-11 06:00', actor: 'Admin-01', type: 'reroute' },
      { id: '5', action: 'Received at Warehouse', timestamp: '2024-01-11 07:30', actor: 'WH-022', type: 'scan' },
      { id: '6', action: 'Shipped to Distributor', timestamp: '2024-01-12 09:00', actor: 'DS-007', type: 'scan' },
    ],
    createdAt: '2024-01-10',
  },
  {
    id: 'PRD-003', name: 'Hydraulic Pump Unit', currentState: 'Quality Check', routeVersion: 1, status: 'Flagged',
    route: [
      { level: 'Factory', status: 'completed', timestamp: '2024-01-18 11:00', scannedBy: 'Op-055' },
      { level: 'Quality Check', status: 'skipped' },
      { level: 'Warehouse', status: 'current', timestamp: '2024-01-19 08:00', scannedBy: 'WH-033' },
      { level: 'Distributor', status: 'pending' },
      { level: 'Retailer', status: 'pending' },
      { level: 'Customer', status: 'pending' },
    ],
    activityLog: [
      { id: '1', action: 'Product registered', timestamp: '2024-01-18 10:30', actor: 'System', type: 'system' },
      { id: '2', action: 'Scanned at Factory', timestamp: '2024-01-18 11:00', actor: 'Op-055', type: 'scan' },
      { id: '3', action: 'Quality Check SKIPPED — flagged', timestamp: '2024-01-19 08:00', actor: 'System', type: 'system' },
      { id: '4', action: 'Received at Warehouse (out of sequence)', timestamp: '2024-01-19 08:00', actor: 'WH-033', type: 'scan' },
    ],
    createdAt: '2024-01-18',
  },
  {
    id: 'PRD-004', name: 'Titanium Gear Set', currentState: 'Customer', routeVersion: 1, status: 'Active',
    route: [
      { level: 'Factory', status: 'completed', timestamp: '2024-01-05 08:00', scannedBy: 'Op-012' },
      { level: 'Quality Check', status: 'completed', timestamp: '2024-01-05 13:00', scannedBy: 'QC-077' },
      { level: 'Warehouse', status: 'completed', timestamp: '2024-01-06 09:00', scannedBy: 'WH-011' },
      { level: 'Distributor', status: 'completed', timestamp: '2024-01-07 10:00', scannedBy: 'DS-003' },
      { level: 'Retailer', status: 'completed', timestamp: '2024-01-08 14:00', scannedBy: 'RT-019' },
      { level: 'Customer', status: 'completed', timestamp: '2024-01-09 11:00', scannedBy: 'CU-441' },
    ],
    activityLog: [
      { id: '1', action: 'Product registered', timestamp: '2024-01-05 07:30', actor: 'System', type: 'system' },
      { id: '2', action: 'Full route completed', timestamp: '2024-01-09 11:00', actor: 'System', type: 'system' },
    ],
    createdAt: '2024-01-05',
  },
  {
    id: 'PRD-005', name: 'Carbon Fiber Panel', currentState: 'Factory', routeVersion: 1, status: 'Active',
    route: [
      { level: 'Factory', status: 'current', timestamp: '2024-01-20 07:00', scannedBy: 'Op-200' },
      { level: 'Quality Check', status: 'pending' },
      { level: 'Warehouse', status: 'pending' },
      { level: 'Distributor', status: 'pending' },
      { level: 'Retailer', status: 'pending' },
      { level: 'Customer', status: 'pending' },
    ],
    activityLog: [
      { id: '1', action: 'Product registered', timestamp: '2024-01-20 06:45', actor: 'System', type: 'system' },
      { id: '2', action: 'Scanned at Factory', timestamp: '2024-01-20 07:00', actor: 'Op-200', type: 'scan' },
    ],
    createdAt: '2024-01-20',
  },
  {
    id: 'PRD-006', name: 'Servo Motor Controller', currentState: 'Retailer', routeVersion: 3, status: 'Rerouted',
    route: [
      { level: 'Factory', status: 'completed', timestamp: '2024-01-02 09:00', scannedBy: 'Op-033' },
      { level: 'Quality Check', status: 'completed', timestamp: '2024-01-02 15:00', scannedBy: 'QC-044' },
      { level: 'Distributor', status: 'completed', timestamp: '2024-01-03 10:00', scannedBy: 'DS-012' },
      { level: 'Retailer', status: 'current', timestamp: '2024-01-04 12:00', scannedBy: 'RT-008' },
      { level: 'Customer', status: 'pending' },
    ],
    activityLog: [
      { id: '1', action: 'Product registered', timestamp: '2024-01-02 08:30', actor: 'System', type: 'system' },
      { id: '2', action: 'Route modified — Warehouse bypassed', timestamp: '2024-01-03 06:00', actor: 'Admin-02', type: 'reroute' },
      { id: '3', action: 'Route version updated to v3', timestamp: '2024-01-03 06:00', actor: 'Admin-02', type: 'override' },
    ],
    createdAt: '2024-01-02',
  },
  {
    id: 'PRD-007', name: 'Stainless Steel Coupling', currentState: 'Distributor', routeVersion: 1, status: 'Flagged',
    route: [
      { level: 'Factory', status: 'completed', timestamp: '2024-01-12 08:30', scannedBy: 'Op-077' },
      { level: 'Quality Check', status: 'skipped' },
      { level: 'Warehouse', status: 'skipped' },
      { level: 'Distributor', status: 'current', timestamp: '2024-01-14 10:00', scannedBy: 'DS-021' },
      { level: 'Retailer', status: 'pending' },
      { level: 'Customer', status: 'pending' },
    ],
    activityLog: [
      { id: '1', action: 'Product registered', timestamp: '2024-01-12 08:00', actor: 'System', type: 'system' },
      { id: '2', action: 'Scanned at Factory', timestamp: '2024-01-12 08:30', actor: 'Op-077', type: 'scan' },
      { id: '3', action: 'ALERT: 2 checkpoints skipped', timestamp: '2024-01-14 10:00', actor: 'System', type: 'system' },
      { id: '4', action: 'Received at Distributor (out of sequence)', timestamp: '2024-01-14 10:00', actor: 'DS-021', type: 'scan' },
    ],
    createdAt: '2024-01-12',
  },
  {
    id: 'PRD-008', name: 'Optical Lens Array', currentState: 'Customer', routeVersion: 1, status: 'Active',
    route: [
      { level: 'Factory', status: 'completed', timestamp: '2024-01-01 10:00', scannedBy: 'Op-005' },
      { level: 'Quality Check', status: 'completed', timestamp: '2024-01-01 16:00', scannedBy: 'QC-009' },
      { level: 'Warehouse', status: 'completed', timestamp: '2024-01-02 08:00', scannedBy: 'WH-007' },
      { level: 'Distributor', status: 'completed', timestamp: '2024-01-03 09:00', scannedBy: 'DS-001' },
      { level: 'Retailer', status: 'completed', timestamp: '2024-01-04 14:00', scannedBy: 'RT-003' },
      { level: 'Customer', status: 'completed', timestamp: '2024-01-05 10:00', scannedBy: 'CU-220' },
    ],
    activityLog: [
      { id: '1', action: 'Product registered', timestamp: '2024-01-01 09:30', actor: 'System', type: 'system' },
      { id: '2', action: 'Full route completed', timestamp: '2024-01-05 10:00', actor: 'System', type: 'system' },
    ],
    createdAt: '2024-01-01',
  },
  {
    id: 'PRD-009', name: 'Thermal Insulation Board', currentState: 'Warehouse', routeVersion: 2, status: 'Rerouted',
    route: [
      { level: 'Factory', status: 'completed', timestamp: '2024-01-16 07:00', scannedBy: 'Op-140' },
      { level: 'Warehouse', status: 'current', timestamp: '2024-01-17 09:00', scannedBy: 'WH-060' },
      { level: 'Distributor', status: 'pending' },
      { level: 'Retailer', status: 'pending' },
      { level: 'Customer', status: 'pending' },
    ],
    activityLog: [
      { id: '1', action: 'Product registered', timestamp: '2024-01-16 06:30', actor: 'System', type: 'system' },
      { id: '2', action: 'Route modified — QC bypassed', timestamp: '2024-01-16 12:00', actor: 'Admin-01', type: 'reroute' },
      { id: '3', action: 'Received at Warehouse', timestamp: '2024-01-17 09:00', actor: 'WH-060', type: 'scan' },
    ],
    createdAt: '2024-01-16',
  },
  {
    id: 'PRD-010', name: 'Micro Actuator Unit', currentState: 'Quality Check', routeVersion: 1, status: 'Active',
    route: [
      { level: 'Factory', status: 'completed', timestamp: '2024-01-19 10:00', scannedBy: 'Op-190' },
      { level: 'Quality Check', status: 'current', timestamp: '2024-01-19 15:00', scannedBy: 'QC-300' },
      { level: 'Warehouse', status: 'pending' },
      { level: 'Distributor', status: 'pending' },
      { level: 'Retailer', status: 'pending' },
      { level: 'Customer', status: 'pending' },
    ],
    activityLog: [
      { id: '1', action: 'Product registered', timestamp: '2024-01-19 09:30', actor: 'System', type: 'system' },
      { id: '2', action: 'Scanned at Factory', timestamp: '2024-01-19 10:00', actor: 'Op-190', type: 'scan' },
      { id: '3', action: 'Scanned at Quality Check', timestamp: '2024-01-19 15:00', actor: 'QC-300', type: 'scan' },
    ],
    createdAt: '2024-01-19',
  },
];

export const entities: Entity[] = [
  { id: 'ENT-001', name: 'Apex Manufacturing', type: 'Factory', acceptanceRate: 96.4, rejectionRate: 3.6, avgProcessingTime: '2.1 hrs', location: 'Detroit, MI', productsHandled: 1240 },
  { id: 'ENT-002', name: 'ClearPath Logistics', type: 'Distributor', acceptanceRate: 99.1, rejectionRate: 0.9, avgProcessingTime: '1.4 hrs', location: 'Chicago, IL', productsHandled: 3450 },
  { id: 'ENT-003', name: 'Metro Retail Group', type: 'Retailer', acceptanceRate: 94.8, rejectionRate: 5.2, avgProcessingTime: '0.8 hrs', location: 'New York, NY', productsHandled: 890 },
  { id: 'ENT-004', name: 'Vanguard Assembly', type: 'Factory', acceptanceRate: 97.2, rejectionRate: 2.8, avgProcessingTime: '1.9 hrs', location: 'Austin, TX', productsHandled: 2100 },
  { id: 'ENT-005', name: 'Central Warehouse Co.', type: 'Warehouse', acceptanceRate: 99.5, rejectionRate: 0.5, avgProcessingTime: '0.6 hrs', location: 'Memphis, TN', productsHandled: 5600 },
  { id: 'ENT-006', name: 'QuickShip Distributors', type: 'Distributor', acceptanceRate: 98.3, rejectionRate: 1.7, avgProcessingTime: '1.1 hrs', location: 'Atlanta, GA', productsHandled: 2780 },
  { id: 'ENT-007', name: 'Summit Retail Stores', type: 'Retailer', acceptanceRate: 93.5, rejectionRate: 6.5, avgProcessingTime: '0.9 hrs', location: 'San Francisco, CA', productsHandled: 720 },
  { id: 'ENT-008', name: 'Precision Parts Factory', type: 'Factory', acceptanceRate: 98.8, rejectionRate: 1.2, avgProcessingTime: '2.5 hrs', location: 'Cleveland, OH', productsHandled: 980 },
];

export const recentActivities: ActivityEntry[] = [
  { id: 'ra-1', action: 'PRD-005 scanned at Factory', timestamp: '2 min ago', actor: 'Op-200', type: 'scan' },
  { id: 'ra-2', action: 'PRD-003 flagged — QC skipped', timestamp: '15 min ago', actor: 'System', type: 'system' },
  { id: 'ra-3', action: 'PRD-009 route modified by Admin', timestamp: '1 hr ago', actor: 'Admin-01', type: 'reroute' },
  { id: 'ra-4', action: 'PRD-010 passed Quality Check', timestamp: '2 hrs ago', actor: 'QC-300', type: 'scan' },
  { id: 'ra-5', action: 'PRD-001 received at Warehouse', timestamp: '3 hrs ago', actor: 'WH-045', type: 'scan' },
  { id: 'ra-6', action: 'PRD-007 flagged — 2 checkpoints skipped', timestamp: '5 hrs ago', actor: 'System', type: 'system' },
  { id: 'ra-7', action: 'PRD-006 route version updated to v3', timestamp: '6 hrs ago', actor: 'Admin-02', type: 'override' },
  { id: 'ra-8', action: 'PRD-004 delivered to Customer', timestamp: '8 hrs ago', actor: 'CU-441', type: 'scan' },
];

// Chart data
export const stateDistributionData = [
  { name: 'Factory', count: 1 },
  { name: 'QC', count: 1 },
  { name: 'Warehouse', count: 2 },
  { name: 'Distributor', count: 2 },
  { name: 'Retailer', count: 1 },
  { name: 'Delivered', count: 3 },
];

export const rerouteFrequencyData = [
  { week: 'W1', reroutes: 1 },
  { week: 'W2', reroutes: 3 },
  { week: 'W3', reroutes: 2 },
  { week: 'W4', reroutes: 4 },
  { week: 'W5', reroutes: 1 },
  { week: 'W6', reroutes: 2 },
];
