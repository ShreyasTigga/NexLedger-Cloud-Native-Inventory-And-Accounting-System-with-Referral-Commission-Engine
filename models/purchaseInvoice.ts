import mongoose, { Schema, Document, models, model } from "mongoose"

export interface PurchaseItem {
  itemId: mongoose.Types.ObjectId
  quantity: number
  costPrice: number
}

export interface PurchaseInvoiceDocument extends Document {
  supplierId: mongoose.Types.ObjectId
  invoiceNumber: string
  items: PurchaseItem[]
  totalAmount: number
  createdAt: Date
  updatedAt: Date
}

const PurchaseInvoiceSchema = new Schema<PurchaseInvoiceDocument>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true
    },
    invoiceNumber: { type: String, required: true },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item" },
        quantity: Number,
        costPrice: Number
      }
    ],
    totalAmount: Number
  },
  { timestamps: true }
)

const PurchaseInvoice =
  (models.PurchaseInvoice as mongoose.Model<PurchaseInvoiceDocument>) ||
  model<PurchaseInvoiceDocument>("PurchaseInvoice", PurchaseInvoiceSchema)

export default PurchaseInvoice
