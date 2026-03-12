import mongoose, { Schema, Document, models, model } from "mongoose"

export interface StockMovementDocument extends Document {
  itemId: mongoose.Types.ObjectId
  type: string
  quantity: number
  reference: string
  createdAt: Date
}

const StockMovementSchema = new Schema<StockMovementDocument>(
  {
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

    quantity: Number,

    reference: String
  },
  { timestamps: true }
)

const StockMovement =
  (models.StockMovement as mongoose.Model<StockMovementDocument>) ||
  model<StockMovementDocument>("StockMovement", StockMovementSchema)

export default StockMovement