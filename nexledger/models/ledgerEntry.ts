import mongoose, { Schema, Document, models, model } from "mongoose"

export interface LedgerEntryDocument extends Document {
  retailerId: mongoose.Types.ObjectId

  account: string
  accountType: "asset" | "liability" | "income" | "expense"

  type: "debit" | "credit"
  amount: number

  transactionId: string

  // 🔥 NEW (VERY IMPORTANT)
  source: "sale" | "purchase" | "referral" | "wallet" | "adjustment"

  // 🔗 OPTIONAL LINKS
  customerId?: mongoose.Types.ObjectId
  referenceId?: mongoose.Types.ObjectId
  referenceModel?: "Purchase" | "Sale" | "Customer" | "Referral"

  description?: string

  balanceAfter?: number

  createdAt: Date
}

const LedgerEntrySchema = new Schema<LedgerEntryDocument>(
  {
    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    account: {
      type: String,
      required: true,
      trim: true
    },

    accountType: {
      type: String,
      enum: ["asset", "liability", "income", "expense"],
      required: true
    },

    type: {
      type: String,
      enum: ["debit", "credit"],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    // 🔥 GROUPING KEY
    transactionId: {
      type: String,
      required: true,
      index: true
    },

    // 🔥 SOURCE TRACKING (CRITICAL FOR DEBUGGING)
    source: {
      type: String,
      enum: ["sale", "purchase", "referral", "wallet", "adjustment"],
      required: true
    },

    // 🔗 LINKS

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      index: true
    },

    referenceId: {
      type: Schema.Types.ObjectId
    },

    referenceModel: {
      type: String,
      enum: ["Purchase", "Sale", "Customer", "Referral"]
    },

    description: {
      type: String,
      trim: true
    },

    balanceAfter: {
      type: Number
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

/* ================= INDEXES ================= */

// 🔥 Core queries
LedgerEntrySchema.index({ retailerId: 1, createdAt: -1 })

// 🔥 Transaction grouping
LedgerEntrySchema.index({ retailerId: 1, transactionId: 1 })

// 🔥 Customer ledger
LedgerEntrySchema.index({
  retailerId: 1,
  customerId: 1,
  createdAt: -1
})

// 🔥 Account reporting
LedgerEntrySchema.index({ retailerId: 1, account: 1 })

// 🔥 Source-based analytics
LedgerEntrySchema.index({ retailerId: 1, source: 1 })

const LedgerEntry =
  (models.LedgerEntry as mongoose.Model<LedgerEntryDocument>) ||
  model<LedgerEntryDocument>("LedgerEntry", LedgerEntrySchema)

export default LedgerEntry