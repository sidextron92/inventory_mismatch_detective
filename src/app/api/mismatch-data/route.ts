import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `WITH openorders AS (
        SELECT
          oo.variantID,
          oo.sizeID,
          oo.sellerid,
          oo.warehouseid,
          oo.placedNotDispatchedOrderids,
          oo.placedNotDispatched,
          SUM(COALESCE(lp.lotsPacked, 0)) as lotsPacked,
          oo.packedButNotDel
        FROM (
          SELECT
            od.variantID,
            od.sizeID,
            o.sellerID as sellerid,
            sm.fmWarehouseId as warehouseid,
            GROUP_CONCAT(DISTINCT od.orderID) as placedNotDispatchedOrderids,
            SUM(CASE WHEN (cm.pickupInitiatedOn IS NULL OR cm.pickupInitiatedOn=0) THEN od.remainingSetCount ELSE NULL END) as placedNotDispatched,
            SUM(CASE WHEN cm.pickupInitiatedOn > 0 AND cm.actDeliveryDate=0 THEN od.remainingSetCount ELSE 0 END) as packedButNotDel
          FROM orders o
          INNER JOIN order_details od ON od.orderid=o.orderID
          INNER JOIN seller_master sm ON sm.userID=o.sellerID
          LEFT JOIN consignment_master cm ON cm.orderId=o.orderID
          WHERE o.createdOn > UNIX_TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL -90 DAY))
            AND o.status=4
            AND od.remainingSetCount > 0
            AND (cm.actDeliveryDate IS NULL or cm.pickupInitiatedOn=0 or cm.actDeliveryDate=0)
          GROUP BY od.variantID, od.sizeID, o.sellerID
        ) oo
        LEFT JOIN (
          SELECT
            lm.variantId,
            lm.sizeId,
            lm.orderId,
            COUNT(lm.id) as lotsPacked
          FROM lot_master lm
          INNER JOIN (
            SELECT DISTINCT od.orderID, od.variantID, od.sizeID, sm.fmWarehouseId as warehouseid
            FROM orders o
            INNER JOIN order_details od ON od.orderid=o.orderID
            INNER JOIN seller_master sm ON sm.userID=o.sellerID
            LEFT JOIN consignment_master cm ON cm.orderId=o.orderID
            WHERE o.createdOn > UNIX_TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL -90 DAY))
              AND o.status=4
              AND od.remainingSetCount > 0
              AND (cm.pickupInitiatedOn IS NULL OR cm.pickupInitiatedOn=0)
          ) ords ON lm.orderId = ords.orderID
                AND lm.variantId = ords.variantID
                AND lm.sizeId = ords.sizeID
                AND lm.warehouseId = ords.warehouseid
          WHERE lm.status = 'packed'
          GROUP BY lm.variantId, lm.sizeId, lm.orderId
        ) lp ON FIND_IN_SET(lp.orderId, oo.placedNotDispatchedOrderids) > 0
          AND lp.variantId = oo.variantID
          AND lp.sizeId = oo.sizeID
        GROUP BY oo.variantID, oo.sizeID, oo.sellerID
      )
      SELECT
        vss.sellerid, sm.fmWarehouseId, sm.companyName as darkstore, p.productName,
        vss.variantId, vss.sizeId, vss.isVisible,
        COUNT(DISTINCT rmlla.lotId) as unsoldRMLLA,
        vss.quantity as vssQty,
        COUNT(DISTINCT lm.id) as lotMasterQty,
        oo.placedNotDispatchedOrderids,
        COALESCE(oo.placedNotDispatched,0) as placedNotDispatched,
        COALESCE(oo.lotsPacked,0) as lotsPacked,
        COALESCE(oo.placedNotDispatched,0) - COALESCE(oo.lotsPacked,0) as placedButNotPacked,
        COALESCE(oo.packedButNotDel,0) as packedButNotDel
      FROM variant_size_stock vss
      INNER JOIN seller_master sm ON sm.userid = vss.sellerID
      INNER JOIN variants v ON v.variantID=vss.variantId
      INNER JOIN products p ON p.productid=v.productId
      LEFT JOIN openorders oo ON oo.variantID=vss.variantid AND oo.sizeid=vss.sizeId AND oo.sellerid=vss.sellerID
      LEFT JOIN rm_lot_level_attribution rmlla ON rmlla.variantId=vss.variantID AND rmlla.sizeId=vss.sizeID AND rmlla.warehouseid=sm.fmWarehouseId AND rmlla.activeStatus=1 AND rmlla.isRemoved=0 AND rmlla.soldDate=0 AND rmlla.lotid>0
      LEFT JOIN lot_master lm ON lm.warehouseId=sm.fmWarehouseId AND lm.variantId=vss.variantId AND lm.sizeId=vss.sizeId AND lm.status IN ('in-shelf','rto-in-shelf-good')
      WHERE vss.stockType='DARKSTORE'
      GROUP BY vss.variantId, vss.sizeId, sm.fmWarehouseId
      HAVING (unsoldRMLLA > 0 OR vssQty > 0 OR lotMasterQty > 0)`,
    );
    return NextResponse.json({ data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Query failed: ${message}` },
      { status: 500 }
    );
  }
}
