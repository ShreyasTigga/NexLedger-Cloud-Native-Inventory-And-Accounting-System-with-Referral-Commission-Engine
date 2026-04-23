import mongoose, { Schema, Document, models, model } from "mongoose"

export interface ReferralConfigDocument extends Document {
  retailerId: mongoose.Types.ObjectId // ✅ ADD THIS
  levels: number
  percentages: number[]
  commissionType: "percentage" | "fixed"
  maxCommissionPerSale?: number
  isActive: boolean
}

const ReferralConfigSchema = new Schema<ReferralConfigDocument>(
  {
    // ✅ MOST IMPORTANT FIELD
    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true // one config per retailer
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
      default: true
    }
  },
  { timestamps: true }
)

export default models.ReferralConfig ||
  model<ReferralConfigDocument>("ReferralConfig", ReferralConfigSchema)