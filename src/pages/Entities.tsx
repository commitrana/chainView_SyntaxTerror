import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Package, QrCode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';

export default function Entities() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [entities, setEntities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
  }

  // Get unique product IDs that actually have items
  const availableProducts = useMemo(() => {
    const productIdsWithItems = new Set(entities.map(e => e.product_id));
    return products.filter(p => productIdsWithItems.has(p.id));
  }, [products, entities]);

  const filtered = useMemo(() => {
    return entities.filter(item => {
      // Search filter
      const matchesSearch = 
        (item.product_id?.toLowerCase().includes(search.toLowerCase()) ||
        item.batch_number?.toLowerCase().includes(search.toLowerCase()) ||
        item.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
        item.current_location?.toLowerCase().includes(search.toLowerCase()));
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      // Product filter
      const matchesProduct = productFilter === 'all' || item.product_id === productFilter;
      
      return matchesSearch && matchesStatus && matchesProduct;
    });
  }, [search, statusFilter, productFilter, entities]);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  };

  // Get product name by ID
  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || productId;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Product Items</h1>
        <p className="mt-1 text-sm text-muted-foreground">View and manage all individual product items in the supply chain</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by product ID, batch, serial, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Product/Category Filter */}
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-64">
            <Package className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {availableProducts.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} ({product.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
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

        <Button variant="outline" onClick={fetchEntities} className="ml-auto">
          Refresh
        </Button>
      </div>

      {/* Active Filters Display */}
      {productFilter !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filter:</span>
          <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm">
            <Package className="h-3 w-3" />
            <span>Product: {getProductName(productFilter)}</span>
            <button 
              onClick={() => setProductFilter('all')}
              className="ml-1 hover:text-primary"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
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
                  <TableCell className="font-medium">
                    {getProductName(item.product_id)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.product_id || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {item.batch_number && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Batch:</span> {item.batch_number}
                        </div>
                      )}
                      {item.serial_number && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">SN:</span> {item.serial_number}
                        </div>
                      )}
                      {!item.batch_number && !item.serial_number && '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.current_state || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.current_location || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {item.manufactured_date && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Mfg:</span> {formatDate(item.manufactured_date)}
                        </div>
                      )}
                      {item.expiry_date && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Exp:</span> {formatDate(item.expiry_date)}
                        </div>
                      )}
                      {!item.manufactured_date && !item.expiry_date && '-'}
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
                    {item.scan_count || 0}
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
    </div>
  );
}