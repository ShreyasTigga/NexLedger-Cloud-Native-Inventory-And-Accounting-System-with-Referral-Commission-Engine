import mongoose, { Schema, Document, models, model } from "mongoose"

export interface CustomerDocument extends Document {
  userId: mongoose.Types.ObjectId
  retailerId: mongoose.Types.ObjectId

  name: string
  phone: string
  email?: string

  referralCode: string
  referredBy?: mongoose.Types.ObjectId
  referralPath: mongoose.Types.ObjectId[] // 🔥 NEW

  level: number

  walletBalance: number
  walletLockVersion: number

  totalEarnings: number
  walletUpdatedAt?: Date

  lastTransactionAt?: Date // 🔥 NEW

  notes?: string // 🔥 NEW

  isActive: boolean

  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<CustomerDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
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
      required: true,
      uppercase: true, // 🔥 ensures consistency
      trim: true
    },

    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      index: true
    },

    // 🔥 FULL REFERRAL CHAIN (FAST TREE)
    referralPath: [
      {
        type: Schema.Types.ObjectId,
        ref: "Customer"
      }
    ],

    level: {
      type: Number,
      default: 0
    },

    walletBalance: {
      type: Number,
      default: 0,
      min: 0
    },

    walletLockVersion: {
      type: Number,
      default: 0
    },

    totalEarnings: {
      type: Number,
      default: 0
    },

    walletUpdatedAt: {
      type: Date
    },

    // 🔥 ACTIVITY TRACKING
    lastTransactionAt: {
      type: Date
    },

    // 🔥 OPTIONAL NOTES
    notes: {
      type: String,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

/* ================= INDEXES ================= */

// 🔥 Core queries
CustomerSchema.index({ retailerId: 1, level: 1 })
CustomerSchema.index({ retailerId: 1, walletBalance: -1 })
CustomerSchema.index({ retailerId: 1, referredBy: 1 })

// 🔥 Multi-tenant uniqueness
CustomerSchema.index(
  { retailerId: 1, userId: 1 },
  { unique: true }
)

CustomerSchema.index(
  { retailerId: 1, referralCode: 1 },
  { unique: true }
)

CustomerSchema.index(
  { retailerId: 1, phone: 1 },
  { unique: true }
)

// 🔥 Optional but useful
CustomerSchema.index(
  { retailerId: 1, email: 1 },
  { sparse: true }
)

// 🔥 Referral traversal optimization
CustomerSchema.index({ retailerId: 1, referralPath: 1 })

const Customer =
  (models.Customer as mongoose.Model<CustomerDocument>) ||
  model<CustomerDocument>("Customer", CustomerSchema)

export default Customer