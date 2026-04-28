import mongoose, { Schema, Document, models, model } from "mongoose"

interface SalesItem {
  itemId: mongoose.Types.ObjectId
  name: string
  quantity: number
  costPrice: number
  price: number
  taxRate: number

  cgst: number
  sgst: number

  cgstAmount: number
  sgstAmount: number
  gstAmount: number

  profit: number
  total: number
}

export interface SalesInvoiceDocument extends Document {
  retailerId: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId

  invoiceNumber: string

  // 🔥 Ledger link
  transactionId: string

  // 🔥 Referral config snapshot
  referralConfigIdUsed?: mongoose.Types.ObjectId

  referralConfigSnapshot?: {
  levels: number
  percentages: number[]
  commissionType: "percentage" | "fixed"
  maxCommissionPerSale?: number
}

  items: SalesItem[]

  subtotal: number
  taxAmount: number
  discount: number
  totalAmount: number

  profit: number

  amountPaid: number
  paymentStatus: "paid" | "partial" | "pending"

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

    invoiceNumber: {
      type: String,
      required: true,
      trim: true
    },

    // 🔥 LINK TO LEDGER
    transactionId: {
      type: String,
      required: true,
      index: true
    },

    // 🔥 CONFIG SNAPSHOT
    referralConfigIdUsed: {
      type: Schema.Types.ObjectId,
      ref: "ReferralConfig"
    },

    items: [
      {
        itemId: {
          type: Schema.Types.ObjectId,
          ref: "Item",
          required: true
        },

        name: { type: String, required: true },

        quantity: { type: Number, required: true, min: 1 },

        costPrice: { type: Number, required: true, min: 0 },

        price: { type: Number, required: true, min: 0 },

        taxRate: { type: Number, required: true, min: 0 },

        cgst: { type: Number, required: true, min: 0 },
        sgst: { type: Number, required: true, min: 0 },

        cgstAmount: { type: Number, required: true, min: 0 },
        sgstAmount: { type: Number, required: true, min: 0 },

        gstAmount: { type: Number, required: true, min: 0 },

        profit: { type: Number, default: 0 },

        total: { type: Number, required: true, min: 0 }
      }
    ],

    // 🔥 FINANCIALS
    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },

    totalAmount: { type: Number, required: true, min: 0 },

    // 🔥 PAYMENT
    amountPaid: { type: Number, default: 0, min: 0 },

    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "pending"],
      default: "paid"
    },

    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered"],
      default: "paid"
    }
  },
  { timestamps: true }
)

/* ================= INDEXES ================= */

SalesInvoiceSchema.index({ retailerId: 1, createdAt: -1 })
SalesInvoiceSchema.index({ customerId: 1, createdAt: -1 })

// 🔥 UNIQUE PER RETAILER
SalesInvoiceSchema.index(
  { retailerId: 1, invoiceNumber: 1 },
  { unique: true }
)

const SalesInvoice =
  (models.SalesInvoice as mongoose.Model<SalesInvoiceDocument>) ||
  model<SalesInvoiceDocument>("SalesInvoice", SalesInvoiceSchema)

export default SalesInvoice