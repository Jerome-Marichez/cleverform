import { NextResponse } from "next/server";

// Route backend de santé (utilisée par les tests système et le healthcheck Docker).
export function GET() {
  return NextResponse.json({ status: "ok" });
}
