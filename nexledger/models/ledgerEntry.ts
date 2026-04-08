import mongoose, { Schema, Document, models, model } from "mongoose"

export interface LedgerEntryDocument extends Document {
  retailerId: mongoose.Types.ObjectId
  account: string
  type: "debit" | "credit"
  amount: number
  referenceId?: string
  description?: string
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

    account: { type: String, required: true },

    type: {
      type: String,
      enum: ["debit", "credit"],
      required: true
    },

    amount: { type: Number, required: true },

    referenceId: String,
    description: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

LedgerEntrySchema.index({ retailerId: 1, createdAt: -1 })

export default models.LedgerEntry ||
  model<LedgerEntryDocument>("LedgerEntry", LedgerEntrySchema)