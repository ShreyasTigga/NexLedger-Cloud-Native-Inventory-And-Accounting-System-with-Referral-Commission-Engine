import Customer from "@/models/customer"
import ReferralConfig from "@/models/referralConfig"
import ReferralEarning from "@/models/referralEarning"
import LedgerEntry from "@/models/ledgerEntry"
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

if (!sale || !sale.referralConfigSnapshot) {
  console.log("⚠️ Missing snapshot for sale:", saleId)
  return
}

// ================= GET CONFIG USED IN SALE =================
const config = sale.referralConfigSnapshot

if (!config) return

// ================= IDEMPOTENCY CHECK =================
const existing = await ReferralEarning.findOne({
  saleId,
  retailerId
}).session(dbSession)

if (existing) {
  console.log("⚠️ Referral already processed for sale:", saleId)
  return
}
    

    const {
      levels,
      percentages,
      commissionType,
      maxCommissionPerSale
    } = config

    // ================= GET CUSTOMER =================
    const currentUser = await Customer.findById(customerId)
      .session(dbSession)

      // 🔥 2️⃣ CUSTOMER LOG
    console.log("CUSTOMER:", currentUser)

    if (!currentUser || !currentUser.referredBy) return

    let parentId: mongoose.Types.ObjectId | undefined =
      currentUser.referredBy

    if (profitAmount <= 0) return

    // ================= TRAVERSE TREE =================
    for (let level = 0; level < levels; level++) {

      if (!parentId) break

      const parent = await Customer.findById(parentId)
        .session(dbSession)

        // 🔥 3️⃣ LEVEL LOG
      console.log("LEVEL", level + 1, "PARENT:", parent?._id)

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

      // 🔥 4️⃣ COMMISSION LOG
      console.log("COMMISSION:", commission)

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

      // ================= LEDGER ENTRY =================
      await LedgerEntry.insertMany(
        [
          {
            retailerId,
            transactionId, // ✅ FIXED

            account: "Commission Expense",
            accountType: "expense", // ✅ FIXED

            type: "debit",
            amount: commission,

            referenceId: saleId,
            referenceModel: "Referral",
            description: `Level ${level + 1} commission`
          },
          {
            retailerId,
            transactionId, // ✅ FIXED

            account: "Customer Wallet",
            accountType: "liability", // ✅ FIXED

            type: "credit",
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