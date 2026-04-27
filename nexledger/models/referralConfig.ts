import mongoose, { Schema, Document, models, model } from "mongoose"

export interface ReferralConfigDocument extends Document {
  retailerId: mongoose.Types.ObjectId

  name: string // 🔥 NEW (important for UI)

  levels: number
  percentages: number[]
  commissionType: "percentage" | "fixed"
  maxCommissionPerSale?: number

  isActive: boolean
  isDeleted: boolean // 🔥 NEW (soft delete)

  createdAt: Date
  updatedAt: Date
}

const ReferralConfigSchema = new Schema<ReferralConfigDocument>(
  {
    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true // ✅ instead of unique
    },

    // 🔥 IDENTIFIER FOR MULTIPLE CONFIGS
    name: {
      type: String,
      required: true
    },

    levels: {
      type: Number,
      required: true
    },

    percentages: {
      type: [Number],
      required: true
    },

    commissionType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage"
    },

    maxCommissionPerSale: {
      type: Number
    },

    isActive: {
      type: Boolean,
      default: false // 🔥 IMPORTANT (no auto active)
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

// Fast lookup
ReferralConfigSchema.index({ retailerId: 1 })

// Ensure unique config name per retailer
ReferralConfigSchema.index(
  { retailerId: 1, name: 1 },
  { unique: true }
)

// Optional: speed active config lookup
ReferralConfigSchema.index({ retailerId: 1, isActive: 1 })

export default models.ReferralConfig ||
  model<ReferralConfigDocument>("ReferralConfig", ReferralConfigSchema)