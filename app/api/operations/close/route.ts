import { NextRequest, NextResponse } from "next/server";
import { closeAgent } from "@/services/agentManager";

export async function POST(req: NextRequest) {
  try {
    const { dbUrl } = await req.json();
    await closeAgent(dbUrl);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}