import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Package, 
  QrCode, 
  ArrowUpDown, 
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-semibold">{filtered.length}</p>
          {productFilter !== 'all' && (
            <p className="text-xs text-muted-foreground mt-1">
              of {entities.length} total
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Items</p>
          <p className="text-2xl font-semibold text-green-600">
            {filtered.filter(e => e.status === 'active').length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Unique Batches</p>
          <p className="text-2xl font-semibold">
            {new Set(filtered.map(e => e.batch_number).filter(Boolean)).size}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Items with QR Codes</p>
          <p className="text-2xl font-semibold text-blue-600">
            {filtered.filter(e => e.external_qr_path || e.internal_qr_path).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            External: {filtered.filter(e => e.external_qr_path).length} | 
            Internal: {filtered.filter(e => e.internal_qr_path).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Product</TableHead>
              <TableHead>Product ID</TableHead>
              <TableHead>Batch/Serial</TableHead>
              <TableHead>Current State</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Manufactured/Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>QR Codes</TableHead>
              <TableHead>Scans</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow 
                  key={item.id} 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => navigate(`/entities/${item.id}`)}
                >
                  <TableCell>
                    <div className="font-medium">{getProductName(item.product_id)}</div>
                    <div className="text-xs text-muted-foreground">{getProductCategory(item.product_id)}</div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {item.product_id}
                    </code>
                  </TableCell>
                  <TableCell>
                    {item.batch_number && (
                      <div className="text-sm font-mono">{item.batch_number}</div>
                    )}
                    {item.serial_number && (
                      <div className="text-xs text-muted-foreground font-mono">
                        {item.serial_number}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.current_state || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.current_location || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(item.manufactured_date)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Exp: {formatDate(item.expiry_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status || 'unknown'} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.external_qr_path ? (
                        <div className="flex items-center gap-1" title="Has external QR code">
                          <QrCode className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-green-600">EXT</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1" title="No external QR code">
                          <QrCode className="h-4 w-4 text-gray-300" />
                          <span className="text-xs text-gray-400">EXT</span>
                        </div>
                      )}
                      {item.internal_qr_path ? (
                        <div className="flex items-center gap-1" title="Has internal QR code">
                          <QrCode className="h-4 w-4 text-blue-500" />
                          <span className="text-xs text-blue-600">INT</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1" title="No internal QR code">
                          <QrCode className="h-4 w-4 text-gray-300" />
                          <span className="text-xs text-gray-400">INT</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {item.scan_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(item.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigate(`/entities/${item.id}`);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                  No product items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}