import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import BankAccount from "@/models/bankAccount"
import Customer from "@/models/customer"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "customer" || !user.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const banks = await BankAccount.find({
      customerId: user.customerId
    })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(banks)

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    if (!user || user.role !== "customer" || !user.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName
    } = body

    // ================= VALIDATION =================
    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    const customer = await Customer.findById(user.customerId)

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // ================= FIRST BANK AUTO DEFAULT =================
    const existingBanks = await BankAccount.countDocuments({
      customerId: customer._id
    })

    const bank = await BankAccount.create({
      customerId: customer._id,
      retailerId: customer.retailerId,
      accountHolderName: accountHolderName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      bankName: bankName.trim(),
      isDefault: existingBanks === 0
    })

    return NextResponse.json(bank)

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}