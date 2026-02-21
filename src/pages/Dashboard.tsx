import { Package, Truck, CheckCircle, RotateCcw, AlertTriangle, QrCode, Shield, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '@/components/StatsCard';
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<any[]>([]);
  
  
  

  type Product = {
  id: string;
  name: string;
  created_at?: string;
};


const [products, setProducts] = useState<Product[]>([]);
  const RouteTimeline = ({ steps }: any) => {
  return (
    <div className="border rounded-lg p-4 space-y-4 mt-3">
      <h4 className="font-semibold">Route Journey</h4>

      <div className="border-l-2 border-gray-300 pl-4 space-y-4">
        {steps.map((step: any) => (
          <div key={step.id} className="space-y-1">
            <p className="font-medium">
              {step.level} → {step.city}
            </p>

            <p className="text-xs text-muted-foreground">
              Step #{step.order_number}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
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
    .select("id,name,created_at");

  if (!error) setProducts(data || []);
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

  {products.map((product: Product) => (
    <div key={product.id} className="border p-3 rounded">
      <p>{product.name}</p>
      <button
        onClick={async () => {
        const { data } = await supabase
          .from("product_items")
          .select("id")
          .eq("product_id", product.id)

          if (!data && data.length === 0) {
          alert("No items found for this product");
          return;
        }
        navigate(`/entities/${data[0].id}`);

}}
      className="bg-blue-500 text-white px-3 py-1 rounded mt-2"
>
 View Items
</button>
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

  </div>
);
}
