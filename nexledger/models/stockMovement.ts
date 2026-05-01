import mongoose, { Schema, Document, models, model } from "mongoose"

export interface StockMovementDocument extends Document {
  retailerId: mongoose.Types.ObjectId
  itemId: mongoose.Types.ObjectId

  type: "purchase" | "sale" | "adjustment"

  direction: "in" | "out"

  quantity: number

  price?: number
  totalAmount?: number

  transactionId: string

  referenceId?: mongoose.Types.ObjectId
  referenceModel?: "Purchase" | "Sale" | "Adjustment"

  stockAfter?: number

  notes?: string

  createdAt: Date
}

const StockMovementSchema = new Schema<StockMovementDocument>(
  {
    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    itemId: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["purchase", "sale", "adjustment"],
      required: true
    },

    direction: {
      type: String,
      enum: ["in", "out"],
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    price: {
  type: Number,
  min: 0
},

totalAmount: {
  type: Number,
  min: 0
},

    transactionId: {
      type: String,
      required: true,
      trim: true
    },

    referenceId: {
      type: Schema.Types.ObjectId
    },

    referenceModel: {
      type: String,
      enum: ["Purchase", "Sale", "Adjustment"]
    },

    stockAfter: {
      type: Number,
      min: 0
    },

    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: true // 🔥 prevents unwanted fields
  }
)

/* ================= INDEXES ================= */

// Fast item history
StockMovementSchema.index({ retailerId: 1, itemId: 1, createdAt: -1 })

// Transaction lookup
StockMovementSchema.index({ transactionId: 1 })

// Reference lookup
StockMovementSchema.index({ referenceId: 1, referenceModel: 1 })

const StockMovement =
  (models.StockMovement as mongoose.Model<StockMovementDocument>) ||
  model<StockMovementDocument>("StockMovement", StockMovementSchema)

export default StockMovement