import mongoose, { Schema, Document, models, model } from "mongoose"

export interface StockMovementDocument extends Document {
  retailerId: mongoose.Types.ObjectId
  itemId: mongoose.Types.ObjectId

  type: "purchase" | "sale" | "adjustment"

  // 🔥 Direction clarity
  direction: "in" | "out"

  quantity: number

  // 🔥 Link to system transaction
  transactionId: string

  // 🔗 Structured reference
  referenceId?: mongoose.Types.ObjectId
  referenceModel?: "Purchase" | "Sale" | "Adjustment"

  // 🔥 Optional snapshot
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

    // 🔥 CLEAR STOCK FLOW
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

    // 🔥 CONNECT TO LEDGER / INVOICE
    transactionId: {
      type: String,
      required: true,
      index: true
    },

    // 🔗 STRUCTURED REFERENCE
    referenceId: {
      type: Schema.Types.ObjectId
    },

    referenceModel: {
      type: String,
      enum: ["Purchase", "Sale", "Adjustment"]
    },

    // 🔥 STOCK DEBUGGING
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
    timestamps: { createdAt: true, updatedAt: false }
  }
)

/* ================= INDEXES ================= */

// Fast inventory history per item
StockMovementSchema.index({ retailerId: 1, itemId: 1, createdAt: -1 })

// Transaction-based lookup
StockMovementSchema.index({ transactionId: 1 })

// Reference lookup
StockMovementSchema.index({ referenceId: 1, referenceModel: 1 })

const StockMovement =
  (models.StockMovement as mongoose.Model<StockMovementDocument>) ||
  model<StockMovementDocument>("StockMovement", StockMovementSchema)

export default StockMovement