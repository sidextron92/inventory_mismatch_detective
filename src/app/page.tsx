"use client";

import { useState } from "react";

interface Summary {
  systemQuantity: number;
  physicalQuantity: number;
  mismatch: number;
}

interface StockLog {
  id: number;
  variantID: number;
  sizeID: number;
  sellerID: number;
  stockType: string;
  zone: string;
  quantity: number;
  status: number;
  created_at: string;
  triggerType: string;
  lastUpdatedBy: string | null;
  lastUpdatedByType: string | null;
  isRemoved: number;
  isVisible: number;
  dbUser: string | null;
  universal: number;
}

interface LotRecord {
  id: number;
  variantId: number;
  sizeId: number;
  lotSize: number;
  warehouseId: number;
  skOrderId: string | null;
  orderId: string | null;
  status: string;
  modifiedOn: string | null;
  createdOn: string | null;
  updatedOn: string | null;
}

interface InvestigationResult {
  summary: Summary;
  stockLogs: StockLog[];
  lotRecords: LotRecord[];
  warehouseInventory: Record<string, unknown>[];
  rmLotAttribution: Record<string, unknown>[];
}

function DynamicTable({
  data,
  emptyMessage = "No records found",
}: {
  data: Record<string, unknown>[];
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-gray-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50/80 border-b border-gray-200">
          {columns.map((col) => (
            <th
              key={col}
              className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className={`hover:!bg-indigo-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/80"}`}>
            {Object.values(row).map((val, j) => (
              <td
                key={j}
                className="px-4 py-2.5 text-[13px] text-gray-700 whitespace-nowrap font-mono"
              >
                {val === null || val === undefined ? (
                  <span className="text-gray-300">-</span>
                ) : (
                  String(val)
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Home() {
  const [variantId, setVariantId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"vss" | "lm" | "wi" | "rmla">("vss");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({
        variantId,
        sizeId,
        warehouseId,
        sellerId,
      });
      const res = await fetch(`/api/investigate?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { key: "vss" as const, label: "VSS", desc: "variant_size_stock_logs", count: result?.stockLogs.length },
    { key: "lm" as const, label: "LM", desc: "lot_master", count: result?.lotRecords.length },
    { key: "wi" as const, label: "WI", desc: "warehouse_inventory", count: result?.warehouseInventory.length },
    { key: "rmla" as const, label: "RMLA", desc: "rm_lot_level_attribution", count: result?.rmLotAttribution.length },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">
          Inventory Mismatch Detective
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Debug inventory discrepancies between system and warehouse
        </p>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Notes */}
        <div className="bg-amber-50/70 rounded-lg border border-amber-200/60 p-4 mb-5">
          <label className="block text-[13px] font-semibold text-amber-800 mb-1.5">
            Investigation Notes
          </label>
          <textarea
            className="w-full bg-white border border-amber-200/80 rounded-md px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent resize-y min-h-[60px] placeholder:text-gray-400"
            rows={3}
            placeholder="Jot down your observations here..."
          />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-gray-200 p-5 mb-5 shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Variant ID", value: variantId, setter: setVariantId, placeholder: "e.g. 2145785" },
              { label: "Size ID", value: sizeId, setter: setSizeId, placeholder: "e.g. 1000192" },
              { label: "Warehouse ID", value: warehouseId, setter: setWarehouseId, placeholder: "e.g. 100" },
              { label: "Seller ID", value: sellerId, setter: setSellerId, placeholder: "e.g. 1490471317" },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">
                  {field.label}
                </label>
                <input
                  type="number"
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] font-mono text-gray-900 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? "Investigating..." : "Investigate"}
            </button>
            <button
              type="button"
              onClick={() => {
                const text = `variantId=${variantId} and sizeId=${sizeId} and warehouseid=${warehouseId} and sellerid=${sellerId}`;
                navigator.clipboard.writeText(text);
              }}
              className="bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              Copy Query
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-5 text-[13px] font-medium">
            {error}
          </div>
        )}

        {result && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <SummaryCard
                label="System Quantity"
                value={result.summary.systemQuantity}
                sublabel="variant_size_stock_logs (latest)"
                color="blue"
              />
              <SummaryCard
                label="Physical Quantity"
                value={result.summary.physicalQuantity}
                sublabel="lot_master (in-shelf + rto-in-shelf-good)"
                color="green"
              />
              <SummaryCard
                label="Mismatch"
                value={result.summary.mismatch}
                sublabel="System - Physical"
                color={result.summary.mismatch === 0 ? "green" : "red"}
              />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6 shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50/50">
                <nav className="flex -mb-px overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-5 py-3 text-[13px] font-semibold border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === tab.key
                          ? "border-blue-500 text-blue-600 bg-white"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="font-bold">{tab.label}</span>
                      <span className="hidden sm:inline text-gray-400 font-normal"> - {tab.desc}</span>
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        activeTab === tab.key
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {tab.count ?? 0}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* VSS Tab */}
              {activeTab === "vss" && (
                <>
                  <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50/30">
                    <p className="text-[12px] text-gray-400 font-medium">
                      Last 30 records ordered by created_at DESC
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200">
                          {[
                            "ID",
                            "Quantity",
                            "Status",
                            "Trigger Type",
                            "Stock Type",
                            "Created At",
                            "Last Updated By",
                            "Updated By Type",
                            "isRemoved",
                            "isVisible",
                            "dbUser",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.stockLogs.length === 0 ? (
                          <tr>
                            <td
                              colSpan={11}
                              className="px-4 py-12 text-center text-gray-400 text-sm"
                            >
                              No records found
                            </td>
                          </tr>
                        ) : (
                          result.stockLogs.map((log, i) => (
                            <tr
                              key={log.id}
                              className={`hover:!bg-indigo-50 ${i === 0 ? "!bg-blue-50/70" : i % 2 === 0 ? "bg-white" : "bg-gray-50/80"}`}
                            >
                              <td className="px-4 py-2.5 font-mono text-[13px] text-gray-500">
                                {log.id}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-[14px] font-bold text-gray-900">
                                {log.quantity}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-[13px] text-gray-700">
                                {log.status}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="inline-block bg-indigo-50 text-indigo-700 rounded-md px-2 py-0.5 text-[12px] font-semibold">
                                  {log.triggerType}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-[13px] text-gray-600">
                                {log.stockType}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-[13px] text-gray-600 whitespace-nowrap">
                                {log.created_at}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-[13px] text-gray-500">
                                {log.lastUpdatedBy ?? <span className="text-gray-300">-</span>}
                              </td>
                              <td className="px-4 py-2.5 text-[13px] text-gray-500">
                                {log.lastUpdatedByType ?? <span className="text-gray-300">-</span>}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-[13px] text-gray-500">
                                {log.isRemoved}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-[13px] text-gray-500">
                                {log.isVisible}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-[13px] text-gray-500">
                                {log.dbUser ?? <span className="text-gray-300">-</span>}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* LM Tab */}
              {activeTab === "lm" && (
                <>
                  <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50/30">
                    <p className="text-[12px] text-gray-400 font-medium">
                      All lots for this variant x size x warehouse
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200">
                          {[
                            "Lot ID",
                            "Lot Size",
                            "Status",
                            "SK Order ID",
                            "Order ID",
                            "Created On",
                            "Modified On",
                            "Updated On",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.lotRecords.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-12 text-center text-gray-400 text-sm"
                            >
                              No records found
                            </td>
                          </tr>
                        ) : (
                          result.lotRecords.map((lot, i) => {
                            const isActive =
                              lot.status === "in-shelf" ||
                              lot.status === "rto-in-shelf-good";
                            return (
                              <tr
                                key={lot.id}
                                className={`hover:!bg-indigo-50 ${isActive ? "!bg-emerald-50/60" : i % 2 === 0 ? "bg-white" : "bg-gray-50/80"}`}
                              >
                                <td className="px-4 py-2.5 font-mono text-[13px] text-gray-500">
                                  {lot.id}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[14px] font-bold text-gray-900">
                                  {lot.lotSize}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span
                                    className={`inline-block rounded-md px-2 py-0.5 text-[12px] font-semibold ${
                                      isActive
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {lot.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[13px] text-gray-600">
                                  {lot.skOrderId ?? <span className="text-gray-300">-</span>}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[13px] text-gray-600">
                                  {lot.orderId ?? <span className="text-gray-300">-</span>}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[13px] text-gray-600 whitespace-nowrap">
                                  {lot.createdOn ?? <span className="text-gray-300">-</span>}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[13px] text-gray-600 whitespace-nowrap">
                                  {lot.modifiedOn ?? <span className="text-gray-300">-</span>}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[13px] text-gray-600 whitespace-nowrap">
                                  {lot.updatedOn ?? <span className="text-gray-300">-</span>}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* RMLA Tab */}
              {activeTab === "rmla" && (
                <>
                  <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50/30">
                    <p className="text-[12px] text-gray-400 font-medium">
                      rm_lot_level_attribution for this variant x size x warehouse
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <DynamicTable data={result.rmLotAttribution} />
                  </div>
                </>
              )}

              {/* WI Tab */}
              {activeTab === "wi" && (
                <>
                  <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50/30">
                    <p className="text-[12px] text-gray-400 font-medium">
                      warehouse_inventory for this variant x size x warehouse
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <DynamicTable data={result.warehouseInventory} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sublabel,
  color,
}: {
  label: string;
  value: number;
  sublabel: string;
  color: "blue" | "green" | "red";
}) {
  const styles = {
    blue: { card: "border-blue-200/60 bg-blue-50/50", value: "text-blue-700" },
    green: { card: "border-emerald-200/60 bg-emerald-50/50", value: "text-emerald-700" },
    red: { card: "border-red-200/60 bg-red-50/50", value: "text-red-700" },
  };

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${styles[color].card}`}>
      <p className="text-[13px] font-semibold text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 font-mono tracking-tight ${styles[color].value}`}>
        {value}
      </p>
      <p className="text-[11px] text-gray-400 mt-1.5">{sublabel}</p>
    </div>
  );
}
