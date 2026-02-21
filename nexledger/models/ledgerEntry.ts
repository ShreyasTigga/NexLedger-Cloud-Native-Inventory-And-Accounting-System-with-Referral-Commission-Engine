import mongoose, { Schema, Document, models, model } from "mongoose"

export interface LedgerEntryDocument extends Document {
  account: string
  type: "debit" | "credit"
  amount: number
  referenceId?: string
  description?: string
  createdAt: Date
}

const LedgerEntrySchema = new Schema<LedgerEntryDocument>(
  {
    account: { type: String, required: true },
    type: { type: String, enum: ["debit", "credit"], required: true },
    amount: { type: Number, required: true },
    referenceId: String,
    description: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const LedgerEntry =
  (models.LedgerEntry as mongoose.Model<LedgerEntryDocument>) ||
  model<LedgerEntryDocument>("LedgerEntry", LedgerEntrySchema)

export default LedgerEntry