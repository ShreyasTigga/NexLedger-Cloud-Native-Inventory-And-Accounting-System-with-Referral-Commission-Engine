import mongoose, { Schema, Document, models, model } from "mongoose"

interface SalesItem {
  itemId: mongoose.Types.ObjectId
  name: string
  quantity: number
  price: number
}

export interface SalesInvoiceDocument extends Document {
  customerName?: string
  items: SalesItem[]
  totalAmount: number
  createdAt: Date
}

const SalesInvoiceSchema = new Schema<SalesInvoiceDocument>(
  {
    customerName: String,

    items: [
      {
        itemId: {
          type: Schema.Types.ObjectId,
          ref: "Item",
          required: true
        },
        name: String,
        quantity: Number,
        price: Number
      }
    ],

    totalAmount: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
)

const SalesInvoice =
  (models.SalesInvoice as mongoose.Model<SalesInvoiceDocument>) ||
  model<SalesInvoiceDocument>("SalesInvoice", SalesInvoiceSchema)

export default SalesInvoice