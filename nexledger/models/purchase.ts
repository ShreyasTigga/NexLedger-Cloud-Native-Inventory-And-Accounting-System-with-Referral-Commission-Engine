import mongoose, { Schema, models, model } from "mongoose"

const PurchaseSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    purchasePrice: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    supplierName: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
)

const Purchase =
  models.Purchase || model("Purchase", PurchaseSchema)

export default Purchase