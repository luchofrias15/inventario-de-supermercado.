'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Product = { id: string; name: string; sku: string; categoryId: string; price: number; stock: number; minStock: number; unit: string };
type Category = { id: string; name: string; color: string };
type ApiResult<T> = { data: T | { data: T[]; total: number } };

export default function InventoryDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [stock, setStock] = useState('10');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const [productsResponse, categoriesResponse] = await Promise.all([fetch('/api/data/products'), fetch('/api/data/categories')]);
    const productsJson = await productsResponse.json() as ApiResult<{ data: Product[] }>;
    const categoriesJson = await categoriesResponse.json() as ApiResult<{ data: Category[] }>;
    const productData = productsJson.data as { data: Product[] };
    const categoryData = categoriesJson.data as { data: Category[] };
    setProducts(productData.data);
    setCategories(categoryData.data);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const lowStock = products.filter((p) => p.stock <= p.minStock);
  async function addProduct(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await fetch('/api/data/products', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, sku: `NUE-${Date.now().toString().slice(-4)}`, categoryId: categories[0]?.id ?? 'cat_abarrotes', price: 0, stock: Number(stock), minStock: 5, unit: 'pieza' }) });
    setName(''); setStock('10'); await load();
  }
  async function removeProduct(id: string) {
    await fetch(`/api/data/products?id=${id}`, { method: 'DELETE' }); await load();
  }
  return <main className="min-h-screen bg-slate-100"><header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-600">Mercado</p><h1 className="text-2xl font-black text-slate-900">Inventario</h1></div><button onClick={() => { void fetch('/api/auth/logout', { method: 'POST' }); }} className="text-sm text-slate-500">Cerrar sesion</button></div></header><div className="mx-auto max-w-7xl space-y-6 p-6"><section className="grid gap-4 sm:grid-cols-3"><Metric label="Productos" value={products.length} /><Metric label="Unidades en stock" value={products.reduce((sum, p) => sum + p.stock, 0)} /><Metric label="Alertas de stock" value={lowStock.length} danger /></section><section className="grid gap-6 lg:grid-cols-[1fr_340px]"><div className="rounded-xl bg-white p-5 shadow-sm"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Productos</h2><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o SKU" className="rounded border px-3 py-2 text-sm" /></div>{loading ? <p>Cargando...</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-slate-400"><tr><th className="py-3">Producto</th><th>Categoria</th><th>Precio</th><th>Stock</th><th /></tr></thead><tbody>{filtered.map((product) => <tr key={product.id} className="border-b last:border-0"><td className="py-4"><strong>{product.name}</strong><div className="text-xs text-slate-400">{product.sku}</div></td><td>{categories.find((c) => c.id === product.categoryId)?.name ?? 'Sin categoria'}</td><td>${product.price.toFixed(2)}</td><td><span className={product.stock <= product.minStock ? 'font-bold text-red-600' : 'text-emerald-600'}>{product.stock} {product.unit}</span></td><td><button onClick={() => { void removeProduct(product.id); }} className="text-xs text-red-500">Eliminar</button></td></tr>)}</tbody></table></div>}</div><form onSubmit={addProduct} className="h-fit rounded-xl bg-slate-900 p-5 text-white"><h2 className="text-lg font-bold">Agregar producto</h2><label className="mt-5 block text-sm">Nombre<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded bg-white p-2 text-slate-900" placeholder="Ej. Cafe molido" /></label><label className="mt-4 block text-sm">Existencia inicial<input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min="0" className="mt-1 w-full rounded bg-white p-2 text-slate-900" /></label><button className="mt-5 w-full rounded bg-cyan-400 py-2 font-bold text-slate-950">Guardar producto</button></form></section></div></main>;
}

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return <div className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-3xl font-black ${danger && value > 0 ? 'text-red-600' : 'text-slate-900'}`}>{value}</p></div>;
}
