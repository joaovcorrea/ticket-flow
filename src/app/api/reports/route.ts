import { NextRequest, NextResponse } from "next/server";
import { getReportData } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const days = Number(new URL(request.url).searchParams.get("days") || "30");
  const data = await getReportData(days);
  return NextResponse.json(data);
}
