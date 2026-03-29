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

    level: Number,

    amount: Number,

    saleId: {
      type: Schema.Types.ObjectId,
      ref: "SalesInvoice"
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// 🔍 Useful indexes
ReferralEarningSchema.index({ userId: 1 })
ReferralEarningSchema.index({ saleId: 1 })

const ReferralEarning =
  (models.ReferralEarning as mongoose.Model<ReferralEarningDocument>) ||
  model<ReferralEarningDocument>(
    "ReferralEarning",
    ReferralEarningSchema
  )

export default ReferralEarning