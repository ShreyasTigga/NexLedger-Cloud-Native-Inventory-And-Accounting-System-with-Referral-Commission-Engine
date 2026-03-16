import mongoose, { Schema, Document, models, model } from "mongoose"

interface SalesItem {
  itemId: mongoose.Types.ObjectId
  name: string
  quantity: number
  price: number
}

export interface SalesInvoiceDocument extends Document {
  customerId: mongoose.Types.ObjectId
  items: SalesItem[]
  totalAmount: number
  status: string
  createdAt: Date
}

const SalesInvoiceSchema = new Schema<SalesInvoiceDocument>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

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
    },

    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered"],
      default: "paid"
   }
  },

  { timestamps: true }
)

const SalesInvoice =
  (models.SalesInvoice as mongoose.Model<SalesInvoiceDocument>) ||
  model<SalesInvoiceDocument>("SalesInvoice", SalesInvoiceSchema)

export default SalesInvoice