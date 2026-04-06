import mongoose, { Schema, Document, models, model } from "mongoose"

export interface CustomerDocument extends Document {
  userId: mongoose.Types.ObjectId

  referralCode: string
  referredBy?: mongoose.Types.ObjectId

  walletBalance: number

  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<CustomerDocument>(
  {
    // Link to User
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

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

// Index for referral tree traversal
CustomerSchema.index({ referredBy: 1 })

const Customer =
  (models.Customer as mongoose.Model<CustomerDocument>) ||
  model<CustomerDocument>("Customer", CustomerSchema)

export default Customer