import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Package, Grid3x3, 
  Eye, RefreshCw, X, 
  ArrowUpDown, Download, Calendar,
  MapPin, Factory, Warehouse, Truck,
  PlusCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function Entities() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [entities, setEntities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Add Entity Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [batchNumber, setBatchNumber] = useState('');
  const [batchError, setBatchError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchEntities();
    fetchProducts();
  }, []);

  async function fetchEntities() {
    setLoading(true);
    const { data, error } = await supabase
      .from('product_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entities:', error);
    } else {
      setEntities(data || []);
    }
    setLoading(false);
  }

  async function fetchProducts() {
    // Sirf Milk Packet aur Mouse dikhane ke liye
    setProducts([
      { id: 'P001', name: 'Milk Packet', category: 'Dairy' },
      { id: 'P002', name: 'Mouse', category: 'Electronics' }
    ]);
  }

  // Generate serial number
  const generateSerialNumber = (productName: string, index: number) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `SN:${productName.substring(0, 4).toUpperCase()}-${year}${month}${day}-${String(index).padStart(3, '0')}`;
  };

  // Validate batch number
  const validateBatchNumber = (batch: string) => {
    if (!batch || batch.trim() === '') {
      return 'Batch number is required';
    }
    if (batch.length < 5) {
      return 'Batch number must be at least 5 characters';
    }
    return '';
  };

  // Add multiple entities
  async function addMultipleEntities() {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    // Batch number validation
    const batchErrorMsg = validateBatchNumber(batchNumber);
    if (batchErrorMsg) {
      setBatchError(batchErrorMsg);
      alert('Please enter a batch number');
      return;
    }

    if (quantity < 1 || quantity > 1000) {
      alert('Quantity must be between 1 and 1000');
      return;
    }

    setCreating(true);

    try {
      const product = products.find(p => p.id === selectedProduct);
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const expiryDate = nextYear.toISOString().split('T')[0];

      // Create array of items
      const itemsToInsert = [];
      for (let i = 1; i <= quantity; i++) {
        itemsToInsert.push({
          product_id: selectedProduct,
          batch_number: batchNumber,
          serial_number: generateSerialNumber(product?.name || 'PROD', i),
          current_state: 'Factory',
          current_location: 'Factory',
          status: 'active',
          manufactured_date: today,
          expiry_date: expiryDate,
          scan_count: 0,
          created_at: new Date().toISOString()
        });
      }

      // Insert in batches of 100 to avoid overload
      for (let i = 0; i < itemsToInsert.length; i += 100) {
        const batch = itemsToInsert.slice(i, i + 100);
        const { error } = await supabase
          .from('product_items')
          .insert(batch);

        if (error) {
          console.error('Error inserting batch:', error);
          throw error;
        }
      }

      // Reset form and refresh
      setShowAddDialog(false);
      setSelectedProduct('');
      setQuantity(1);
      setBatchNumber('');
      setBatchError('');
      fetchEntities();
      
      alert(`Successfully created ${quantity} items with batch: ${batchNumber}`);
    } catch (error) {
      console.error('Error creating entities:', error);
      alert('Error creating entities. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  // Get unique product IDs that actually have items
  const availableProducts = useMemo(() => {
    const productIdsWithItems = new Set(entities.map(e => e.product_id));
    return products.filter(p => productIdsWithItems.has(p.id));
  }, [products, entities]);

  const filtered = useMemo(() => {
    let filteredItems = entities.filter(item => {
      const matchesSearch = 
        item.product_id?.toLowerCase().includes(search.toLowerCase()) ||
        item.batch_number?.toLowerCase().includes(search.toLowerCase()) ||
        item.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
        item.current_location?.toLowerCase().includes(search.toLowerCase()) ||
        getProductName(item.product_id).toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesProduct = productFilter === 'all' || item.product_id === productFilter;
      
      return matchesSearch && matchesStatus && matchesProduct;
    });

    // Sorting
    filteredItems.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'product_name') {
        aValue = getProductName(a.product_id);
        bValue = getProductName(b.product_id);
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredItems;
  }, [search, statusFilter, productFilter, entities, sortField, sortDirection]);

  const stats = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter(e => e.status === 'active').length,
    uniqueBatches: new Set(filtered.map(e => e.batch_number).filter(Boolean)).size,
    totalScans: filtered.reduce((acc, e) => acc + (e.scan_count || 0), 0),
    locations: new Set(filtered.map(e => e.current_location).filter(Boolean)).size,
    flagged: filtered.filter(e => e.status === 'flagged').length,
  }), [filtered]);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || productId;
  };

  const getProductCategory = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.category || 'Uncategorized';
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setProductFilter('all');
  };

  const activeFiltersCount = [
    search && 'search',
    statusFilter !== 'all' && 'status',
    productFilter !== 'all' && 'product'
  ].filter(Boolean).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 bg-gradient-to-br from-background to-secondary/5"
    >
      {/* Header with Add Button */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border border-border">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Product Items
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              View and manage all individual product items in the supply chain. Track batches, serial numbers, and current status.
            </p>
          </div>
          
          {/* Add Entity Button */}
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Entity
          </Button>
        </div>
      </div>

      {/* Add Entity Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Add Multiple Entities
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Create multiple product items in bulk with same batch number and sequential serial numbers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product" className="text-gray-300">
                Select Product <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id} className="text-white hover:bg-gray-700">
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-gray-300">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="1000"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="bg-gray-900 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500">Max: 1000 items at a time</p>
            </div>

            {/* Batch Number (Mandatory) */}
            <div className="space-y-2">
              <Label htmlFor="batch" className="text-gray-300">
                Batch Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="batch"
                placeholder="Enter batch number (e.g., BATCH-MILK-001)"
                value={batchNumber}
                onChange={(e) => {
                  setBatchNumber(e.target.value);
                  setBatchError(validateBatchNumber(e.target.value));
                }}
                className={`bg-gray-900 border ${
                  batchError ? 'border-red-500' : 'border-gray-700'
                } text-white`}
              />
              {batchError && (
                <p className="text-xs text-red-500 mt-1">{batchError}</p>
              )}
            </div>

            {/* Preview */}
            {selectedProduct && quantity > 0 && batchNumber && !batchError && (
              <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <p className="text-sm font-medium text-gray-300 mb-2">Preview:</p>
                <p className="text-xs text-gray-400">
                  Creating <span className="text-blue-400 font-bold">{quantity}</span> items for{' '}
                  <span className="text-blue-400">{products.find(p => p.id === selectedProduct)?.name}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Batch: <span className="text-green-400 font-mono">{batchNumber}</span>
                </p>
                <p className="text-xs text-gray-400">
                  Serial: 1 to {quantity}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setSelectedProduct('');
                setQuantity(1);
                setBatchNumber('');
                setBatchError('');
              }}
              className="border-gray-700 text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={addMultipleEntities}
              disabled={!selectedProduct || !batchNumber || batchError !== '' || creating}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                'Create Entities'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">
                of {entities.length} total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Items</p>
              <p className="text-2xl font-bold text-green-500">{stats.active}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.active / stats.total) * 100 || 0).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Unique Batches</p>
              <p className="text-2xl font-bold">{stats.uniqueBatches}</p>
              <p className="text-xs text-muted-foreground mt-1">
                across {products.length} products
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Scans</p>
              <p className="text-2xl font-bold">{stats.totalScans}</p>
              <p className="text-xs text-muted-foreground mt-1">
                avg {(stats.totalScans / stats.total || 0).toFixed(1)} per item
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-l-4 border-l-indigo-500 hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Locations</p>
              <p className="text-2xl font-bold">{stats.locations}</p>
              <p className="text-xs text-muted-foreground mt-1">
                unique locations
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Flagged</p>
              <p className="text-2xl font-bold text-red-500">{stats.flagged}</p>
              <p className="text-xs text-muted-foreground mt-1">
                requires attention
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Filter Row 1 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by product, ID, batch, serial, location..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-20"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                  className="shrink-0"
                >
                  {viewMode === 'table' ? <Grid3x3 className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="shrink-0 gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={fetchEntities}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh data</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button variant="outline" size="icon" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filter Row 2 - Expandable */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-hidden"
                >
                  <Select value={productFilter} onValueChange={setProductFilter}>
                    <SelectTrigger>
                      <Package className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({entities.filter(e => e.product_id === product.id).length})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortField} onValueChange={(value) => toggleSort(value)}>
                    <SelectTrigger>
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Created Date</SelectItem>
                      <SelectItem value="product_name">Product Name</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="scan_count">Scan Count</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{search}"
                    <button onClick={() => setSearch('')}>×</button>
                  </Badge>
                )}
                {productFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Product: {getProductName(productFilter)}
                    <button onClick={() => setProductFilter('all')}>×</button>
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('all')}>×</button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table View */}
      {viewMode === 'table' ? (
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => toggleSort('product_name')}>
                    Product <SortIcon field="product_name" />
                  </TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Batch/Serial</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => toggleSort('current_state')}>
                    State <SortIcon field="current_state" />
                  </TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Manufactured/Expiry</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => toggleSort('status')}>
                    Status <SortIcon field="status" />
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => toggleSort('scan_count')}>
                    Scans <SortIcon field="scan_count" />
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => toggleSort('created_at')}>
                    Created <SortIcon field="created_at" />
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-64">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {filtered.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="cursor-pointer hover:bg-muted/50 group"
                        onClick={() => navigate(`/entities/${item.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div>
                            {getProductName(item.product_id)}
                            <span className="block text-xs text-muted-foreground">
                              {getProductCategory(item.product_id)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.product_id || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {item.batch_number && (
                              <Badge variant="outline" className="text-xs">
                                Batch: {item.batch_number}
                              </Badge>
                            )}
                            {item.serial_number && (
                              <div className="text-xs text-muted-foreground">
                                SN: {item.serial_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {item.current_state === 'Factory' && <Factory className="h-3 w-3" />}
                            {item.current_state === 'warehouse' && <Warehouse className="h-3 w-3" />}
                            {item.current_state === 'Delivery' && <Truck className="h-3 w-3" />}
                            <span className="text-muted-foreground">{item.current_state || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{item.current_location || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {item.manufactured_date && (
                              <div className="text-xs flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Mfg: {formatDate(item.manufactured_date)}</span>
                              </div>
                            )}
                            {item.expiry_date && (
                              <div className="text-xs text-red-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Exp: {formatDate(item.expiry_date)}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.status || 'unknown'} />
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {item.scan_count || 0}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                {formatDateTime(item.created_at)}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Created: {formatDateTime(item.created_at)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              navigate(`/entities/${item.id}`);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <Card 
                  className="cursor-pointer hover:shadow-xl transition-all hover:border-primary/50"
                  onClick={() => navigate(`/entities/${item.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{getProductName(item.product_id)}</h3>
                        <p className="text-xs text-muted-foreground">{item.product_id}</p>
                      </div>
                      <StatusBadge status={item.status || 'unknown'} />
                    </div>

                    <div className="space-y-2 text-sm">
                      {item.batch_number && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Batch:</span>
                          <span className="font-mono">{item.batch_number}</span>
                        </div>
                      )}
                      {item.serial_number && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Serial:</span>
                          <span className="font-mono">{item.serial_number}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">State:</span>
                        <span>{item.current_state || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{item.current_location || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Scans:</span>
                        <span className="font-mono">{item.scan_count || 0}</span>
                      </div>
                      {item.expiry_date && (
                        <div className="flex justify-between text-red-400">
                          <span className="text-muted-foreground">Expires:</span>
                          <span>{formatDate(item.expiry_date)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </span>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <Button onClick={clearFilters}>Clear all filters</Button>
        </motion.div>
      )}
      
      {/* Footer */}
      {filtered.length > 0 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <p>Showing {filtered.length} of {entities.length} items</p>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      )}
    </motion.div>
  );
}
      