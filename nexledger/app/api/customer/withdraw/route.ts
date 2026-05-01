import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

import Customer from "@/models/customer"
import WalletTransaction from "@/models/walletTransaction"
import LedgerEntry from "@/models/ledgerEntry"
import BankAccount from "@/models/bankAccount"

import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession()

  try {
    await dbConnect()

    const user = await getUserFromRequest(req)

    // 🔐 AUTH
    if (!user || user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.customerId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { amount } = await req.json()

    // ================= VALIDATION =================
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid withdrawal amount" },
        { status: 400 }
      )
    }

    await session.startTransaction()

    // ================= CUSTOMER =================
    const customer = await Customer.findById(user.customerId).session(session)

    if (!customer) {
      throw new Error("Customer not found")
    }

    if (customer.walletBalance < amount) {
      throw new Error("Insufficient balance")
    }

    // ================= BANK CHECK =================
    const bank = await BankAccount.findOne({
      customerId: customer._id,
      isDefault: true
    }).session(session)

    if (!bank) {
      throw new Error("No default bank account found")
    }

    // ================= WALLET DEDUCT =================
    const updatedCustomer = await Customer.findOneAndUpdate(
      { _id: customer._id },
      {
        $inc: {
          walletBalance: -amount
        }
      },
      { new: true, session }
    )

    if (!updatedCustomer) throw new Error("Wallet update failed")

    // ================= WALLET TRANSACTION =================
    await WalletTransaction.create(
      [{
        retailerId: customer.retailerId,
        customerId: customer._id,
        type: "debit",
        source: "withdrawal",
        amount,
        balanceAfter: updatedCustomer.walletBalance,
        referenceId: bank._id,
        notes: "User withdrawal"
      }],
      { session }
    )

    // ================= LEDGER ENTRY =================
    const transactionId = `wd_${Date.now()}`

    await LedgerEntry.insertMany(
      [
        {
          retailerId: customer.retailerId,
          transactionId,

          account: "Customer Wallet",
          accountType: "liability",
          type: "debit",
          amount,

          referenceId: customer._id,
          referenceModel: "Withdrawal",
          description: "Customer withdrawal"
        },
        {
          retailerId: customer.retailerId,
          transactionId,

          account: "Cash / Bank",
          accountType: "asset",
          type: "credit",
          amount,

          referenceId: bank._id,
          referenceModel: "Withdrawal",
          description: "Payout to customer"
        }
      ],
      { session }
    )

    await session.commitTransaction()

    return NextResponse.json({
      message: "Withdrawal successful",
      balance: updatedCustomer.walletBalance
    })

  } catch (err: any) {
    await session.abortTransaction()

    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    )
  } finally {
    session.endSession()
  }
}