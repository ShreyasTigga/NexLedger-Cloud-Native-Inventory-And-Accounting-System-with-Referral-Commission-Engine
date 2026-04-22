import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json([
    { level: 1, commission: 5 },
    { level: 2, commission: 3 },
    { level: 3, commission: 1 }
  ])
}