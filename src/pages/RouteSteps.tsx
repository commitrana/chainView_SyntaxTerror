// pages/RouteSteps.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight,
  Plus,
  Edit2,
  Save,
  X,
  Trash2,
  MapPin,
  ChevronUp,
  ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RouteStep {
  id: string;
  route_id: string;
  level: string | null;
  city: string | null;
  order_number: number | null;
  assigned_employee_id: string | null;
}

interface Route {
  id: string;
  product_id: string;
  timestamp: string | null;
}

interface RouteWithProduct extends Route {
  product_name?: string;
  expanded?: boolean;
}

interface NewRoute {
  product_id: string;
}

export default function RouteSteps() {
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [routes, setRoutes] = useState<Record<string, RouteWithProduct>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);
  
  // State for creating new route
  const [showNewRouteForm, setShowNewRouteForm] = useState(false);
  const [newRoute, setNewRoute] = useState<NewRoute>({
    product_id: ''
  });
  
  // State for editing route
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editingRoute, setEditingRoute] = useState<Partial<Route>>({});
  
  // State for managing steps within a route
  const [editingStepsRouteId, setEditingStepsRouteId] = useState<string | null>(null);
  const [editedSteps, setEditedSteps] = useState<RouteStep[]>([]);
  const [savingSteps, setSavingSteps] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchRouteSteps(),
        fetchProducts()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .order('name');

    if (!error && data) {
      setProducts(data);
    }
  }

  async function fetchRouteSteps() {
    try {
      // Fetch all route steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('route_steps')
        .select('*')
        .order('route_id')
        .order('order_number');

      if (stepsError) throw stepsError;

      setSteps(stepsData || []);

      // Extract unique cities for filter
      if (stepsData && stepsData.length > 0) {
        // Filter out null/undefined cities and ensure they're strings
        const validCities: string[] = stepsData
          .map(step => step.city)
          .filter((city): city is string => city !== null && city !== undefined);
        
        // Get unique values
        const uniqueCities: string[] = [...new Set(validCities)];
        setCities(uniqueCities);
      } else {
        setCities([]);
      }

      // Fetch route details
      if (stepsData && stepsData.length > 0) {
        // Explicitly type the route IDs as strings
        const routeIds: string[] = stepsData.map(step => step.route_id);
        const uniqueRouteIds: string[] = [...new Set(routeIds)];
        await fetchRoutesWithProducts(uniqueRouteIds);
      } else {
        // Still fetch routes even if no steps
        await fetchRoutesWithProducts([]);
      }
    } catch (error) {
      console.error('Error fetching route steps:', error);
    }
  }

  async function fetchRoutesWithProducts(routeIds: string[]) {
    try {
      // Fetch all routes or specific ones
      let query = supabase.from('routes').select('*');
      if (routeIds.length > 0) {
        query = query.in('id', routeIds);
      }
      
      const { data: routesData, error: routesError } = await query;

      if (routesError) throw routesError;

      // Fetch products for these routes
      const productIds = [...new Set(routesData?.map(route => route.product_id).filter(Boolean))];
      
      let productsData: any[] = [];
      if (productIds.length > 0) {
        const { data, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);

        if (!productsError && data) {
          productsData = data;
        }
      }

      // Create a map of route_id to route details with product name
      const routeMap: Record<string, RouteWithProduct> = {};
      routesData?.forEach(route => {
        const product = productsData?.find(p => p.id === route.product_id);
        routeMap[route.id] = {
          ...route,
          product_name: product?.name || 'Unknown Product',
          expanded: false // Initialize as collapsed
        };
      });
      
      setRoutes(routeMap);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  }

  async function handleCreateRoute() {
    if (!newRoute.product_id) {
      alert('Please select a product');
      return;
    }

    try {
      console.log('Creating route with data:', {
        product_id: newRoute.product_id
      });

      // Only insert product_id since location doesn't exist
      const { data, error } = await supabase
        .from('routes')
        .insert([{
          product_id: newRoute.product_id
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        alert(`Failed to create route: ${error.message}`);
        return;
      }

      if (data) {
        console.log('Route created successfully:', data);
        
        // Refresh routes
        await fetchRoutesWithProducts([]);
        
        // Reset form
        setNewRoute({ product_id: '' });
        setShowNewRouteForm(false);
        
        // Expand the new route
        toggleRouteExpand(data.id);
      }
    } catch (error) {
      console.error('Unexpected error creating route:', error);
      alert(`Unexpected error: ${error}`);
    }
  }

  async function handleUpdateRoute() {
    if (!editingRouteId || !editingRoute) return;

    try {
      const { error } = await supabase
        .from('routes')
        .update({
          product_id: editingRoute.product_id
        })
        .eq('id', editingRouteId);

      if (error) throw error;

      // Update local state
      setRoutes(prev => ({
        ...prev,
        [editingRouteId]: {
          ...prev[editingRouteId],
          product_id: editingRoute.product_id || prev[editingRouteId].product_id
        }
      }));

      setEditingRouteId(null);
      setEditingRoute({});
    } catch (error) {
      console.error('Error updating route:', error);
      alert('Failed to update route');
    }
  }

  async function handleDeleteRoute(routeId: string) {
    if (!confirm('Are you sure you want to delete this route? All associated steps will also be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;

      // Remove from local state
      const newRoutes = { ...routes };
      delete newRoutes[routeId];
      setRoutes(newRoutes);
      
      // Remove associated steps
      setSteps(prev => prev.filter(step => step.route_id !== routeId));
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Failed to delete route');
    }
  }

  // Toggle route expansion
  function toggleRouteExpand(routeId: string) {
    setRoutes(prev => ({
      ...prev,
      [routeId]: {
        ...prev[routeId],
        expanded: !prev[routeId]?.expanded
      }
    }));
  }

  // Start editing steps for a route
  function startEditingSteps(routeId: string) {
    const routeSteps = steps.filter(step => step.route_id === routeId);
    setEditedSteps([...routeSteps]);
    setEditingStepsRouteId(routeId);
  }

  // Cancel editing steps
  function cancelEditingSteps() {
    setEditedSteps([]);
    setEditingStepsRouteId(null);
  }

  // Save edited steps
  async function saveEditedSteps() {
    if (!editingStepsRouteId) return;
    
    setSavingSteps(true);
    
    try {
      // Update each step
      for (let i = 0; i < editedSteps.length; i++) {
        const step = editedSteps[i];
        
        if (step.id.toString().startsWith('temp-')) {
          // Insert new step
          const { error } = await supabase
            .from('route_steps')
            .insert([{
              route_id: editingStepsRouteId,
              order_number: i + 1,
              level: step.level,
              city: step.city,
              assigned_employee_id: step.assigned_employee_id
            }]);
          if (error) throw error;
        } else {
          // Update existing step
          const { error } = await supabase
            .from('route_steps')
            .update({
              order_number: i + 1,
              level: step.level,
              city: step.city,
              assigned_employee_id: step.assigned_employee_id
            })
            .eq('id', step.id);
          if (error) throw error;
        }
      }

      // Refresh data
      await fetchRouteSteps();
      setEditingStepsRouteId(null);
      setEditedSteps([]);
    } catch (error) {
      console.error('Error saving steps:', error);
      alert('Failed to save steps');
    } finally {
      setSavingSteps(false);
    }
  }

  // Step editing functions
  function handleStepChange(index: number, field: string, value: string) {
    const updated = [...editedSteps];
    updated[index] = { ...updated[index], [field]: value };
    setEditedSteps(updated);
  }

  function handleAddStep() {
    const newStep = {
      id: `temp-${Date.now()}-${Math.random()}`,
      route_id: editingStepsRouteId!,
      order_number: editedSteps.length + 1,
      level: '',
      city: '',
      assigned_employee_id: null
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
    
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    const reordered = updated.map((step, idx) => ({
      ...step,
      order_number: idx + 1
    }));
    
    setEditedSteps(reordered);
  }

  // Filter steps based on search and city filter
  const filteredSteps = steps.filter(step => {
    const matchesSearch = 
      searchTerm === '' ||
      step.level?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routes[step.route_id]?.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = filterCity === '' || step.city === filterCity;
    
    return matchesSearch && matchesCity;
  });

  // Get steps for a specific route
  function getStepsForRoute(routeId: string) {
    return filteredSteps.filter(step => step.route_id === routeId);
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="flex items-center justify-center">
            <p className="text-lg text-foreground">Loading route steps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="rounded-lg border border-border bg-card p-2 hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Route Steps</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Total routes: {Object.keys(routes).length} | Total steps: {steps.length}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowNewRouteForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Route
        </Button>
      </div>

      {/* New Route Form */}
      {showNewRouteForm && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Create New Route</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowNewRouteForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Product *</label>
              <select
                value={newRoute.product_id}
                onChange={(e) => setNewRoute({ product_id: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowNewRouteForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRoute}>
              Create Route
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by level, city, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full md:w-64 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full h-10 pl-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Routes List */}
      {Object.keys(routes).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(routes).map(([routeId, route], index) => {
            const routeSteps = getStepsForRoute(routeId);
            const isEditingSteps = editingStepsRouteId === routeId;
            
            return (
              <div key={routeId} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Route Header - Clickable */}
                <div 
                  className="bg-accent/5 px-6 py-4 border-b border-border cursor-pointer hover:bg-accent/10 transition-colors"
                  onClick={() => toggleRouteExpand(routeId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {route.expanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Route {index + 1}</span>
                          <h2 className="font-semibold">
                            {route.product_name || 'Unknown Product'}
                          </h2>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-muted-foreground">
                            ID: {routeId.substring(0, 8)}...
                          </p>
                          {route.timestamp && (
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(route.timestamp).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Steps: {routeSteps.length}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Route Actions */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {editingRouteId === routeId ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setEditingRouteId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={handleUpdateRoute}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditingRouteId(routeId);
                              setEditingRoute(route);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRoute(routeId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Edit Route Form */}
                  {editingRouteId === routeId && (
                    <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Product</label>
                        <select
                          value={editingRoute.product_id || ''}
                          onChange={(e) => setEditingRoute({ ...editingRoute, product_id: e.target.value })}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {products.map(product => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Content - Steps */}
                {route.expanded && (
                  <div className="p-6">
                    {isEditingSteps ? (
                      // Edit Mode for Steps
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium">Edit Steps</h3>
                          <Button onClick={handleAddStep} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Step
                          </Button>
                        </div>
                        
                        {editedSteps.map((step, stepIndex) => (
                          <div key={step.id} className="relative rounded-lg border border-border bg-accent/5 p-4">
                            {/* Step Edit Controls */}
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveStep(stepIndex, 'up')}
                                disabled={stepIndex === 0}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveStep(stepIndex, 'down')}
                                disabled={stepIndex === editedSteps.length - 1}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronDownIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveStep(stepIndex)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-4 pr-24">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {stepIndex + 1}
                              </div>
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Level</p>
                                  <Input
                                    value={step.level || ''}
                                    onChange={(e) => handleStepChange(stepIndex, 'level', e.target.value)}
                                    placeholder="e.g., Manufacturing"
                                    className="h-9"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">City</p>
                                  <Input
                                    value={step.city || ''}
                                    onChange={(e) => handleStepChange(stepIndex, 'city', e.target.value)}
                                    placeholder="e.g., New York"
                                    className="h-9"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Save/Cancel buttons for steps */}
                        <div className="flex justify-end gap-3 pt-4">
                          <Button variant="outline" onClick={cancelEditingSteps}>
                            Cancel
                          </Button>
                          <Button onClick={saveEditedSteps} disabled={savingSteps}>
                            {savingSteps ? 'Saving...' : 'Save Steps'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode for Steps
                      <div>
                        {routeSteps.length > 0 ? (
                          <div className="space-y-2">
                            {routeSteps.map((step) => (
                              <div key={step.id} className="flex items-center gap-4 rounded-lg border border-border bg-accent/5 p-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                  {step.order_number}
                                </div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Level</p>
                                    <p className="text-sm font-medium">{step.level || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">City</p>
                                    <p className="text-sm">{step.city || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Assigned Employee</p>
                                    <p className="text-sm">{step.assigned_employee_id || 'Unassigned'}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground mb-4">No steps for this route yet.</p>
                          </div>
                        )}
                        
                        {/* Edit Steps Button */}
                        {!isEditingSteps && (
                          <div className="flex justify-end mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => startEditingSteps(routeId)}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              {routeSteps.length > 0 ? 'Edit Steps' : 'Add Steps'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">No Routes Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterCity 
                ? 'No routes match your search criteria.'
                : 'Create your first route to get started.'}
            </p>
            {(searchTerm || filterCity) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterCity('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Routes</p>
            <p className="text-xl font-semibold">{Object.keys(routes).length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Steps</p>
            <p className="text-xl font-semibold">{steps.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Unique Cities</p>
            <p className="text-xl font-semibold">{cities.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Assigned Steps</p>
            <p className="text-xl font-semibold">
              {steps.filter(s => s.assigned_employee_id).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}