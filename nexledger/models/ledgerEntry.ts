import mongoose, { Schema, Document, models, model } from "mongoose"

export interface LedgerEntryDocument extends Document {
  retailerId: mongoose.Types.ObjectId

  account: string
  accountType: "asset" | "liability" | "income" | "expense"

  type: "debit" | "credit"
  amount: number

  // 🔥 GROUPING (CRITICAL)
  transactionId: string

  // 🔗 OPTIONAL LINKS
  customerId?: mongoose.Types.ObjectId
  referenceId?: mongoose.Types.ObjectId
  referenceModel?: "Purchase" | "Sale" | "Customer" | "Referral"

  description?: string

  // 🔥 OPTIONAL DEBUG / FAST READ
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

    // 🔥 TRANSACTION GROUPING
    transactionId: {
      type: String,
      required: true,
      index: true
    },

    // 🔗 OPTIONAL LINKS

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

    // 🔥 OPTIONAL (for quick balance checks)
    balanceAfter: {
      type: Number
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

/* ================= INDEXES ================= */

// Fast tenant-based queries
LedgerEntrySchema.index({ retailerId: 1, createdAt: -1 })

// Transaction grouping
LedgerEntrySchema.index({ transactionId: 1 })

// Customer-specific ledger
LedgerEntrySchema.index({ retailerId: 1, customerId: 1, createdAt: -1 })

// Account-based queries (reports)
LedgerEntrySchema.index({ retailerId: 1, account: 1 })

const LedgerEntry =
  (models.LedgerEntry as mongoose.Model<LedgerEntryDocument>) ||
  model<LedgerEntryDocument>("LedgerEntry", LedgerEntrySchema)

export default LedgerEntry