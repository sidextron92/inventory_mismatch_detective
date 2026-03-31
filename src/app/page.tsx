"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Summary {
  systemQuantity: number;
  physicalQuantity: number;
  mismatch: number;
  unsoldRmla: number;
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
  orderDetails: Record<string, unknown>[];
}

function DynamicTable({ data, boldColumn }: { data: Record<string, unknown>[]; boldColumn?: string }) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        No records found
      </div>
    );
  }
  const columns = Object.keys(data[0]);
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          {columns.map((col) => (
            <TableHead key={col} className="text-xs font-semibold">
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={i} className={""}>
            {Object.entries(row).map(([key, val], j) => (
              <TableCell key={j} className={`font-mono text-xs ${boldColumn && key === boldColumn ? "font-bold text-sm" : ""}`}>
                {val === null || val === undefined ? (
                  <span className="text-muted-foreground/40">-</span>
                ) : (
                  String(val)
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
  const [rmlaUnsoldOnly, setRmlaUnsoldOnly] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({ variantId, sizeId, warehouseId, sellerId });
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Inventory Mismatch Detective</h1>
          <p className="text-sm text-muted-foreground">
            Debug inventory discrepancies between system and warehouse
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="dark-mode" className="text-sm text-muted-foreground">Dark</Label>
          <Switch id="dark-mode" checked={dark} onCheckedChange={setDark} />
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-6 space-y-5">
        {/* Notes */}
        <Card className="bg-amber-50/50 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-800/30">
          <CardContent className="pt-5">
            <Label className="text-amber-900 dark:text-amber-400 font-semibold mb-2 block">Investigation Notes</Label>
            <Textarea
              placeholder="Jot down your observations here..."
              rows={3}
              className="bg-white dark:bg-background border-amber-200/80 dark:border-amber-800/30 resize-y"
            />
          </CardContent>
        </Card>

        {/* Input Form */}
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Variant ID", value: variantId, setter: setVariantId, placeholder: "e.g. 2145785" },
                  { label: "Size ID", value: sizeId, setter: setSizeId, placeholder: "e.g. 1000192" },
                  { label: "Warehouse ID", value: warehouseId, setter: setWarehouseId, placeholder: "e.g. 100" },
                  { label: "Seller ID", value: sellerId, setter: setSellerId, placeholder: "e.g. 1490471317" },
                ].map((field) => (
                  <div key={field.label} className="space-y-1.5">
                    <Label>{field.label}</Label>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      required
                      placeholder={field.placeholder}
                      className="font-mono"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Investigating..." : "Investigate"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const text = `variantId=${variantId} and sizeId=${sizeId} and warehouseid=${warehouseId} and sellerid=${sellerId}`;
                    navigator.clipboard.writeText(text);
                  }}
                >
                  Copy Query
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-5 text-destructive text-sm font-medium">
              {error}
            </CardContent>
          </Card>
        )}

        {result && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryCard
                label="System Qty"
                value={result.summary.systemQuantity}
                sublabel="VSS (latest)"
                variant="default"
              />
              <SummaryCard
                label="Physical Qty"
                value={result.summary.physicalQuantity}
                sublabel="LM (in-shelf)"
                variant="success"
              />
              <SummaryCard
                label="Unsold RMLA"
                value={result.summary.unsoldRmla}
                sublabel="Active unsold lots"
                variant="purple"
              />
              <SummaryCard
                label="Mismatch"
                value={result.summary.mismatch}
                sublabel="System - Physical"
                variant={result.summary.mismatch === 0 ? "success" : "danger"}
              />
            </div>

            {/* Data Tabs */}
            <Tabs defaultValue="vss">
              <TabsList variant="line" className="bg-transparent p-0 gap-2 h-auto flex-wrap">
                <TabsTrigger
                  value="vss"
                  className="rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm after:hidden data-active:border-blue-500 data-active:bg-blue-50 dark:data-active:bg-blue-950/40 data-active:shadow-md"
                >
                  <span className="font-bold">VSS</span>
                  <span className="hidden sm:inline text-muted-foreground font-normal ml-1">variant_size_stock_logs</span>
                  <Badge variant="secondary" className="ml-2 text-[11px]">{result.stockLogs.length}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="lm"
                  className="rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm after:hidden data-active:border-emerald-500 data-active:bg-emerald-50 dark:data-active:bg-emerald-950/40 data-active:shadow-md"
                >
                  <span className="font-bold">LM</span>
                  <span className="hidden sm:inline text-muted-foreground font-normal ml-1">lot_master</span>
                  <Badge variant="secondary" className="ml-2 text-[11px]">{result.lotRecords.length}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="wi"
                  className="rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm after:hidden data-active:border-violet-500 data-active:bg-violet-50 dark:data-active:bg-violet-950/40 data-active:shadow-md"
                >
                  <span className="font-bold">WI</span>
                  <span className="hidden sm:inline text-muted-foreground font-normal ml-1">warehouse_inventory</span>
                  <Badge variant="secondary" className="ml-2 text-[11px]">{result.warehouseInventory.length}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="rmla"
                  className="rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm after:hidden data-active:border-amber-500 data-active:bg-amber-50 dark:data-active:bg-amber-950/40 data-active:shadow-md"
                >
                  <span className="font-bold">RMLA</span>
                  <span className="hidden sm:inline text-muted-foreground font-normal ml-1">rm_lot_level_attribution</span>
                  <Badge variant="secondary" className="ml-2 text-[11px]">{result.rmLotAttribution.length}</Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="od"
                  className="rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm after:hidden data-active:border-pink-500 data-active:bg-pink-50 dark:data-active:bg-pink-950/40 data-active:shadow-md"
                >
                  <span className="font-bold">OD</span>
                  <span className="hidden sm:inline text-muted-foreground font-normal ml-1">order_details</span>
                  <Badge variant="secondary" className="ml-2 text-[11px]">{result.orderDetails.length}</Badge>
                </TabsTrigger>
              </TabsList>

              {/* VSS */}
              <TabsContent value="vss">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">variant_size_stock_logs</CardTitle>
                    <CardDescription>Last 30 records ordered by created_at DESC</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          {["ID", "Quantity", "Trigger Type", "Created At", "Last Updated By", "Updated By Type", "isRemoved", "isVisible", "dbUser"].map((h) => (
                            <TableHead key={h} className="text-xs font-semibold">{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.stockLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                              No records found
                            </TableCell>
                          </TableRow>
                        ) : (
                          result.stockLogs.map((log, i) => (
                            <TableRow key={log.id} className={i === 0 ? "bg-blue-50/60 dark:bg-blue-950/30" : ""}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{log.id}</TableCell>
                              <TableCell className="font-mono text-sm font-bold">{log.quantity}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs font-medium">{log.triggerType}</Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{log.created_at}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">{log.lastUpdatedBy ?? <span className="opacity-30">-</span>}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{log.lastUpdatedByType ?? <span className="opacity-30">-</span>}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">{log.isRemoved}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">{log.isVisible}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">{log.dbUser ?? <span className="opacity-30">-</span>}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* LM */}
              <TabsContent value="lm">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">lot_master</CardTitle>
                    <CardDescription>All lots for this variant x size x warehouse</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          {["Lot ID", "Lot Size", "Status", "SK Order ID", "Order ID", "Created On", "Modified On", "Updated On"].map((h) => (
                            <TableHead key={h} className="text-xs font-semibold">{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.lotRecords.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                              No records found
                            </TableCell>
                          </TableRow>
                        ) : (
                          result.lotRecords.map((lot, i) => {
                            const isActive = lot.status === "in-shelf" || lot.status === "rto-in-shelf-good";
                            return (
                              <TableRow key={lot.id} className={isActive ? "bg-emerald-50/50 dark:bg-emerald-950/30" : ""}>
                                <TableCell className="font-mono text-sm font-bold">{lot.id}</TableCell>
                                <TableCell className="font-mono text-xs">{lot.lotSize}</TableCell>
                                <TableCell>
                                  <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-emerald-600 text-xs" : "text-xs"}>
                                    {lot.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{lot.skOrderId ?? <span className="text-muted-foreground/30">-</span>}</TableCell>
                                <TableCell className="font-mono text-xs">{lot.orderId ?? <span className="text-muted-foreground/30">-</span>}</TableCell>
                                <TableCell className="font-mono text-xs">{lot.createdOn ?? <span className="text-muted-foreground/30">-</span>}</TableCell>
                                <TableCell className="font-mono text-xs">{lot.modifiedOn ?? <span className="text-muted-foreground/30">-</span>}</TableCell>
                                <TableCell className="font-mono text-xs">{lot.updatedOn ?? <span className="text-muted-foreground/30">-</span>}</TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* WI */}
              <TabsContent value="wi">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">warehouse_inventory</CardTitle>
                    <CardDescription>Warehouse inventory for this variant x size x warehouse</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <DynamicTable data={result.warehouseInventory} boldColumn="count" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* RMLA */}
              <TabsContent value="rmla">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">rm_lot_level_attribution</CardTitle>
                        <CardDescription>Lot level attribution for this variant x size x warehouse</CardDescription>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rmlaUnsoldOnly}
                          onChange={(e) => setRmlaUnsoldOnly(e.target.checked)}
                          className="rounded border-gray-300 h-4 w-4 accent-emerald-600"
                        />
                        <span className="text-sm font-medium">Show unsold only</span>
                      </label>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <RmlaTable data={result.rmLotAttribution} unsoldOnly={rmlaUnsoldOnly} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* OD */}
              <TabsContent value="od">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">order_details</CardTitle>
                    <CardDescription>Orders for this variant x size x seller</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <DynamicTable data={result.orderDetails} boldColumn="skorderid" />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            <div className="h-[60vh]" />
          </>
        )}
      </main>
    </div>
  );
}

function RmlaTable({ data, unsoldOnly }: { data: Record<string, unknown>[]; unsoldOnly: boolean }) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        No records found
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  const filteredData = unsoldOnly
    ? data.filter(
        (row) =>
          Number(row.soldDate) === 0 &&
          Number(row.activeStatus) === 1 &&
          Number(row.isRemoved) === 0
      )
    : data;

  function getRowClass(row: Record<string, unknown>, i: number): string {
    const activeStatus = Number(row.activeStatus);
    const isRemoved = Number(row.isRemoved);
    const soldDate = Number(row.soldDate);

    if (activeStatus === 0 || isRemoved === 1) {
      return "bg-red-50 dark:bg-red-950/30";
    }
    if (soldDate === 0 && activeStatus === 1 && isRemoved === 0) {
      return "bg-emerald-50 dark:bg-emerald-950/30";
    }
    return "";
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          {columns.map((col) => (
            <TableHead key={col} className="text-xs font-semibold">
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
              No matching records
            </TableCell>
          </TableRow>
        ) : (
          filteredData.map((row, i) => (
            <TableRow key={i} className={getRowClass(row, i)}>
              {Object.entries(row).map(([key, val], j) => (
                <TableCell key={j} className={`font-mono text-xs ${key === "lotid" ? "font-bold text-sm" : ""}`}>
                  {val === null || val === undefined ? (
                    <span className="text-muted-foreground/40">-</span>
                  ) : (
                    String(val)
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function SummaryCard({
  label,
  value,
  sublabel,
  variant,
}: {
  label: string;
  value: number;
  sublabel: string;
  variant: "default" | "success" | "danger" | "purple";
}) {
  const styles = {
    default: "border-blue-200/60 bg-blue-50/40 dark:border-blue-800/40 dark:bg-blue-950/30",
    success: "border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-800/40 dark:bg-emerald-950/30",
    danger: "border-red-200/60 bg-red-50/40 dark:border-red-800/40 dark:bg-red-950/30",
    purple: "border-violet-200/60 bg-violet-50/40 dark:border-violet-800/40 dark:bg-violet-950/30",
  };
  const valueStyles = {
    default: "text-blue-700 dark:text-blue-400",
    success: "text-emerald-700 dark:text-emerald-400",
    danger: "text-red-700 dark:text-red-400",
    purple: "text-violet-700 dark:text-violet-400",
  };

  return (
    <Card className={styles[variant]}>
      <CardContent className="px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold font-mono tracking-tight mt-0.5 ${valueStyles[variant]}`}>
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sublabel}</p>
      </CardContent>
    </Card>
  );
}
