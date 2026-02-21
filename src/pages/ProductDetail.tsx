import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/StatusBadge';
import RouteTimeline from '@/components/RouteTimeline';
import RouteEditor from '@/components/RouteEditor';
import ActivityLog from '@/components/ActivityLog';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
  if (id) {
    fetchProduct();
    fetchRoutes();
  }
}, [id]);

async function fetchProduct() {
  if (!id) return;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(error);
  } else {
    setProduct(data);
  }
}

async function fetchRoutes() {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('product_id', id)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error(error);
  } else {
    setRoutes(data || []);
  }

  setLoading(false);
}


if (loading) return <p>Loading...</p>;
if (!product) return <p>Product not found</p>;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/products" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-xl font-semibold text-foreground">{product.name}</h1>
              <StatusBadge status={product.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {product.id} · Route v{product.route_version} · Created {product.created_at}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="timeline">Route Timeline</TabsTrigger>
          <TabsTrigger value="editor">Route Editor</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <div className="max-w-md rounded-xl border border-border bg-card p-6">
            <div className="space-y-3">
  {routes.map(r => (
    <div key={r.id} className="rounded-lg border p-4">
      <p className="font-medium">{r.location}</p>
      <p className="text-sm text-muted-foreground">
        {new Date(r.timestamp).toLocaleString()}
      </p>
      {r.note && <p className="text-sm mt-1">{r.note}</p>}
    </div>
  ))}

  {routes.length === 0 && (
    <p className="text-muted-foreground">No route updates yet.</p>
  )}
</div>
          </div>
        </TabsContent>

        <TabsContent value="editor">
          <div className="max-w-lg rounded-xl border border-border bg-card p-6">
            <p className="text-muted-foreground">Route editing coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="max-w-lg">
            <p className="text-muted-foreground">No activity yet.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
