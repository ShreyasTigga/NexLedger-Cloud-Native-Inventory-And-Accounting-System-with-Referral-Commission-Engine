import mongoose, { Schema, Document, models, model } from "mongoose"

export interface CustomerDocument extends Document {
  name: string
  email?: string
  phone?: string

  referralCode: string
  referredBy?: mongoose.Types.ObjectId

  walletBalance: number

  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<CustomerDocument>(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,

    referralCode: {
      type: String,
      required: true,
      unique: true
    },

    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "Customer"
    },

    walletBalance: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
)

// 🔍 Index for fast tree lookup
CustomerSchema.index({ referredBy: 1 })

const Customer =
  (models.Customer as mongoose.Model<CustomerDocument>) ||
  model<CustomerDocument>("Customer", CustomerSchema)

export default Customer