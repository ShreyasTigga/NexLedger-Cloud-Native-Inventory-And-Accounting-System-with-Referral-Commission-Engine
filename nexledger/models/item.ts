import mongoose, { Schema, Document, models, model } from "mongoose"

export interface ItemDocument extends Document {
  name: string
  sku: string
  barcode?: string
  category: string
  brand?: string
  unit: string
  costPrice: number
  sellingPrice: number
  taxRate: number
  stockQuantity: number
  reorderLevel: number
  retailerId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ItemSchema = new Schema<ItemDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    // ✅ FIXED: removed global unique
    sku: {
      type: String,
      required: true,
      trim: true
    },

    // ✅ barcode NOT unique (real-world correct)
    barcode: {
      type: String,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    brand: {
      type: String,
      trim: true
    },

    unit: {
      type: String,
      default: "piece",
      required: true
    },

    // ✅ Prevent negative values
    costPrice: {
      type: Number,
      required: true,
      min: 0
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },

    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    stockQuantity: {
      type: Number,
      default: 0,
      min: 0 // ✅ important
    },

    reorderLevel: {
      type: Number,
      default: 5,
      min: 0
    },

    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true // ✅ faster queries
    }
  },
  {
    timestamps: true
  }
)

/* ================= INDEXES ================= */

// ✅ Multi-tenant SKU uniqueness (MOST IMPORTANT)
ItemSchema.index({ retailerId: 1, sku: 1 }, { unique: true })

// ✅ Fast category filtering
ItemSchema.index({ category: 1 })

// ✅ Text search
ItemSchema.index({ name: "text" })

// ✅ Faster search inside retailer
ItemSchema.index({ retailerId: 1, name: 1 })

// ✅ Optional: barcode search
ItemSchema.index({ barcode: 1 })

const Item =
  (models.Item as mongoose.Model<ItemDocument>) ||
  model<ItemDocument>("Item", ItemSchema)

export default Item