import { Package, Truck, CheckCircle, RotateCcw, AlertTriangle, QrCode, Shield, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '@/components/StatsCard';
import { products, recentActivities, stateDistributionData, rerouteFrequencyData } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const stats = [
  { label: 'Total Products', value: products.length, icon: Package, variant: 'default' as const, trend: '+3 this week' },
  { label: 'In Transit', value: products.filter(p => !['Customer'].includes(p.currentState)).length, icon: Truck, variant: 'primary' as const, trend: '6 active routes' },
  { label: 'Delivered', value: products.filter(p => p.currentState === 'Customer').length, icon: CheckCircle, variant: 'success' as const, trend: '100% on schedule' },
  { label: 'Rerouted', value: products.filter(p => p.status === 'Rerouted').length, icon: RotateCcw, variant: 'primary' as const, trend: 'Admin overrides' },
  { label: 'Flagged', value: products.filter(p => p.status === 'Flagged').length, icon: AlertTriangle, variant: 'warning' as const, trend: 'Requires attention' },
];

const activityTypeIcons = {
  scan: QrCode,
  override: Shield,
  reroute: RotateCcw,
  system: Info,
};

const activityTypeColors = {
  scan: 'text-success',
  override: 'text-warning',
  reroute: 'text-primary',
  system: 'text-muted-foreground',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{payload[0].value}</p>
    </div>
  );
};

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [selectedRole, setSelectedRole] = useState({})
useEffect(() => {
  fetchEmployees();
}, []);

async function fetchEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*");
    

  if (!error) {
    setEmployees(data);
  }
}
async function updateRole(id: string, role: string) {
  const { error } = await supabase
    .from("employees")
    .update({ role: role })
    .eq("id", id);

  if (error) {
    console.log(error);
    alert(error.message);
  }
  fetchEmployees(); 
}
async function grantAccess(id: string) {
  await supabase
    .from("employees")
    .update({ can_scan: true })
    .eq("id", id);

  fetchEmployees();
}

async function revokeAccess(id: string) {
  await supabase
    .from("employees")
    .update({ can_scan: false })
    .eq("id", id);

  fetchEmployees();
}
  return (
  <div className="space-y-8">

    {/* 🔵 ADMIN PANEL */}
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Admin Panel</h1>

      {employees.map((emp: any) => (
        <div key={emp.id} className="border p-4 rounded-lg">
          <p>{emp.name} - {emp.level}</p>
          {emp.can_scan ? (
  <button
    onClick={() => revokeAccess(emp.id)}
    className="bg-red-500 text-white px-3 py-1 rounded"
  >
    Revoke Access
  </button>
) : (
<>
  <input
    type="text"
    placeholder="Enter role (admin/editor/etc)"
    className="bg-black border px-3 py-1 mr-2 rounded"
    value={selectedRole[emp.id] || ""}
    onChange={(e) =>
      setSelectedRole({
        ...selectedRole,
        [emp.id]: e.target.value,
      })
    }
  />

  {/* SAVE ROLE */}
  <button
    onClick={() => updateRole(emp.id, selectedRole[emp.id])}
    className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
  >
    Save Role
  </button>

  {/* ENABLE QR */}
  <button
    onClick={() => grantAccess(emp.id)}
    className="bg-green-500 text-white px-3 py-1 rounded"
  >
    Enable QR
  </button>
</>
)}

        </div>
      ))}
    </div>

    {/* 🔵 ORIGINAL DASHBOARD CONTENT */}
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Supply chain overview and real-time tracking
      </p>
    </div>

    {/* Stats Grid */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map(s => (
        <StatsCard key={s.label} {...s} />
      ))}
    </div>

    {/* Charts + Activity */}
    {/* (Rest of your existing chart/activity code yahin rehne do) */}

  </div>
);
}
