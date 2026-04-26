import Customer from "@/models/customer"
import ReferralConfig from "@/models/referralConfig"
import ReferralEarning from "@/models/referralEarning"
import LedgerEntry from "@/models/ledgerEntry"
import mongoose, { ClientSession } from "mongoose"

interface Props {
  saleId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  retailerId: mongoose.Types.ObjectId
  profitAmount: number
  session?: ClientSession
}

export async function processReferralCommission({
  saleId,
  customerId,
  profitAmount,
  retailerId,
  session
}: Props) {
  try {
    const dbSession = session || null

    // ================= GET CONFIG =================
    const config = await ReferralConfig.findOne({
      retailerId,
      isActive: true
    }).session(dbSession)

    if (!config) return

    const {
      levels,
      percentages,
      commissionType,
      maxCommissionPerSale
    } = config

    // ================= GET CUSTOMER =================
    const currentUser = await Customer.findById(customerId)
      .session(dbSession)

    if (!currentUser || !currentUser.referredBy) return

    let parentId: mongoose.Types.ObjectId | undefined =
      currentUser.referredBy

    if (profitAmount <= 0) return

    // ================= TRAVERSE TREE =================
    for (let level = 0; level < levels; level++) {

      if (!parentId) break

      const parent = await Customer.findById(parentId)
        .session(dbSession)

      if (!parent) break

      // Safety: prevent self-loop
      if (parent._id.equals(customerId)) break

      // ================= CALCULATE COMMISSION =================
      let commission = 0

      if (commissionType === "percentage") {
        const percent = percentages[level] || 0
        commission = (profitAmount * percent) / 100
      } else {
        commission = percentages[level] || 0
      }

      if (maxCommissionPerSale) {
        commission = Math.min(commission, maxCommissionPerSale)
      }

      // Skip if no earning
      if (commission <= 0) {
        parentId = parent.referredBy ?? undefined
        continue
      }

      // ================= UPDATE WALLET =================
      await Customer.findByIdAndUpdate(
        parent._id,
        {
          $inc: {
            walletBalance: commission,
            totalEarnings: commission
          }
        },
        { session: dbSession }
      )

      // ================= SAVE REFERRAL RECORD =================
      await ReferralEarning.create(
        [{
          retailerId,
          customerId: parent._id,
          sourceCustomerId: customerId,
          level: level + 1,
          amount: commission,
          saleId
        }],
        { session: dbSession }
      )

      // ================= LEDGER ENTRY (DOUBLE ENTRY) =================
      await LedgerEntry.insertMany(
        [
          {
            retailerId,
            type: "debit",
            account: "Commission Expense",
            amount: commission,
            referenceId: saleId,
            referenceModel: "Referral",
            description: `Level ${level + 1} commission`
          },
          {
            retailerId,
            type: "credit",
            account: `Wallet - ${parent.name}`,
            amount: commission,
            referenceId: saleId,
            referenceModel: "Referral",
            description: "Wallet credit"
          }
        ],
        { session: dbSession }
      )

      // Move to next level
      parentId = parent.referredBy ?? undefined
    }

  } catch (err) {
    console.error("Referral Error:", err)
  }
}