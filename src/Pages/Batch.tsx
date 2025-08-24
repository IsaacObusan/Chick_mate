import React, { useMemo, useState, useEffect } from "react";

/**
 * Poultry Farm Monitoring UI - UI only
 * React + TypeScript + TailwindCSS
 * No API wiring. Sample in-memory data.
 */

type Batch = {
  id: string;
  name: string;
  startDate: string; // ISO date
  population: number;
};

type InventoryItem = {
  id: string;
  name: string;
  category: "feed" | "medicine" | "general";
  defaultUnit?: string;
};

type Unit = "kg" | "g" | "lb" | "pcs" | "ml" | "l";

type FeedMedicineEntry = {
  id: string;
  itemId: string;
  itemName: string;
  qty: number;
  unit: Unit;
  timestamp: string;
};

type InventoryUsageEntry = {
  id: string;
  itemId: string;
  itemName: string;
  qty: number;
  timestamp: string;
};

type MortalityEntry = {
  id: string;
  count: number;
  cause?: string;
  timestamp: string;
};

function Card({ title, children, right }: { title: string; children?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow">
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
      <span className="shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </label>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-1 text-xs text-gray-700 border border-gray-200 rounded bg-gray-50">{children}</span>;
}

function Divider() {
  return <div className="h-px bg-gray-100" />;
}

function ChartShell({ title }: { title: string }) {
  return (
    <div className="grid h-56 text-sm text-gray-300 bg-white border border-gray-100 rounded-lg md:h-64 lg:h-72 place-items-center">
      {title} placeholder
    </div>
  );
}

function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString();
}

function daysBetween(a: string | Date, b: string | Date) {
  const start = typeof a === "string" ? new Date(a) : a;
  const end = typeof b === "string" ? new Date(b) : b;
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export default function BatchMain() {
  // Sample data
  const [batches, setBatches] = useState<string[]>([]); // Change type to string[]
  const [batchDetails, setBatchDetails] = useState<Batch[]>([]); // Store full batch objects separately

  useEffect(() => {
    // Fetch batch IDs from backend
    fetch("http://localhost:8080/batches")
      .then(response => response.json())
      .then((data: string[]) => {
        setBatches(data);
        if (data.length > 0) {
          setBatchId(data[0]); // Select the first batch by default
          // For each batch ID, fetch full batch details
          const fetchDetailsPromises = data.map(id =>
            fetch(`http://localhost:8080/batch/${id}`)
              .then(res => res.json())
          );
          Promise.all(fetchDetailsPromises)
            .then(details => setBatchDetails(details))
            .catch(error => console.error("Error fetching batch details:", error));
        }
      })
      .catch(error => console.error("Error fetching batch IDs:", error));
  }, []);

  const [items] = useState<InventoryItem[]>([
    { id: "i1", name: "Starter Feed", category: "feed", defaultUnit: "kg" },
    { id: "i2", name: "Grower Feed", category: "feed", defaultUnit: "kg" },
    { id: "i3", name: "Vitamin Mix", category: "medicine", defaultUnit: "ml" },
    { id: "i4", name: "Bedding", category: "general", defaultUnit: "pcs" },
  ]);

  // Selection
  const [batchId, setBatchId] = useState<string>("b1");

  // Entries
  const [feedMedEntries, setFeedMedEntries] = useState<FeedMedicineEntry[]>([]);
  const [usageEntries, setUsageEntries] = useState<InventoryUsageEntry[]>([]);
  const [mortalityEntries, setMortalityEntries] = useState<MortalityEntry[]>([]);

  // Get user role from localStorage
  const userRole = localStorage.getItem("role");
  const isAdmin = userRole === "admin";

  const selectedBatch = useMemo(() => batchDetails.find(b => b.id === batchId) || null, [batchDetails, batchId]);
  const todayAge = useMemo(() => (selectedBatch ? daysBetween(selectedBatch.startDate, new Date()) : 0), [selectedBatch]);

  // Local forms
  const [fmItemId, setFmItemId] = useState("i1");
  const [fmQty, setFmQty] = useState<number | undefined>(undefined);
  const [fmUnit, setFmUnit] = useState<Unit>("kg");

  const [useItemId, setUseItemId] = useState("i4");
  const [useQty, setUseQty] = useState<number | undefined>(undefined);

  const [mortCount, setMortCount] = useState<number | undefined>(undefined);
  const [mortCause, setMortCause] = useState<string>("");

  // Derived lists
  const feedMedItems = items.filter(i => i.category === "feed" || i.category === "medicine");
  const generalItems = items.filter(i => i.category === "general");

  function NumberInput({ value, onChange, min = 0, step = 1, placeholder, title }: { value?: number; onChange: (v: number) => void; min?: number; step?: number; placeholder?: string; title?: string }) {
    return (
      <input
        type="number"
        value={value === undefined || value === null ? "" : value}
        onChange={e => onChange(Number(e.target.value))}
        min={min}
        step={step}
        placeholder={placeholder}
        title={title}
        className="w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    );
  }

  function addFeedMedEntry(p: { itemId: string; qty: number; unit: Unit }) {
    const item = items.find(i => i.id === p.itemId);
    if (!item) return;
    const entry: FeedMedicineEntry = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemName: item.name,
      qty: p.qty,
      unit: p.unit,
      timestamp: new Date().toISOString(),
    };
    setFeedMedEntries(prev => [entry, ...prev]);
  }

  function addUsageEntry(p: { itemId: string; qty: number }) {
    const item = items.find(i => i.id === p.itemId);
    if (!item) return;
    const entry: InventoryUsageEntry = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemName: item.name,
      qty: p.qty,
      timestamp: new Date().toISOString(),
    };
    setUsageEntries(prev => [entry, ...prev]);
  }

  function addMortalityEntry(p: { count: number; cause?: string }) {
    const entry: MortalityEntry = {
      id: crypto.randomUUID(),
      count: p.count,
      cause: p.cause?.trim() ? p.cause.trim() : undefined,
      timestamp: new Date().toISOString(),
    };
    setMortalityEntries(prev => [entry, ...prev]);
  }

  const [tab, setTab] = useState<'monitoring' | 'harvesting'>('monitoring');

  // New state for monitoring sub-pages
  const [monitoringPage, setMonitoringPage] = useState<1 | 2>(1);

  return (
    <div className="min-h-[200vh] sm:min-h-[120vh] bg-gray-50 text-gray-900 flex flex-col">
      <main className="flex-1 w-full max-w-full px-2 py-6 pb-32 mx-auto space-y-10 sm:px-6 md:px-10 lg:px-20 sm:py-10 md:py-16 lg:py-20 sm:space-y-12 md:space-y-16">
        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold text-sm border-b-2 transition-colors duration-150 ${tab === 'monitoring' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-gray-500 bg-gray-100 hover:border-orange-500 hover:text-orange-600'}`}
            onClick={() => setTab('monitoring')}
            title="Monitoring Tab"
          >
            Monitoring
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold text-sm border-b-2 transition-colors duration-150 ${tab === 'harvesting' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-gray-500 bg-gray-100 hover:border-orange-500 hover:text-orange-600'}`}
            onClick={() => setTab('harvesting')}
            title="Harvesting Tab"
          >
            Harvesting
          </button>
        </div>

        {/* Single Batch Card for both Monitoring and Harvesting */}
        <Card title="Batch" right={<Pill>{selectedBatch ? `Start ${formatDate(selectedBatch.startDate)}` : "Select a batch"}</Pill>}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Batch">
              <select
                value={batchId}
                onChange={e => setBatchId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Select Batch"
              >
                {batches.map(bId => (
                  <option key={bId} value={bId}>{bId}</option>
                ))}
              </select>
            </Field>
            <Field label="Population">
              <input readOnly value={selectedBatch?.population ?? ""} className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50" title="Batch Population" />
            </Field>
            <Field label="Age">
              <input readOnly value={selectedBatch ? `${todayAge} days` : ""} className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50" title="Batch Age" />
            </Field>
            <Field label="Mortality">
              <input readOnly value={mortalityEntries.filter(() => selectedBatch && batchDetails.find(b => b.id === batchId)?.id === batchId).reduce((sum, entry) => sum + entry.count, 0)} className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50" title="Total Mortality" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-3">
            <button className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100" type="button" title="Add Batch">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add
            </button>
            <button className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100" type="button" title="Edit Batch">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" /></svg>
              Edit
            </button>
            <button className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100" type="button" title="Delete Batch">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m5 0H4" /></svg>
              Delete
            </button>
          </div>
        </Card>

        {tab === 'harvesting' && (
          <>
            {/* Harvesting Table OUTSIDE the Card */}
            {/* Bird Quality, Type, Weight Total, Add to Inventory */}
            <Card title="Harvesting Entry">
            <div className="overflow-x-auto border rounded-lg max-h-72">
              <table className="min-w-full text-sm bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr className="text-gray-700 bg-gray-100">
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Bird Quantity</th>
            
                    <th className="px-4 py-2 border">Weight Total</th>
                    <th className="px-4 py-2 border">Unit</th>
                    <th className="px-4 py-2 border">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Replace with dynamic DB data when available */}
                  {/* Example: harvestingEntries.map(row => ( ... )) */}
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">No entries yet</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid items-end grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 sm:gap-6">
              <div className="sm:col-span-2">
                <Field label="Bird Quantity">
                  <input type="text" className="w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter quantity" title="Bird Quantity" />
                </Field>
              </div>
              <div>
                <Field label="Type">
                  <select className="w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" title="Select Type">
                    <option value="">Select type</option>
                    <option value="Harvest">Harvest</option>
                    <option value="Cull">Cull</option>
                  </select>
                </Field>
              </div>
              <div>
                <Field label="Weight Total">
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" min="0" step="0.01" title="Weight Total" />
                    <span className="text-sm text-gray-700">Kg</span>
                  </div>
                </Field>
              </div>
              <div className="sm:col-span-2 md:col-span-4 flex items-end">
                <button className="w-fit px-3 py-1 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600" type="button" title="Add to Inventory">
                  Add to Inventory
                </button>
              </div>
            </div>
            </Card>
          </>
                  
        )}

        {tab === 'monitoring' && (
          <React.Fragment>
            {monitoringPage === 1 && (
              <>
                

                <Card title="Feed and Medicine Consumption">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
                    {/* Left side: form and table */}
                    <div className="space-y-4 lg:col-span-2">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                        <div className="sm:col-span-2">
                          <Field label="Item">
                            <select
                              value={fmItemId}
                              onChange={e => {
                                setFmItemId(e.target.value);
                                const def = items.find(i => i.id === e.target.value)?.defaultUnit as Unit | undefined;
                                if (def) setFmUnit(def);
                              }}
                              className="w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              title="Select Item"
                            >
                              {feedMedItems.map(it => (
                                <option key={it.id} value={it.id}>{it.name}</option>
                              ))}
                            </select>
                          </Field>
                        </div>
                        <div>
                          <Field label="Quantity">
                            <NumberInput value={fmQty} onChange={setFmQty} min={0} step={0.01} placeholder="0" title="Feed/Medicine Quantity" />
                          </Field>
                        </div>
                        <div>
                          <Field label="Unit">
                            <select
                              value={fmUnit}
                              onChange={e => setFmUnit(e.target.value as Unit)}
                              className="w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              title="Select Unit"
                            >
                              {(["kg","g","lb","pcs","ml","l"] as Unit[]).map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </Field>
                        </div>
                      </div>

                      <div className="sm:col-span-2 md:col-span-4 flex items-end gap-2">
                        <button
                          onClick={() => {
                            if (!fmItemId || !fmQty) return alert("Pick item and qty");
                            addFeedMedEntry({ itemId: fmItemId, qty: fmQty, unit: fmUnit });
                            setFmQty(undefined);
                          }}
                          className="w-fit px-3 py-1 text-sm font-semibold text-white transition-colors bg-orange-500 rounded-xl hover:bg-orange-600"
                          title="Add Feed/Medicine Entry"
                        >
                          Add entry
                        </button>
                        {isAdmin && (
                          <button className="w-fit px-3 py-1 text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-100" type="button" title="Edit Feed/Medicine Items">
                            Edit Items
                          </button>
                        )}
                      </div>

                      <div className="overflow-x-auto border rounded-lg max-h-72">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-600 border-b bg-gray-50">
                              <th className="py-2 pr-3">Time</th>
                              <th className="py-2 pr-3">Item</th>
                              <th className="py-2 pr-3">Qty</th>
                              <th className="py-2">Unit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {feedMedEntries.map(row => (
                              <tr key={row.id} className="border-b last:border-0">
                                <td className="py-2 pr-3 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                                <td className="py-2 pr-3">{row.itemName}</td>
                                <td className="py-2 pr-3">{row.qty}</td>
                                <td className="py-2">{row.unit}</td>
                              </tr>
                            ))}
                            {feedMedEntries.length === 0 && (
                              <tr>
                                <td className="py-3 text-gray-500" colSpan={4}>No entries yet</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right side: chart */}
                    <div className="lg:col-span-1">
                      <ChartShell title="Feed chart" />
                    </div>
                  </div>
                </Card>

                <Divider />
      
              </>
            )}
            {monitoringPage === 2 && (
              <>
                {/* Inventory usage */}
                <Card title="Inventory usage">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
                    <div className="space-y-4 lg:col-span-2">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                        <div className="sm:col-span-2">
                          <Field label="Item">
                            <select
                              value={useItemId}
                              onChange={e => setUseItemId(e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              title="Select Item"
                            >
                              {generalItems.map(it => (
                                <option key={it.id} value={it.id}>{it.name}</option>
                              ))}
                            </select>
                          </Field>
                        </div>
                        <div>
                          <Field label="Quantity">
                            <NumberInput value={useQty} onChange={setUseQty} min={0} step={1} placeholder="0" title="Inventory Usage Quantity" />
                          </Field>
                        </div>
                        <div className="sm:col-span-2 md:col-span-4 flex items-end gap-2">
                          <button
                            onClick={() => {
                              if (!useItemId || !useQty) return alert("Pick item and qty");
                              addUsageEntry({ itemId: useItemId, qty: useQty });
                              setUseQty(undefined);
                            }}
                            className="w-fit px-3 py-1 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600"
                            title="Add Inventory Usage Entry"
                          >
                            Add entry
                          </button>
                          {isAdmin && (
                            <button className="w-fit px-3 py-1 text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-100" type="button" title="Edit Inventory Items">
                              Edit Items
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="overflow-x-auto border rounded-lg max-h-72">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-600 border-b bg-gray-50">
                              <th className="py-2 pr-3">Time</th>
                              <th className="py-2 pr-3">Item</th>
                              <th className="py-2">Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usageEntries.map(row => (
                              <tr key={row.id} className="border-b last:border-0">
                                <td className="py-2 pr-3 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                                <td className="py-2 pr-3">{row.itemName}</td>
                                <td className="py-2">{row.qty}</td>
                              </tr>
                            ))}
                            {usageEntries.length === 0 && (
                              <tr>
                                <td className="py-3 text-gray-500" colSpan={3}>No entries yet</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <ChartShell title="Inventory usage chart" />
                    </div>
                  </div>
                </Card>

                {/* Mortality */}
                <Card title="Mortality">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
                    <div className="space-y-4 lg:col-span-2">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                        <div>
                          <Field label="Count">
                            <NumberInput value={mortCount} onChange={setMortCount} min={0} step={1} placeholder="0" title="Mortality Count" />
                          </Field>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                            <span className="shrink-0">Cause</span>
                            <input
                              value={mortCause}
                              onChange={e => setMortCause(e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              title="Mortality Cause"
                            />
                          </label>
                        </div>
                        <div className="sm:col-span-2 md:col-span-4 flex items-end gap-2">
                          <button
                            onClick={() => {
                              if (!mortCount) return alert("Enter a count");
                              addMortalityEntry({ count: mortCount, cause: mortCause });
                              setMortCount(undefined);
                              setMortCause("");
                            }}
                            className="w-fit px-3 py-1 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600"
                            title="Add Mortality Entry"
                          >
                            Add entry
                          </button>
                          {isAdmin && (
                            <button className="w-fit px-3 py-1 text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-100" type="button" title="Edit Mortality Entries">
                              Edit Items
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="overflow-x-auto border rounded-lg max-h-72">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-600 border-b bg-gray-50">
                              <th className="py-2 pr-3">Time</th>
                              <th className="py-2 pr-3">Count</th>
                              <th className="py-2">Cause</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mortalityEntries.map(row => (
                              <tr key={row.id} className="border-b last:border-0">
                                <td className="py-2 pr-3 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                                <td className="py-2 pr-3">{row.count}</td>
                                <td className="py-2">{row.cause ?? ""}</td>
                              </tr>
                            ))}
                            {mortalityEntries.length === 0 && (
                              <tr>
                                <td className="py-3 text-gray-500" colSpan={3}>No entries yet</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <ChartShell title="Mortality chart" />
                    </div>
                  </div>
                </Card>

                <Divider />
              </>
            )}
            {/* Save Button for Mobile View */}
            {tab === 'monitoring' && monitoringPage === 2 && (
              <div className="flex justify-center w-full px-2 m-0 mt-8 sm:pr-6 md:pr-10 lg:pr-20 sm:justify-end">
                <button className="flex items-center justify-center w-full sm:max-w-xs gap-2 px-4 py-2 text-base font-bold text-white bg-green-600 shadow-lg hover:bg-green-700 rounded-xl" type="button" title="Save All Changes">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Save
                </button>
              </div>
            )}
            {/* Navigation Buttons for Monitoring Pages */}
            <div className="flex justify-between items-center mt-8">
              {monitoringPage === 2 && (
                <button 
                  onClick={() => setMonitoringPage(1)}
                  className="px-4 py-2 text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-100"
                  title="Previous Page"
                >
                  Previous
                </button>
              )}
              {monitoringPage === 1 && (
                <button 
                  onClick={() => setMonitoringPage(2)}
                  className="ml-auto px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600"
                  title="Next Page"
                >
                  Next
                </button>
              )}
            </div>
            <div className="text-sm text-gray-500 text-center mt-2">
              Page {monitoringPage} of 2
            </div>
          </React.Fragment>
        )}
      </main>
      {/* Save Button as normal block below content, only in monitoring */}
{
}

   
        </div>
      
   
  );
}