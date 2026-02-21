import { Package, Truck, CheckCircle, RotateCcw, AlertTriangle, QrCode, Shield, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '@/components/StatsCard';

import { cn } from '@/lib/utils';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const stats = [
  { 
    label: 'Total Products', 
    value: products.length, 
    icon: Package, 
    variant: 'default' as const, 
    trend: '+3 this week' 
  },
  { 
    label: 'In Transit', 
    value: 0, 
    icon: Truck, 
    variant: 'primary' as const, 
    trend: 'Active routes' 
  },
  { 
    label: 'Delivered', 
    value: 0, 
    icon: CheckCircle, 
    variant: 'success' as const, 
    trend: 'Completed' 
  },
  { 
    label: 'Rerouted', 
    value: 0, 
    icon: RotateCcw, 
    variant: 'primary' as const, 
    trend: 'Overrides' 
  },
  { 
    label: 'Flagged', 
    value: 0, 
    icon: AlertTriangle, 
    variant: 'warning' as const, 
    trend: 'Attention needed' 
  },
];
  useEffect(() => {
  fetchEmployees();
  fetchProducts();
}, []);

async function fetchEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*");
    

  if (!error) {
    setEmployees(data);
  }
}
async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*");

  if (!error) setProducts(data);
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
async function fetchRoutes(productId: string) {
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("product_id", productId);

  if (!error) setRoutes(data);
}

async function fetchRouteSteps(routeId: string) {
  const { data, error } = await supabase
    .from("route_steps")
    .select("*")
    .eq("route_id", routeId)
    .order("order_number", { ascending: true });

  if (!error) setRouteSteps(data);
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
            <button
              onClick={() => grantAccess(emp.id)}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Grant Access
            </button>
          )}
        </div>
      ))}
    </div>
    {/* 🔵 PRODUCTS LIST */}
<div className="space-y-4">
  <h2 className="text-lg font-semibold">Products</h2>

  {products.map((product: any) => (
    <div key={product.id} className="border p-3 rounded">
      <p>{product.name}</p>
      <button
        onClick={() => {
          setSelectedProduct(product);
          fetchRoutes(product.id);
        }}
        className="bg-blue-500 text-white px-3 py-1 rounded mt-2"
      >
        View Routes
      </button>
    </div>
  ))}
</div>
{routes.length > 0 && (
  <div className="space-y-3">
    <h3 className="text-md font-semibold">Routes</h3>

    {routes.map((route: any) => (
      <div key={route.id} className="border p-3 rounded">
        <p>{route.route_name}</p>
        <button
          onClick={() => {
            setSelectedRoute(route);
            fetchRouteSteps(route.id);
          }}
          className="bg-purple-500 text-white px-3 py-1 rounded mt-2"
        >
          View Steps
        </button>
      </div>
    ))}
  </div>
)}
{routes.length > 0 && (
  <div className="space-y-3">
    <h3 className="text-md font-semibold">Routes</h3>

    {routes.map((route: any) => (
      <div key={route.id} className="border p-3 rounded">
        <p>{route.route_name}</p>
        <button
          onClick={() => {
            setSelectedRoute(route);
            fetchRouteSteps(route.id);
          }}
          className="bg-purple-500 text-white px-3 py-1 rounded mt-2"
        >
          View Steps
        </button>
      </div>
    ))}
  </div>
)}

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
