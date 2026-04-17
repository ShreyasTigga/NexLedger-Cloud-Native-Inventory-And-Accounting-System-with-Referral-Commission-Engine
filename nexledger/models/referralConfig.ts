import mongoose, { Schema, Document, models, model } from "mongoose"

export interface ReferralConfigDocument extends Document {
  levels: number
  percentages: number[]
  commissionType: "percentage" | "fixed"
  maxCommissionPerSale?: number
  isActive: boolean
}

const ReferralConfigSchema = new Schema<ReferralConfigDocument>({
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
})

const ReferralConfig =
  (models.ReferralConfig as mongoose.Model<ReferralConfigDocument>) ||
  model<ReferralConfigDocument>("ReferralConfig", ReferralConfigSchema)

export default ReferralConfig