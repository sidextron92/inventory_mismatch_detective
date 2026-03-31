import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const pw = process.env.DB_PASSWORD || "";
  return NextResponse.json({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    db: process.env.DB_NAME,
    passwordLength: pw.length,
    passwordPreview: pw.slice(0, 3) + "..." + pw.slice(-3),
  });
}
