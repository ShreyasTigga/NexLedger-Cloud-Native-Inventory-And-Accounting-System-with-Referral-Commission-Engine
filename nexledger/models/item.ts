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

  isActive: boolean // 🔥 NEW (soft delete / disable)

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

    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true // 🔥 consistency
    },

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
      min: 0
    },

    reorderLevel: {
      type: Number,
      default: 5,
      min: 0
    },

    // 🔥 IMPORTANT: disable instead of delete
    isActive: {
      type: Boolean,
      default: true
    },

    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
)

/* ================= INDEXES ================= */

// 🔥 Multi-tenant SKU uniqueness
ItemSchema.index({ retailerId: 1, sku: 1 }, { unique: true })

// 🔥 Fast POS barcode lookup (VERY IMPORTANT)
ItemSchema.index({ retailerId: 1, barcode: 1 })

// 🔥 Fast name search inside retailer
ItemSchema.index({ retailerId: 1, name: 1 })

// 🔥 Category filtering
ItemSchema.index({ retailerId: 1, category: 1 })

// 🔥 Text search
ItemSchema.index({ name: "text" })

// 🔥 Active items filter
ItemSchema.index({ retailerId: 1, isActive: 1 })

const Item =
  (models.Item as mongoose.Model<ItemDocument>) ||
  model<ItemDocument>("Item", ItemSchema)

export default Item