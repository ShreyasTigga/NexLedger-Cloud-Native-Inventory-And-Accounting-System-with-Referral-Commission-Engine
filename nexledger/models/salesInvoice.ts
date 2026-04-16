import mongoose, { Schema, Document, models, model } from "mongoose"

interface SalesItem {
  itemId: mongoose.Types.ObjectId
  name: string
  quantity: number
  price: number
  taxRate: number

  cgst: number
  sgst: number

  cgstAmount: number
  sgstAmount: number

  gstAmount: number
  total: number
}

export interface SalesInvoiceDocument extends Document {
  retailerId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  referredBy?: mongoose.Types.ObjectId

  items: SalesItem[]

  totalAmount: number
  status: "pending" | "paid" | "shipped" | "delivered"

  createdAt: Date
  updatedAt: Date
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
      required: true,
      index: true
    },

    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "Customer"
    },

    items: [
      {
        itemId: {
          type: Schema.Types.ObjectId,
          ref: "Item",
          required: true
        },

        name: {
          type: String,
          required: true
        },

        quantity: {
          type: Number,
          required: true,
          min: 1
        },

        price: {
          type: Number,
          required: true,
          min: 0
        },

        taxRate: {
          type: Number,
          required: true,
          min: 0
        },

        cgst: {
          type: Number,
          required: true,
          min: 0
        },

        sgst: {
          type: Number,
          required: true,
          min: 0
        },

        cgstAmount: {
          type: Number,
          required: true,
          min: 0
        },

        sgstAmount: {
          type: Number,
          required: true,
          min: 0
        },

        gstAmount: {
          type: Number,
          required: true,
          min: 0
        },

        total: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered"],
      default: "paid"
    }
  },
  {
    timestamps: true
  }
)

// 🔥 INDEXES (IMPORTANT FOR PERFORMANCE)

// Retailer dashboard
SalesInvoiceSchema.index({ retailerId: 1, createdAt: -1 })

// Customer order history
SalesInvoiceSchema.index({ customerId: 1, createdAt: -1 })

// Optional: faster referral tracking
SalesInvoiceSchema.index({ referredBy: 1 })

const SalesInvoice =
  (models.SalesInvoice as mongoose.Model<SalesInvoiceDocument>) ||
  model<SalesInvoiceDocument>("SalesInvoice", SalesInvoiceSchema)

export default SalesInvoice