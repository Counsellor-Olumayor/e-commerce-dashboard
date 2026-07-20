import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const salesTrendData = [
  { month: 'Jan', revenue: 4200, orders: 110 },
  { month: 'Feb', revenue: 5100, orders: 132 },
  { month: 'Mar', revenue: 4800, orders: 121 },
  { month: 'Apr', revenue: 6300, orders: 154 },
  { month: 'May', revenue: 7100, orders: 180 },
  { month: 'Jun', revenue: 8400, orders: 224 },
];

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // NEW STATE: Tracks which product is currently being edited in our modal
  const [editingProduct, setEditingProduct] = useState(null);

  // DATA INFRASTRUCTURE: Fetches live warehouse inventory from a public API
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://fakestoreapi.com/products');

      if (!response.ok) {
        throw new Error('Could not connect to warehouse servers. Retry in a moment.');
      }

      const data = await response.json();

      // ENHANCEMENT: The public API doesn't include stock numbers, 
      // so we inject a mock 'stock' property into each item locally.
      const enrichedData = data.map((item, index) => ({
        ...item,
        stock: index % 3 === 0 ? 3 : Math.floor(Math.random() * 40) + 10 // Mix of low and healthy stock
      }));

      setProducts(enrichedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // STATE MANAGEMENT HANDLER: Updates our local state when an admin edits an item
  const handleUpdateProduct = (updatedProduct) => {
    setProducts(prevProducts =>
      prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    setEditingProduct(null); // Close the modal
  };

  // LIVE FILTERING ENGINE: Screens products by text search AND category dropdown
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(products.map(p => p.category))];

  // AUTOMATED ALERTS: Filters inventory to catch critical business warnings (Stock under 5 units)
  const lowStockItems = products.filter(p => p.stock < 5);

  // ANALYTICS CALCULATIONS: Derived state that dynamically sums up metrics
  const totalValue = filteredProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalItemsCount = filteredProducts.reduce((sum, p) => sum + p.stock, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
      {/* Admin Navbar */}
      <header className="border-b border-slate-800 bg-slate-950 px-4 py-4 md:px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">📊</span>
            <h1 className="text-base font-bold text-white tracking-wide">ShopPulse Admin Workspace</h1>
          </div>
          <button
            onClick={fetchInventory}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            🔄 Sync Live Inventory
          </button>
        </div>
      </header>

      {/* Main Control Center */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        {/* CRITICAL STOCK ALERTS PANEL */}
        {!loading && !error && lowStockItems.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">Critical Restock Alert</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  You have <span className="font-mono font-bold text-white">{lowStockItems.length}</span> item(s) running dangerously low on warehouse inventory (under 5 units).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Metric Ribbon */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Units Monitored</p>
                <p className="text-2xl font-black text-white mt-1 font-mono">{totalItemsCount}</p>
              </div>
              <span className="text-2xl bg-slate-900 p-2 rounded-lg border border-slate-800/60">📦</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estimated Stock Value</p>
                <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <span className="text-2xl bg-slate-900 p-2 rounded-lg border border-slate-800/60">💰</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Catalog SKUs</p>
                <p className="text-2xl font-black text-indigo-400 mt-1 font-mono">{filteredProducts.length}</p>
              </div>
              <span className="text-2xl bg-slate-900 p-2 rounded-lg border border-slate-800/60">📑</span>
            </div>
          </div>
        )}


        {/* PERFORMANCE METRIC GRAPH */}
        {!loading && !error && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">Gross Revenue Performance</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Historical monthly trend analysis for the current fiscal period.</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}


        {/* Search & Category Filter Controls */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search products by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 capitalize focus:outline-none focus:border-emerald-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-7 w-7 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-mono">Querying central inventory database...</p>
          </div>
        )}

        {/* ERROR SCREEN */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-center max-w-sm mx-auto shadow-xl">
            <p className="text-sm text-rose-400 font-semibold">⚠️ Operational Exception</p>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
            <button onClick={fetchInventory} className="mt-4 bg-emerald-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-transform active:scale-95">
              Re-establish Link
            </button>
          </div>
        )}

        {/* PRODUCT GRID DISPLAY */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow flex flex-col justify-between hover:border-slate-700 transition-all group relative"
              >
                <div>
                  <div className="h-40 w-full bg-white rounded-lg p-3 flex items-center justify-center mb-4 overflow-hidden relative">
                    <img src={product.image} alt={product.title} className="h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute bottom-2 left-2 text-[9px] font-mono uppercase bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                      {product.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-xs line-clamp-2 leading-relaxed mb-3 group-hover:text-emerald-400 transition-colors">
                    {product.title}
                  </h3>
                </div>

                {/* Local Dynamic Warehouse Details */}
                <div className="mb-4 bg-slate-900/60 rounded-lg p-2 border border-slate-800/40 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Inventory Supply:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${product.stock < 5 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-200'
                    }`}>
                    {product.stock} units
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-900 flex justify-between items-center mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Unit Price</span>
                    <span className="text-sm font-black text-white font-mono">${product.price.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 active:scale-95 text-[11px] font-bold px-3 py-1.5 rounded transition-all text-slate-300"
                  >
                    ✏️ Edit Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* DYNAMIC MANAGEMENT OVERLAY MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <h2 className="text-sm font-black text-white tracking-wide uppercase">Modify Store Listing</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 line-clamp-1">{editingProduct.title}</p>

            <hr className="border-slate-800" />

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleUpdateProduct({
                ...editingProduct,
                price: parseFloat(formData.get('price')),
                stock: parseInt(formData.get('stock'), 10)
              });
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Market Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  defaultValue={editingProduct.price}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Warehouse Inventory Count</label>
                <input
                  type="number"
                  name="stock"
                  defaultValue={editingProduct.stock}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold py-2.5 rounded-lg text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black py-2.5 rounded-lg transition-transform active:scale-95"
                >
                  Commit Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;