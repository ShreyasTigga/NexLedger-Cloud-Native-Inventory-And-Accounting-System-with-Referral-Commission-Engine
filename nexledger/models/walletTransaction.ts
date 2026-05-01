import mongoose, { Schema, model, models } from "mongoose"

const WalletTransactionSchema = new Schema({
  retailerId: {
    type: Schema.Types.ObjectId,
    required: true
  },

  customerId: {
    type: Schema.Types.ObjectId,
    required: true
  },

  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true
  },

  source: {
    type: String,
    enum: ["referral", "withdrawal", "adjustment"],
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: 0
  },

  balanceAfter: {
    type: Number,
    required: true
  },

  referenceId: Schema.Types.ObjectId,

  notes: String
}, { timestamps: true })

export default models.WalletTransaction ||
  model("WalletTransaction", WalletTransactionSchema)