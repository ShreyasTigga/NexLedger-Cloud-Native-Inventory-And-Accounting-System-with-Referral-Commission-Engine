import mongoose, { Schema, Document, models, model } from "mongoose"

export interface ReferralEarningDocument extends Document {
  retailerId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  sourceCustomerId: mongoose.Types.ObjectId

  level: number
  amount: number

  // 🔥 NEW FIELDS (CRITICAL)
  percentageUsed: number
  commissionTypeUsed: "percentage" | "fixed"
  configIdUsed?: mongoose.Types.ObjectId

  saleId: mongoose.Types.ObjectId

  createdAt: Date
}

const ReferralEarningSchema = new Schema(
  {
    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

    sourceCustomerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

    level: {
      type: Number,
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    // 🔥 SNAPSHOT FIELDS (VERY IMPORTANT)

    percentageUsed: {
      type: Number,
      required: true
    },

    commissionTypeUsed: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true
    },

    configIdUsed: {
      type: Schema.Types.ObjectId,
      ref: "ReferralConfig"
    },

    saleId: {
      type: Schema.Types.ObjectId,
      ref: "SalesInvoice",
      required: true
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// INDEXES
ReferralEarningSchema.index({ retailerId: 1, customerId: 1 })
ReferralEarningSchema.index({ retailerId: 1, level: 1 })
ReferralEarningSchema.index({ customerId: 1, createdAt: -1 })
ReferralEarningSchema.index({ sourceCustomerId: 1 })
ReferralEarningSchema.index({ saleId: 1 })

const ReferralEarning =
  (models.ReferralEarning as mongoose.Model<ReferralEarningDocument>) ||
  model<ReferralEarningDocument>("ReferralEarning", ReferralEarningSchema)

export default ReferralEarning