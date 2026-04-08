import mongoose, { Schema, Document, models, model } from "mongoose"

interface SalesItem {
  itemId: mongoose.Types.ObjectId
  name: string
  quantity: number
  price: number
  taxRate: number
  cgst: number
  sgst: number
  gstAmount: number
  total: number
}

export interface SalesInvoiceDocument extends Document {
  retailerId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  items: SalesItem[]
  totalAmount: number
  status: string
  createdAt: Date
}

const SalesInvoiceSchema = new Schema<SalesInvoiceDocument>(
  {
    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        name: String,
        quantity: Number,
        price: Number,
        taxRate: Number,
        cgst: Number,
        sgst: Number,
        gstAmount: Number,
        total: Number
      }
    ],

    totalAmount: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered"],
      default: "paid"
    }
  },
  { timestamps: true }
)

// 🔥 compound index (fast queries)
SalesInvoiceSchema.index({ retailerId: 1, createdAt: -1 })

export default models.SalesInvoice ||
  model<SalesInvoiceDocument>("SalesInvoice", SalesInvoiceSchema)