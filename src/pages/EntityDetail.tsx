import { Package, Truck, CheckCircle, RotateCcw, AlertTriangle, QrCode, Shield, Info, Users, Box } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<any>({});
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'admin' | 'products'>('admin');
  
  useEffect(() => {
    fetchEmployees();
    fetchProducts();
  }, []);
  
  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    if (data) {
      setEmployees(data);
      const rolesObj: any = {};
      data.forEach((emp: any) => {
        rolesObj[emp.id] = emp.role || "";
      });
      setSelectedRole(rolesObj);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    setProducts(data || []);
  };

  const revokeAccess = async (id: string) => {
    await supabase
      .from("employees")
      .update({ can_scan: false })
      .eq("id", id);
    fetchEmployees();
  };

  const updateRole = async (id: string, role: string) => {
    const { error } = await supabase
      .from("employees")
      .update({ role: role })
      .eq("id", id);

    if (error) {
      alert(error.message);
    }
    fetchEmployees();
  };

  const grantAccess = async (id: string) => {
    await supabase
      .from("employees")
      .update({ can_scan: true })
      .eq("id", id);
    fetchEmployees();
  };

  // SIRF TOTAL PRODUCTS KA STAT - BAAKI SAB HATAYA
  const totalProducts = products.length;

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-gray-400 mt-2">Welcome back! Manage your supply chain efficiently</p>
      </div>
      
      {/* SIRF TOTAL PRODUCTS - SIMPLE CARD */}
      <div className="mb-8 max-w-xs">
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Products</p>
              <p className="text-4xl font-bold text-white">{totalProducts}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('admin')}
          className={cn(
            "flex items-center space-x-2 px-6 py-3 font-medium transition-all relative",
            activeTab === 'admin' 
              ? "text-blue-400" 
              : "text-gray-400 hover:text-gray-200"
          )}
        >
          <Users className="w-5 h-5" />
          <span>Admin Panel</span>
          {activeTab === 'admin' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400" />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('products')}
          className={cn(
            "flex items-center space-x-2 px-6 py-3 font-medium transition-all relative",
            activeTab === 'products' 
              ? "text-blue-400" 
              : "text-gray-400 hover:text-gray-200"
          )}
        >
          <Package className="w-5 h-5" />
          <span>Products</span>
          {activeTab === 'products' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400" />
          )}
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Side - Dynamic Content */}
        <div className="col-span-8">
          {activeTab === 'admin' ? (
            /* Admin Panel Content */
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
                <span className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
                  {employees.length} Users
                </span>
              </div>
              
              <div className="space-y-4">
                {employees.map((emp: any) => (
                  <div key={emp.id} className="border border-gray-700 bg-gray-800/80 p-4 rounded-lg hover:border-gray-600 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {emp.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{emp.name}</p>
                          <p className="text-sm text-gray-400">{emp.level}</p>
                        </div>
                      </div>
                    </div>

                    {emp.can_scan ? (
                      <button
                        onClick={() => revokeAccess(emp.id)}
                        className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-red-500/30 transition-all"
                      >
                        Revoke Access
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          placeholder="Enter role (admin/editor/etc)"
                          className="flex-1 bg-gray-900/50 border border-gray-600/50 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-200"
                          value={selectedRole[emp.id] || ""}
                          onChange={(e) =>
                            setSelectedRole({
                              ...selectedRole,
                              [emp.id]: e.target.value,
                            })
                          }
                        />

                        <button
                          onClick={() => updateRole(emp.id, selectedRole[emp.id])}
                          className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-all"
                        >
                          Save Role
                        </button>

                        <button
                          onClick={() => grantAccess(emp.id)}
                          className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-all"
                        >
                          Enable QR
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Products Content */
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Products</h2>
                <span className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
                  {products.length} Items
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {products.map((product: any) => (
                  <div key={product.id} className="border border-gray-700 bg-gray-800/80 p-4 rounded-lg hover:border-gray-600 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">{product.name}</p>
                        <p className="text-xs text-gray-400 mt-1">ID: {product.id.slice(0, 8)}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <button
                      onClick={async () => {
                        const { data } = await supabase
                          .from("product_items")
                          .select("id")
                          .eq("product_id", product.id);
                        
                        if (data && data.length > 0) {
                          navigate(`/entities/${data[0].id}`);
                        } else {
                          alert("No items found");
                        }
                      }}
                      className="w-full bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-all flex items-center justify-center space-x-2"
                    >
                      <span>View Items</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Quick Actions */}
        <div className="col-span-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {activeTab === 'admin' ? 'Quick Actions' : 'Product Stats'}
            </h3>
            
            {activeTab === 'admin' ? (
              <div className="space-y-3">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-sm text-gray-400">Total Admins</p>
                  <p className="text-2xl font-bold text-white">
                    {employees.filter(e => e.role?.toLowerCase().includes('admin')).length}
                  </p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-sm text-gray-400">QR Enabled Users</p>
                  <p className="text-2xl font-bold text-white">
                    {employees.filter(e => e.can_scan).length}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-sm text-gray-400">Total Products</p>
                  <p className="text-2xl font-bold text-white">{products.length}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}