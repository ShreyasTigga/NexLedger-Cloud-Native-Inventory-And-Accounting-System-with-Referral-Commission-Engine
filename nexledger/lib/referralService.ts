import Customer from "@/models/customer"
import ReferralConfig from "@/models/referralConfig"
import ReferralEarning from "@/models/referralEarning"
import LedgerEntry from "@/models/ledgerEntry"
import mongoose, { ClientSession } from "mongoose"

interface Props {
  saleId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  totalAmount: number
  session?: ClientSession
}

export async function processReferralCommission({
  saleId,
  customerId,
  totalAmount,
  session
}: Props) {
  try {
    const dbSession = session || null

    // ================= CONFIG =================
    const config = await ReferralConfig.findOne({
      isActive: true
    }).session(dbSession)

    if (!config) return

    const {
      levels,
      percentages,
      commissionType,
      maxCommissionPerSale
    } = config

    // ================= CUSTOMER =================
    const currentUser = await Customer.findById(customerId)
      .session(dbSession)

    if (!currentUser || !currentUser.referredBy) return

    let parentId: mongoose.Types.ObjectId | undefined =
      currentUser.referredBy

    // ================= TREE =================
    for (let level = 0; level < levels; level++) {

      if (!parentId) break

      const parent = await Customer.findById(parentId)
        .session(dbSession)

      if (!parent) break

      // ================= COMMISSION =================
      let commission = 0

      if (commissionType === "percentage") {
        const percent = percentages[level] || 0
        commission = (totalAmount * percent) / 100
      } else {
        commission = percentages[level] || 0
      }

      // ================= CAP =================
      if (maxCommissionPerSale && commission > maxCommissionPerSale) {
        commission = maxCommissionPerSale
      }

      if (commission <= 0) {
        parentId = parent.referredBy ?? undefined
        continue
      }

      // ================= WALLET =================
      await Customer.findByIdAndUpdate(
        parent._id,
        { $inc: { walletBalance: commission } },
        { session }
      )

      // ================= EARNING =================
      await ReferralEarning.create(
        [{
          userId: parent._id,
          fromUserId: customerId,
          level: level + 1,
          amount: commission,
          saleId
        }],
        { session }
      )

      // ================= LEDGER =================
      await LedgerEntry.insertMany(
        [
          {
            type: "debit",
            account: "Commission Expense",
            amount: commission,
            referenceId: saleId,
            description: `Level ${level + 1} commission`
          },
          {
            type: "credit",
            account: "Customer Wallet",
            amount: commission,
            referenceId: saleId,
            description: "Wallet credit"
          }
        ],
        { session }
      )

      // 🔁 move up
      parentId = parent.referredBy ?? undefined
    }

  } catch (err) {
    console.error("Referral Error:", err)
  }
}