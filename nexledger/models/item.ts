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
  defaultSupplierId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ItemSchema = new Schema<ItemDocument>(
  {
    name: {
      type: String,
      required: true
    },

    sku: {
      type: String,
      required: true,
      unique: true
    },

    barcode: {
      type: String
    },

    category: {
      type: String,
      required: true
    },

    brand: {
      type: String
    },

    unit: {
      type: String,
      default: "piece",
      required: true
    },

    costPrice: {
      type: Number,
      required: true
    },

    sellingPrice: {
      type: Number,
      required: true
    },

    taxRate: {
      type: Number,
      default: 0
    },

    stockQuantity: {
      type: Number,
      default: 0
    },

    reorderLevel: {
      type: Number,
      default: 5
    },

    defaultSupplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier"
    }
  },
  {
    timestamps: true
  }
)

ItemSchema.index({ category: 1 })
ItemSchema.index({ name: "text" })

const Item =
  (models.Item as mongoose.Model<ItemDocument>) ||
  model<ItemDocument>("Item", ItemSchema)

export default Item