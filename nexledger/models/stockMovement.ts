import mongoose, { Schema, Document, models, model } from "mongoose"

export interface StockMovementDocument extends Document {
  retailerId: mongoose.Types.ObjectId
  itemId: mongoose.Types.ObjectId

  type: "purchase" | "sale" | "adjustment"
  direction: "in" | "out"

  quantity: number

  // 🔥 pricing snapshot
  price?: number
  unitCost?: number // 🔥 NEW (important for profit tracking)
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

    // 🔥 PRICE SNAPSHOT (IMPORTANT)
    price: {
      type: Number,
      min: 0
    },

    unitCost: {
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
      trim: true,
      index: true
    },

    referenceId: {
      type: Schema.Types.ObjectId
    },

    referenceModel: {
      type: String,
      enum: ["Purchase", "Sale", "Adjustment"]
    },

    // 🔥 CRITICAL FOR AUDIT
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
    strict: true
  }
)

/* ================= INDEXES ================= */

// 🔥 Item-level stock history
StockMovementSchema.index({
  retailerId: 1,
  itemId: 1,
  createdAt: -1
})

// 🔥 Transaction grouping
StockMovementSchema.index({
  retailerId: 1,
  transactionId: 1
})

// 🔥 Reference lookup
StockMovementSchema.index({
  referenceId: 1,
  referenceModel: 1
})

// 🔥 Type-based analytics
StockMovementSchema.index({
  retailerId: 1,
  type: 1,
  createdAt: -1
})

const StockMovement =
  (models.StockMovement as mongoose.Model<StockMovementDocument>) ||
  model<StockMovementDocument>("StockMovement", StockMovementSchema)

export default StockMovement