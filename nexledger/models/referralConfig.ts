import mongoose, { Schema, Document, models, model } from "mongoose"

export interface ReferralConfigDocument extends Document {
  retailerId: mongoose.Types.ObjectId

  name: string

  levels: number
  percentages: number[]
  commissionType: "percentage" | "fixed"
  maxCommissionPerSale?: number

  isActive: boolean
  isDeleted: boolean

  createdAt: Date
  updatedAt: Date
}

const ReferralConfigSchema = new Schema<ReferralConfigDocument>(
  {
    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    levels: {
      type: Number,
      required: true,
      min: 1
    },

    percentages: {
      type: [Number],
      required: true,
      validate: {
        validator: function (this: any, arr: number[]) {
          return arr.length === this.levels
        },
        message: "Percentages length must match levels"
      }
    },

    commissionType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage"
    },

    maxCommissionPerSale: {
      type: Number,
      min: 0
    },

    isActive: {
      type: Boolean,
      default: false
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

/* ================= INDEXES ================= */

// Basic lookup
ReferralConfigSchema.index({ retailerId: 1 })

// Unique name per retailer (excluding deleted)
ReferralConfigSchema.index(
  { retailerId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false }
  }
)

// Only ONE active config per retailer
ReferralConfigSchema.index(
  { retailerId: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true }
  }
)

export default models.ReferralConfig ||
  model<ReferralConfigDocument>("ReferralConfig", ReferralConfigSchema)