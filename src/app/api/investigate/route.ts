import { NextRequest, NextResponse } from "next/server";
import {
  getStockLogs,
  getLotRecords,
  getPhysicalInventory,
  getSystemInventory,
  getWarehouseInventory,
  getRmLotLevelAttribution,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const variantId = Number(searchParams.get("variantId"));
  const sizeId = Number(searchParams.get("sizeId"));
  const warehouseId = Number(searchParams.get("warehouseId"));
  const sellerId = Number(searchParams.get("sellerId"));

  if (!variantId || !sizeId || !warehouseId || !sellerId) {
    return NextResponse.json(
      { error: "All fields are required: variantId, sizeId, warehouseId, sellerId" },
      { status: 400 }
    );
  }

  const params = { variantId, sizeId, warehouseId, sellerId };

  try {
    const [stockLogs, lotRecords, physicalQty, systemQty, warehouseInventory, rmLotAttribution] = await Promise.all([
      getStockLogs(params),
      getLotRecords(params),
      getPhysicalInventory(params),
      getSystemInventory(params),
      getWarehouseInventory(params),
      getRmLotLevelAttribution(params),
    ]);

    return NextResponse.json({
      summary: {
        systemQuantity: systemQty,
        physicalQuantity: physicalQty,
        mismatch: systemQty - physicalQty,
      },
      stockLogs,
      lotRecords,
      warehouseInventory,
      rmLotAttribution,
    });
  } catch (error) {
    console.error("Investigation query failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Database query failed: ${message}` },
      { status: 500 }
    );
  }
}
