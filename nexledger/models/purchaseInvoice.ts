import mongoose, { Schema, models, model } from "mongoose"

const PurchaseItemSchema = new Schema({
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
  }
})

const PurchaseInvoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true
    },
    supplierName: {
      type: String,
      trim: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    items: [PurchaseItemSchema]
  },
  { timestamps: true }
)

const PurchaseInvoice =
  models.PurchaseInvoice ||
  model("PurchaseInvoice", PurchaseInvoiceSchema)

export default PurchaseInvoice