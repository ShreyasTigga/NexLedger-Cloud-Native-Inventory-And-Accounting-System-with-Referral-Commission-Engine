import Customer from "@/models/customer"
import ReferralEarning from "@/models/referralEarning"
import LedgerEntry from "@/models/ledgerEntry"
import WalletTransaction from "@/models/walletTransaction" // ✅ ADD
import mongoose, { ClientSession } from "mongoose"
import SalesInvoice from "@/models/salesInvoice"

interface Props {
  saleId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  retailerId: mongoose.Types.ObjectId
  transactionId: string
  profitAmount: number
  session?: ClientSession
}

export async function processReferralCommission({
  saleId,
  customerId,
  retailerId,
  transactionId,
  profitAmount,
  session
}: Props) {
  try {
    const dbSession = session || null

    console.log("REFERRAL START", {
      saleId,
      customerId,
      profitAmount
    })

    // ================= GET SALE =================
    const sale = await SalesInvoice.findById(saleId)
      .session(dbSession)

    const snapshot = sale?.referralConfigSnapshot

    if (!snapshot) {
      console.log("⚠️ Missing snapshot")
      return
    }

    // ================= IDEMPOTENCY =================
    const existing = await ReferralEarning.findOne({
      saleId,
      retailerId
    }).session(dbSession)

    if (existing) {
      console.log("⚠️ Referral already processed:", saleId)
      return
    }

    const {
      levels,
      percentages,
      distributionPercentage,
      commissionType,
      maxCommissionPerSale
    } = snapshot

    // ================= CUSTOMER =================
    const currentUser = await Customer.findById(customerId)
      .session(dbSession)

    if (!currentUser || !currentUser.referredBy) return

    let parentId: mongoose.Types.ObjectId | undefined =
      currentUser.referredBy

    if (profitAmount <= 0) return

    // ================= POOL =================
    const pool =
      (profitAmount * (distributionPercentage ?? 100)) / 100

    if (pool <= 0) return

    // ================= TRAVERSE =================
    for (let level = 0; level < levels; level++) {

      if (!parentId) break

      const parent = await Customer.findById(parentId)
        .session(dbSession)

      if (!parent) break

      if (parent._id.equals(customerId)) break

      // ================= COMMISSION =================
      let commission = 0

      if (commissionType === "percentage") {
        const percent = percentages[level] || 0
        commission = (pool * percent) / 100
      } else {
        commission = percentages[level] || 0
      }

      if (maxCommissionPerSale) {
        commission = Math.min(commission, maxCommissionPerSale)
      }

      if (commission <= 0) {
        parentId = parent.referredBy ?? undefined
        continue
      }

      // ================= WALLET UPDATE (FIXED) =================
      const updatedCustomer = await Customer.findOneAndUpdate(
        { _id: parent._id },
        {
          $inc: {
            walletBalance: commission,
            totalEarnings: commission
          }
        },
        { new: true, session: dbSession }
      )

      if (!updatedCustomer) break

      // ================= WALLET TRANSACTION (NEW) =================
      await WalletTransaction.create(
        [{
          retailerId,
          customerId: parent._id,
          type: "credit",
          source: "referral",
          amount: commission,
          balanceAfter: updatedCustomer.walletBalance, // ✅ CORRECT
          referenceId: saleId
        }],
        { session: dbSession }
      )

      // ================= REFERRAL RECORD =================
      await ReferralEarning.create(
        [{
          retailerId,
          customerId: parent._id,
          sourceCustomerId: customerId,
          level: level + 1,
          amount: commission,
          saleId,
          commissionTypeUsed: commissionType,
          percentageUsed:
            commissionType === "percentage"
              ? percentages[level] || 0
              : 0
        }],
        { session: dbSession }
      )

      // ================= LEDGER =================
      await LedgerEntry.insertMany(
        [
          {
            retailerId,
            transactionId,
            account: "Commission Expense",
            accountType: "expense",
            type: "debit",
            amount: commission,
            referenceId: saleId,
            referenceModel: "Referral",
            description: `Level ${level + 1} commission`
          },
          {
            retailerId,
            transactionId,
            account: "Customer Wallet",
            accountType: "liability",
            type: "credit",
            amount: commission,
            referenceId: saleId,
            referenceModel: "Referral",
            description: "Wallet credit"
          }
        ],
        { session: dbSession }
      )

      parentId = parent.referredBy ?? undefined
    }

  } catch (err) {
    console.error("Referral Error:", err)
  }
}