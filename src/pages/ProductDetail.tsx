import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Plus, ChevronUp, ChevronDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/StatusBadge';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedSteps, setEditedSteps] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [assigningStepIndex, setAssigningStepIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentRouteId, setCurrentRouteId] = useState<string | null>(null);

  function getAvailableEmployees(currentStepId: string) {
    const assignedEmployees = routeSteps
      .filter(step => 
        step.assigned_employee_id && step.id !== currentStepId
      )
      .map(step => step.assigned_employee_id);

    return employees.filter(
      emp => !assignedEmployees.includes(emp.id)
    );
  }
  
  async function fetchEmployees() {
    const { data } = await supabase
      .from("employees")
      .select("id,name,role,location,phone,email");

    setEmployees(data || []);
  }
  
  useEffect(() => {
    if (id) {
      fetchProductDirectly();
      fetchEmployees();
    } else {
      setError("No product ID provided");
      setLoading(false);
    }
  }, [id]);

  async function assignEmployeeToStep(stepId: string, employeeId: string) {
    const { error } = await supabase
      .from("route_steps")
      .update({
        assigned_employee_id: employeeId
      })
      .eq("id", stepId);

    if (!error) {
      await fetchRouteStepsForRoute(currentRouteId!);
      setAssigningStepIndex(null);
    }
  }

  async function fetchProductDirectly() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setError(`Error: ${error.message} (Code: ${error.code})`);
        setLoading(false);
        return;
      }

      if (data) {
        setProduct(data);
        await fetchRoutesForProduct();
      } else {
        setError("No product data returned");
        setLoading(false);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(`Unexpected error: ${err}`);
      setLoading(false);
    }
  }

  async function fetchRoutesForProduct() {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('product_id', id);

    if (error) {
      console.log("Routes error:", error);
      setRoutes([]);
    } else {
      setRoutes(data || []);
      
      if (data && data.length > 0) {
        setCurrentRouteId(data[0].id);
        await fetchRouteStepsForRoute(data[0].id);
      }
    }
    
    setLoading(false);
  }

  async function fetchRouteStepsForRoute(routeId: string) {
    const { data, error } = await supabase
      .from('route_steps')
      .select('*')
      .eq('route_id', routeId)
      .order('order_number');

    if (error) {
      console.log("Route steps error:", error);
      setRouteSteps([]);
      setEditedSteps([]);
    } else {
      setRouteSteps(data || []);
      setEditedSteps(data || []);
    }
  }

  // Edit mode functions
  function handleEditMode() {
    setEditedSteps([...routeSteps]);
    setEditMode(true);
  }

  function handleCancelEdit() {
    setEditedSteps([...routeSteps]);
    setEditMode(false);
  }

  async function handleSaveSteps() {
    if (!currentRouteId) return;
    
    setSaving(true);
    
    try {
      // Update each step with new order numbers and data
      for (let i = 0; i < editedSteps.length; i++) {
        const step = editedSteps[i];
        
        // Check if this is a new step (temporary id)
        if (step.id.toString().startsWith('temp-')) {
          // Insert new step
          const { error } = await supabase
            .from('route_steps')
            .insert([{
              route_id: currentRouteId,
              order_number: i + 1,
              level: step.level,
              city: step.city
            }]);
          if (error) throw error;
        } else {
          // Update existing step
          const { error } = await supabase
            .from('route_steps')
            .update({
              order_number: i + 1,
              level: step.level,
              city: step.city
            })
            .eq('id', step.id);
          if (error) throw error;
        }
      }

      // Refresh data
      await fetchRouteStepsForRoute(currentRouteId);
      setEditMode(false);
    } catch (error) {
      console.error('Error saving steps:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  function handleStepChange(index: number, field: string, value: string) {
    const updated = [...editedSteps];
    updated[index] = { ...updated[index], [field]: value };
    setEditedSteps(updated);
  }

  function handleAddStep() {
    if (!currentRouteId) return;
    
    const newStep = {
      id: `temp-${Date.now()}-${Math.random()}`,
      route_id: currentRouteId,
      order_number: editedSteps.length + 1,
      level: '',
      city: ''
    };
    setEditedSteps([...editedSteps, newStep]);
  }

  function handleRemoveStep(index: number) {
    const updated = editedSteps.filter((_, i) => i !== index);
    // Reorder remaining steps
    const reordered = updated.map((step, idx) => ({
      ...step,
      order_number: idx + 1
    }));
    setEditedSteps(reordered);
  }

  function handleMoveStep(index: number, direction: 'up' | 'down') {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === editedSteps.length - 1)
    ) {
      return;
    }

    const updated = [...editedSteps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap steps
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Update order numbers
    const reordered = updated.map((step, idx) => ({
      ...step,
      order_number: idx + 1
    }));
    
    setEditedSteps(reordered);
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-foreground">Loading product details...</p>
              <p className="mt-2 text-sm text-muted-foreground">Product ID: {id}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-xl font-semibold text-destructive">Error</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Link to="/products" className="mt-6">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-xl font-semibold">Product Not Found</h2>
            <p className="mt-2 text-muted-foreground">The product you're looking for doesn't exist.</p>
            <Link to="/products" className="mt-6">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with back button and title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/products" 
            className="rounded-lg border border-border bg-card p-2 hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">{product.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Product ID: {product.id}</p>
          </div>
        </div>
        {!editMode && routeSteps.length > 0 && (
          <Button onClick={handleEditMode} variant="outline">
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Route Steps
          </Button>
        )}
      </div>

      {/* Product Details Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Product Details</h2>
          <StatusBadge status={product.status} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Product ID</p>
            <p className="font-mono text-sm font-medium">{product.id}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{product.name}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current State</p>
            <p>{product.current_state || 'N/A'}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Route Version</p>
            <p className="font-mono text-sm">v{product.route_version}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Created At</p>
            <p className="text-sm">
              {product.created_at ? new Date(product.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>
          
          {product.updated_at && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm">{new Date(product.updated_at).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* QR Codes Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Product QR Codes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* External QR Code */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">External QR Code</p>
              {product.external_qr_path && (
                <a
                  href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/qr-bucket/${product.external_qr_path}`}
                  download
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Download
                </a>
              )}
            </div>
            
            {product.external_qr_path ? (
              <div className="border rounded-xl p-4 bg-white inline-block">
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/qr-bucket/${product.external_qr_path}`}
                  alt="External QR Code"
                  className="w-48 h-48"
                />
              </div>
            ) : (
              <div className="border rounded-xl p-8 bg-gray-50 text-center">
                <p className="text-sm text-muted-foreground">No external QR code generated</p>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              <p>Type: EXTERNAL - For public scanning</p>
              <p>Contains: Product info, current state, scan tracking</p>
            </div>
          </div>

          {/* Internal QR Code */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Internal QR Code</p>
              {product.internal_qr_path && (
                <a
                  href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/qr-bucket/${product.internal_qr_path}`}
                  download
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Download
                </a>
              )}
            </div>
            
            {product.internal_qr_path ? (
              <div className="border rounded-xl p-4 bg-white inline-block">
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/qr-bucket/${product.internal_qr_path}`}
                  alt="Internal QR Code"
                  className="w-48 h-48"
                />
              </div>
            ) : (
              <div className="border rounded-xl p-8 bg-gray-50 text-center">
                <p className="text-sm text-muted-foreground">No internal QR code generated</p>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              <p>Type: INTERNAL - For internal tracking</p>
              <p>Contains: Claim info, batch details, tracking data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Routes Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Routes</h2>
        
        {routes.length > 0 ? (
          <div className="space-y-3">
            {routes.map(route => (
              <div key={route.id} className="rounded-lg border border-border bg-accent/5 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Route ID</p>
                    <p className="font-mono text-sm">{route.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                    <p className="text-sm">{route.location || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
                    <p className="text-sm">
                      {route.timestamp ? new Date(route.timestamp).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No routes found for this product.</p>
        )}
      </div>
    
      {/* Route Steps Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Route Steps</h2>
          {editMode && (
            <Button onClick={handleAddStep} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-4">
            {editedSteps.map((step, index) => (
              <div
                key={step.id}
                className="relative rounded-lg border border-border bg-accent/5 p-4"
              >
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveStep(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveStep(index, 'down')}
                    disabled={index === editedSteps.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStep(index)}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 pr-24">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Level</p>
                      <Input
                        value={step.level || ""}
                        onChange={(e) =>
                          handleStepChange(index, "level", e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">City</p>
                      <Input
                        value={step.city || ""}
                        onChange={(e) =>
                          handleStepChange(index, "city", e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleSaveSteps} disabled={saving}>
                {saving ? "Saving..." : <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {routeSteps.length > 0 ? (
              routeSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-accent/5 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {step.order_number}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="text-sm font-medium">{step.level}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">City</p>
                      <p className="text-sm">{step.city}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Assign Employee</p>
                      <select
                        className="
                          w-full 
                          rounded-lg 
                          border border-border
                          bg-card
                          px-3 py-2
                          text-sm text-foreground
                          focus:outline-none 
                          focus:ring-2 
                          focus:ring-primary/40
                          transition-all
                        "
                        value={step.assigned_employee_id || ""}
                        onChange={async (e) => {
                          await assignEmployeeToStep(step.id, e.target.value);
                        }}
                      >
                        <option value="">Select Employee</option>
                        {getAvailableEmployees(step.id).map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} - {emp.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                No route steps found
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}