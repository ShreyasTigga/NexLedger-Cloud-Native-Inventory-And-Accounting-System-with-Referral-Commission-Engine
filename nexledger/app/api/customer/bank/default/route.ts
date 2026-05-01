import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import BankAccount from "@/models/bankAccount"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "customer" || !user.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bankId } = await req.json()

    if (!bankId) {
      return NextResponse.json(
        { error: "Bank ID required" },
        { status: 400 }
      )
    }

    // remove previous default
    await BankAccount.updateMany(
      { customerId: user.customerId },
      { $set: { isDefault: false } }
    )

    // set new default
    await BankAccount.findOneAndUpdate(
      { _id: bankId, customerId: user.customerId },
      { $set: { isDefault: true } }
    )

    return NextResponse.json({ message: "Default updated" })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}