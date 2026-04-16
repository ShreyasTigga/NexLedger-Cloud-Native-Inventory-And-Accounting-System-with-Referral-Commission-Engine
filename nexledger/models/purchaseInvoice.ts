import mongoose, { Schema, models, model } from "mongoose"

const PurchaseItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Item",
    required: true
  },

  productName: {   
    type: String,
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
    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

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

PurchaseInvoiceSchema.index({ retailerId: 1, createdAt: -1 })

const PurchaseInvoice =
  models.PurchaseInvoice ||
  model("PurchaseInvoice", PurchaseInvoiceSchema)

export default PurchaseInvoice