import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const lotId = Number(request.nextUrl.searchParams.get("lotId"));

  if (!lotId) {
    return NextResponse.json({ error: "lotId is required" }, { status: 400 });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT * FROM lot_journey WHERE lotid = ? ORDER BY id ASC`,
      [lotId]
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
