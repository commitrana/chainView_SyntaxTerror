import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

import { useState, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/StatusBadge';


export default function Products() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [products, setProducts] = useState<any[]>([]);
  const [newId, setNewId] = useState('');
const [newName, setNewName] = useState('');
const [newState, setNewState] = useState('');
const [newStatus, setNewStatus] = useState('Active');
  useEffect(() => {
  fetchProducts();
}, []);

async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error(error);
  } else {
    setProducts(data || []);
  }
}
async function addProduct() {
  if (!newId || !newName) {
    alert("ID and Name required");
    return;
  }

  const { error } = await supabase
    .from('products')
    .insert([
      {
        id: newId,
        name: newName,
        current_state: newState,
        status: newStatus,
        route_version: 1
      }
    ]);

  if (error) {
    console.error(error);
    alert(error.message);
  } else {
    setNewId('');
    setNewName('');
    setNewState('');
    setNewStatus('Active');
    fetchProducts();
  }
}
  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, products]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track and manage all products in the supply chain</p>
      </div>
<div className="rounded-xl border border-border bg-card p-6 space-y-4">
  <h2 className="text-lg font-semibold">Add Product</h2>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Input
      placeholder="Product ID"
      value={newId}
      onChange={(e) => setNewId(e.target.value)}
    />

    <Input
      placeholder="Product Name"
      value={newName}
      onChange={(e) => setNewName(e.target.value)}
    />

    <Input
      placeholder="Current State"
      value={newState}
      onChange={(e) => setNewState(e.target.value)}
    />

    <Select value={newStatus} onValueChange={setNewStatus}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Active">Active</SelectItem>
        <SelectItem value="Rerouted">Rerouted</SelectItem>
        <SelectItem value="Flagged">Flagged</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <Button onClick={addProduct}>
    Add Product
  </Button>
</div>
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Rerouted">Rerouted</SelectItem>
            <SelectItem value="Flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Product ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Current State</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.current_state}</TableCell>
                <TableCell className="text-muted-foreground">v{p.route_version}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}`); }}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
