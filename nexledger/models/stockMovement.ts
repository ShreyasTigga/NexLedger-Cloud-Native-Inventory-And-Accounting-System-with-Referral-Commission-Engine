import mongoose, { Schema, Document, models, model } from "mongoose"

export interface StockMovementDocument extends Document {
  retailerId: mongoose.Types.ObjectId
  itemId: mongoose.Types.ObjectId
  type: "purchase" | "sale" | "adjustment"
  quantity: number
  reference: string
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
      required: true
    },

    type: {
      type: String,
      enum: ["purchase", "sale", "adjustment"],
      required: true
    },

    quantity: {
      type: Number,
      required: true
    },

    reference: {
      type: String
    }
  },
  { timestamps: true }
)

StockMovementSchema.index({ retailerId: 1, itemId: 1 })

export default models.StockMovement ||
  model<StockMovementDocument>("StockMovement", StockMovementSchema)