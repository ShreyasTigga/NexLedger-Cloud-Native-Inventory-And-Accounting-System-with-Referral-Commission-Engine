import mongoose, { Schema, Document, models, model } from "mongoose"

export interface ReferralEarningDocument extends Document {
  userId: mongoose.Types.ObjectId
  fromUserId: mongoose.Types.ObjectId
  level: number
  amount: number
  saleId: mongoose.Types.ObjectId
  createdAt: Date
}

const ReferralEarningSchema = new Schema<ReferralEarningDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

    fromUserId: {
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

    saleId: {
      type: Schema.Types.ObjectId,
      ref: "SalesInvoice",
      required: true
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Performance indexes
ReferralEarningSchema.index({ userId: 1, createdAt: -1 })
ReferralEarningSchema.index({ fromUserId: 1 })
ReferralEarningSchema.index({ saleId: 1 })

const ReferralEarning =
  (models.ReferralEarning as mongoose.Model<ReferralEarningDocument>) ||
  model<ReferralEarningDocument>("ReferralEarning", ReferralEarningSchema)

export default ReferralEarning