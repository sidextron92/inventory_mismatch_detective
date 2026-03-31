import { getPool } from "./db";

export interface InvestigateParams {
  variantId: number;
  sizeId: number;
  warehouseId: number;
  sellerId: number;
}

export interface StockLog {
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

export interface LotRecord {
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

export async function getStockLogs(params: InvestigateParams): Promise<StockLog[]> {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM variant_size_stock_logs
     WHERE variantID = ? AND sizeID = ? AND sellerID = ?
     ORDER BY created_at DESC
     LIMIT 30`,
    [params.variantId, params.sizeId, params.sellerId]
  );
  return rows as StockLog[];
}

export async function getLotRecords(params: InvestigateParams): Promise<LotRecord[]> {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, variantId, sizeId, lotSize, warehouseId, skOrderId, orderId, status, modifiedOn, createdOn, updatedOn
     FROM lot_master
     WHERE variantId = ? AND sizeId = ? AND warehouseId = ?
     ORDER BY createdOn DESC`,
    [params.variantId, params.sizeId, params.warehouseId]
  );
  return rows as LotRecord[];
}

export async function getPhysicalInventory(params: InvestigateParams): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT COUNT(id) AS total
     FROM lot_master
     WHERE variantId = ? AND sizeId = ? AND warehouseId = ?
       AND status IN ('in-shelf', 'rto-in-shelf-good')`,
    [params.variantId, params.sizeId, params.warehouseId]
  );
  return (rows as Array<{ total: number }>)[0].total;
}

export async function getWarehouseInventory(params: InvestigateParams): Promise<Record<string, unknown>[]> {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM warehouse_inventory
     WHERE variantid = ? AND sizeId = ? AND warehouseid = ?`,
    [params.variantId, params.sizeId, params.warehouseId]
  );
  return rows as Record<string, unknown>[];
}

export async function getRmLotLevelAttribution(params: InvestigateParams): Promise<Record<string, unknown>[]> {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, lotid, fosid, rmDemandId, lotSize, orderid, orderDetailId, startEventDate, soldDate, inActiveEntityType, dummyCreatedByType, lotStatus, activeStatus, isRemoved
     FROM rm_lot_level_attribution
     WHERE variantId = ? AND sizeId = ? AND warehouseid = ?`,
    [params.variantId, params.sizeId, params.warehouseId]
  );
  return rows as Record<string, unknown>[];
}

export async function getSystemInventory(params: InvestigateParams): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT quantity FROM variant_size_stock_logs
     WHERE variantID = ? AND sizeID = ? AND sellerID = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [params.variantId, params.sizeId, params.sellerId]
  );
  const result = rows as Array<{ quantity: number }>;
  return result.length > 0 ? result[0].quantity : 0;
}
