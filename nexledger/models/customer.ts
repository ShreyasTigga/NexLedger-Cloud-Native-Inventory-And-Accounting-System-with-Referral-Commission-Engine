import mongoose, { Schema, Document, models, model } from "mongoose"

export interface CustomerDocument extends Document {
  userId: mongoose.Types.ObjectId
  retailerId: mongoose.Types.ObjectId

  referralCode: string
  referredBy?: mongoose.Types.ObjectId

  level: number // 🔥 NEW (VERY IMPORTANT)

  walletBalance: number

  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<CustomerDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    referralCode: {
      type: String,
      required: true,
      unique: true,
      sparse: true // ✅ safety
    },

    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      index: true // 🔥 faster traversal
    },

    level: {
      type: Number,
      default: 0 // 🔥 root customer = level 0
    },

    walletBalance: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
)

// 🔥 compound index (very useful later)
CustomerSchema.index({ retailerId: 1, level: 1 })

const Customer =
  (models.Customer as mongoose.Model<CustomerDocument>) ||
  model<CustomerDocument>("Customer", CustomerSchema)

export default Customer