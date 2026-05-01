import mongoose, { Schema, model, models } from "mongoose"

export interface BankAccountDocument extends mongoose.Document {
  customerId: mongoose.Types.ObjectId
  retailerId: mongoose.Types.ObjectId

  accountHolderName: string
  accountNumber: string
  ifscCode: string
  bankName: string

  isDefault: boolean

  createdAt: Date
  updatedAt: Date
}

const BankAccountSchema = new Schema<BankAccountDocument>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    accountHolderName: {
      type: String,
      required: true,
      trim: true
    },

    accountNumber: {
      type: String,
      required: true
    },

    ifscCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    bankName: {
      type: String,
      required: true
    },

    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

/* ================= INDEXES ================= */

// One default account per customer
BankAccountSchema.index(
  { customerId: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true }
  }
)

export default models.BankAccount ||
  model<BankAccountDocument>("BankAccount", BankAccountSchema)