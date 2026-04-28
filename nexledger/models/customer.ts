import mongoose, { Schema, Document, models, model } from "mongoose"

export interface CustomerDocument extends Document {
  userId: mongoose.Types.ObjectId
  retailerId: mongoose.Types.ObjectId

  name: string
  phone: string
  email?: string

  referralCode: string
  referredBy?: mongoose.Types.ObjectId

  level: number

  walletBalance: number
  totalEarnings: number
  walletUpdatedAt?: Date 

  isActive: boolean 

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

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },

    phone: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, "Invalid phone number"]
    },

    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"]
    },

    referralCode: {
      type: String,
      required: true
    },

    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      index: true
    },

    level: {
      type: Number,
      default: 0
    },

    walletBalance: {
      type: Number,
      default: 0,
      min: 0
    },

    totalEarnings: {
      type: Number,
      default: 0
    },

    walletUpdatedAt: {
      type: Date
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

// INDEXES
CustomerSchema.index({ retailerId: 1, level: 1 })
CustomerSchema.index({ retailerId: 1, walletBalance: -1 })
CustomerSchema.index({ retailerId: 1, referredBy: 1 }) // 🔥 NEW
CustomerSchema.index(
  { retailerId: 1, referralCode: 1 },
  { unique: true }
)

const Customer =
  (models.Customer as mongoose.Model<CustomerDocument>) ||
  model<CustomerDocument>("Customer", CustomerSchema)

export default Customer