import React, { useState, useEffect } from "react";

/**
 * Poultry Farm Monitoring UI - UI only
 * React + TypeScript + TailwindCSS
 * No API wiring. Sample in-memory data.
 */

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

type MortalityEntryFrontend = MortalityEntry & { backendMortalityId?: string; batchId: string };

type FeedMedItem = {
  id: string;
  name: string;
  category: string;
  defaultUnit: Unit;
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

export default function BatchMain() {
  // Sample data

  // Entries
  const [feedMedEntries, setFeedMedEntries] = useState<FeedMedicineEntry[]>([]);
  const [usageEntries, setUsageEntries] = useState<InventoryUsageEntry[]>([]);
  const [mortalityEntries, setMortalityEntries] = useState<MortalityEntryFrontend[]>([]);

  // New states for batch and mortality IDs
  const [batchIDs, setBatchIDs] = useState<string[]>([]);
  const [selectedBatchID, setSelectedBatchID] = useState<string>("");
  const [mortalityIDsForBatch, setMortalityIDsForBatch] = useState<string[]>([]);

  // New states for cm_batches dropdown
  const [cmBatchesIDs, setCmBatchesIDs] = useState<string[]>([]);
  const [selectedCmBatchID, setSelectedCmBatchID] = useState<string>("");
  const [currentChickenCount, setCurrentChickenCount] = useState<number | undefined>(undefined); // Re-added as requested

  const [feedMedItems, setFeedMedItems] = useState<FeedMedItem[]>([]);

  useEffect(() => {
    // Fetch unique batch IDs from cm_mortality
    fetch("http://localhost:8080/uniqueBatchIDs")
      .then(response => response.json())
      .then((data: string[]) => {
        setBatchIDs(data);
        if (data.length > 0) {
          setSelectedBatchID(data[0]);
        }
      })
      .catch(error => console.error("Error fetching unique batch IDs:", error));

    // Fetch unique batch IDs from cm_batches
    fetch("http://localhost:8080/uniqueBatchesFromCmBatches")
      .then(response => response.json())
      .then((data: string[]) => {
        setCmBatchesIDs(data);
        if (data.length > 0) {
          setSelectedCmBatchID(data[0]);
        }
      })
      .catch(error => console.error("Error fetching unique batch IDs from cm_batches:", error));

    fetch("http://localhost:8080/feedmedicineitems")
      .then(response => response.json())
      .then((data: FeedMedItem[]) => {
        setFeedMedItems(data);
        if (data.length > 0) {
          setFmItemId(data[0].id);
          setFmUnit(data[0].defaultUnit);
        }
      })
      .catch(error => console.error("Error fetching feed/medicine items:", error));

  }, []);

  useEffect(() => {
    // Fetch mortality IDs for the selected batch ID
    if (selectedBatchID) {
      fetch(`http://localhost:8080/mortalityIDs/${selectedBatchID}`)
        .then(response => response.json())
        .then((data: string[]) => {
          setMortalityIDsForBatch(data);
        })
        .catch(error => console.error("Error fetching mortality IDs for batch:", error));
    }
  }, [selectedBatchID]);

  useEffect(() => {
    // Fetch CurrentChicken for the selected cm_batches Batch ID
    if (selectedCmBatchID) {
      fetch(`http://localhost:8080/batch/${selectedCmBatchID}`)
        .then(response => response.json())
        .then((data: { currentChicken: number; expectedHarvestDate: string; totalChicken: number; status: string; notes?: string }) => {
          setCurrentChickenCount(data.currentChicken); // Re-added
        })
        .catch(error => console.error("Error fetching current chicken count for batch:", error));
    } else {
      setCurrentChickenCount(undefined); // Re-added
    }
  }, [selectedCmBatchID]);

  // Get user role from localStorage
  const userRole = localStorage.getItem("role");
  const isAdmin = userRole === "admin";

  // Local forms
  const [fmItemId, setFmItemId] = useState("i1");
  const [fmQty, setFmQty] = useState<number | undefined>(undefined);
  const [fmUnit, setFmUnit] = useState<Unit>("kg");

  const [useItemId, setUseItemId] = useState("");
  const [useQty, setUseQty] = useState<number | undefined>(undefined);

  const [mortCount, setMortCount] = useState<number | undefined>(undefined);
  const [mortCause, setMortCause] = useState<string>("");

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
    const entry: FeedMedicineEntry = {
      id: crypto.randomUUID(),
      itemId: p.itemId,
      itemName: "N/A", // Default name since items are removed
      qty: p.qty,
      unit: p.unit,
      timestamp: new Date().toISOString(),
    };
    setFeedMedEntries(prev => [entry, ...prev]);
  }

  function addUsageEntry(p: { itemId: string; qty: number }) {
    const entry: InventoryUsageEntry = {
      id: crypto.randomUUID(),
      itemId: p.itemId,
      itemName: "N/A", // Default name since items are removed
      qty: p.qty,
      timestamp: new Date().toISOString(),
    };
    setUsageEntries(prev => [entry, ...prev]);
  }

  function addMortalityEntry(p: { count: number; cause?: string; batchId: string }) {
    const entry: MortalityEntryFrontend = {
      id: crypto.randomUUID(),
      batchId: p.batchId,
      count: p.count,
      cause: p.cause?.trim() ? p.cause.trim() : undefined,
      timestamp: new Date().toISOString(),
    };

    fetch("http://localhost:8080/mortality", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    })
      .then(response => response.json())
      .then((data: MortalityEntryFrontend) => {
        setMortalityEntries(prev => [data, ...prev]);
      })
      .catch(error => console.error("Error adding mortality entry:", error));
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
        <Card title="Batch" right={null}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Select Batch ID (Mortality)">
              <select
                value={selectedBatchID}
                onChange={e => setSelectedBatchID(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Select Batch ID (Mortality)"
              >
                <option value="">Select a Batch ID</option>
                {batchIDs.map(batchID => (
                  <option key={batchID} value={batchID}>
                    {batchID}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mortality IDs for Batch">
              <div className="w-full px-3 py-2 text-sm bg-gray-100 border rounded-lg">
                {mortalityIDsForBatch.length > 0
                  ? mortalityIDsForBatch.join(", ")
                  : "No Mortality IDs for this Batch"}
              </div>
            </Field>
            <Field label="Select Batch ID (cm_batches)">
              <select
                value={selectedCmBatchID}
                onChange={e => setSelectedCmBatchID(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Select Batch ID (cm_batches)"
              >
                <option value="">Select a Batch ID</option>
                {cmBatchesIDs.map(batchID => (
                  <option key={batchID} value={batchID}>
                    {batchID}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Current Chicken Count">
              <div className="w-full px-3 py-2 text-sm bg-gray-100 border rounded-lg">
                {currentChickenCount !== undefined
                  ? currentChickenCount
                  : "Select a Batch to see count"}
              </div>
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
              <div className="flex items-end sm:col-span-2 md:col-span-4">
                <button className="px-3 py-1 text-sm font-semibold text-white bg-orange-500 w-fit rounded-xl hover:bg-orange-600" type="button" title="Add to Inventory">
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
                    {/* Left side: form */}
                    <div className="space-y-4 lg:col-span-2">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                        <div className="sm:col-span-2">
                          <Field label="Item">
                            <select
                              value={fmItemId}
                              onChange={e => {
                                const selectedItem = feedMedItems.find(item => item.id === e.target.value);
                                setFmItemId(e.target.value);
                                if (selectedItem) {
                                  setFmUnit(selectedItem.defaultUnit);
                                }
                              }}
                              className="w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              title="Select Feed/Medicine Item"
                            >
                              {feedMedItems.map(item => (
                                <option key={item.id} value={item.id}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => {
                              if (fmItemId && fmQty !== undefined) {
                                addFeedMedEntry({
                                  itemId: fmItemId,
                                  qty: fmQty,
                                  unit: fmUnit
                                });
                                setFmQty(undefined);
                              }
                            }}
                            className="w-full px-3 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                            title="Add Feed/Medicine Entry"
                          >
                            Add Entry
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Right side: chart */}
                    <div className="lg:col-span-1">
                      <ChartShell title="Consumption Trend" />
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
                              {[{ id: "i4", name: "Bedding", category: "general", defaultUnit: "pcs" }].map(it => (
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
                        <div className="flex items-end gap-2 sm:col-span-2 md:col-span-4">
                          <button
                            onClick={() => {
                              if (!useItemId || !useQty) return alert("Pick item and qty");
                              addUsageEntry({ itemId: useItemId, qty: useQty });
                              setUseQty(undefined);
                            }}
                            className="px-3 py-1 text-sm font-semibold text-white bg-orange-500 w-fit rounded-xl hover:bg-orange-600"
                            title="Add Inventory Usage Entry"
                          >
                            Add entry
                          </button>
                          {isAdmin && (
                            <button className="px-3 py-1 text-sm font-semibold text-gray-800 bg-white border border-gray-300 shadow-sm w-fit rounded-xl hover:bg-gray-100" type="button" title="Edit Inventory Items">
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
                            <NumberInput value={mortCount} onChange={setMortCount} min={0} step={1} title="Mortality Count" />
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
                        <div className="flex items-end gap-2 sm:col-span-2 md:col-span-4">
                          <button
                            onClick={() => {
                              if (!mortCount) return alert("Enter a count");
                              addMortalityEntry({ count: mortCount, cause: mortCause, batchId: "N/A" }); // Assuming batchId is not available here
                              setMortCount(undefined);
                              setMortCause("");
                            }}
                            className="px-3 py-1 text-sm font-semibold text-white bg-orange-500 w-fit rounded-xl hover:bg-orange-600"
                            title="Add Mortality Entry"
                          >
                            Add entry
                          </button>
                          {isAdmin && (
                            <button className="px-3 py-1 text-sm font-semibold text-gray-800 bg-white border border-gray-300 shadow-sm w-fit rounded-xl hover:bg-gray-100" type="button" title="Edit Mortality Entries">
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
                              <th className="py-2 pr-3">Mortality ID</th>
                              <th className="py-2 pr-3">Count</th>
                              <th className="py-2">Cause</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mortalityEntries.map(row => (
                              <tr key={row.id} className="border-b last:border-0">
                                <td className="py-2 pr-3 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                                <td className="py-2 pr-3">{row.backendMortalityId ?? "N/A"}</td>
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
                <button className="flex items-center justify-center w-full gap-2 px-4 py-2 text-base font-bold text-white bg-green-600 shadow-lg sm:max-w-xs hover:bg-green-700 rounded-xl" type="button" title="Save All Changes">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Save
                </button>
              </div>
            )}
            {/* Navigation Buttons for Monitoring Pages */}
            <div className="flex items-center justify-between mt-8">
              {monitoringPage === 2 && (
                <button 
                  onClick={() => setMonitoringPage(1)}
                  className="px-4 py-2 text-sm font-semibold text-gray-800 bg-white border border-gray-300 shadow-sm rounded-xl hover:bg-gray-100"
                  title="Previous Page"
                >
                  Previous
                </button>
              )}
              {monitoringPage === 1 && (
                <button 
                  onClick={() => setMonitoringPage(2)}
                  className="px-4 py-2 ml-auto text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600"
                  title="Next Page"
                >
                  Next
                </button>
              )}
            </div>
            <div className="mt-2 text-sm text-center text-gray-500">
              Page {monitoringPage} of 2
            </div>
          </React.Fragment>
        )}
      </main>
      {/* Save Button as normal block below content, only in monitoring */}
   
        </div>
      
   
  );
}