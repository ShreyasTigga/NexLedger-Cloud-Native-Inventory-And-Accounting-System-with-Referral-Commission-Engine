import mongoose, { Schema, models, model } from "mongoose"

/* ================= PURCHASE ITEM ================= */

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
    required: true,
    min: 1
  },

  purchasePrice: {
    type: Number,
    required: true,
    min: 0
  },

  totalAmount: {
    type: Number,
    required: true,
    min: 0
  }
})

/* ================= PURCHASE INVOICE ================= */

const PurchaseInvoiceSchema = new Schema(
  {
    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // 🔥 UNIQUE PER RETAILER
    invoiceNumber: {
      type: String,
      required: true,
      trim: true
    },

    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true
    },

    // 🔥 SNAPSHOT (IMPORTANT)
    supplierName: {
      type: String,
      required: true,
      trim: true
    },

    /* ================= FINANCIALS ================= */

    subtotal: {
      type: Number,
      required: true,
      min: 0
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    discount: {
      type: Number,
      default: 0,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    /* ================= PAYMENT ================= */

    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },

    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "pending"],
      default: "pending"
    },

    /* ================= LEDGER LINK ================= */

    transactionId: {
      type: String,
      required: true,
      index: true
    },

    /* ================= ITEMS ================= */

    items: {
      type: [PurchaseItemSchema],
      required: true,
      validate: [(val: any[]) => val.length > 0, "At least one item required"]
    }
  },
  { timestamps: true }
)

/* ================= INDEXES ================= */

// Fast retrieval per retailer
PurchaseInvoiceSchema.index({ retailerId: 1, createdAt: -1 })

// 🔥 Prevent duplicate invoice numbers per retailer
PurchaseInvoiceSchema.index(
  { retailerId: 1, invoiceNumber: 1 },
  { unique: true }
)

// Supplier-based queries
PurchaseInvoiceSchema.index({ retailerId: 1, supplierId: 1 })

// Payment status queries
PurchaseInvoiceSchema.index({ retailerId: 1, paymentStatus: 1 })

const PurchaseInvoice =
  models.PurchaseInvoice ||
  model("PurchaseInvoice", PurchaseInvoiceSchema)

export default PurchaseInvoice