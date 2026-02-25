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
    name: { type: String, required: true },

    sku: { type: String, required: true, unique: true },

    barcode: { type: String, unique: true, sparse: true },

    category: { type: String, required: true },

    brand: { type: String },

    unit: {
      type: String,
      required: true,
      default: "piece"
    },

    costPrice: { type: Number, required: true },

    sellingPrice: { type: Number, required: true },

    taxRate: {
      type: Number,
      required: true,
      default: 0
    },

    stockQuantity: {
      type: Number,
      default: 0
    },

    reorderLevel: {
      type: Number,
      required: true,
      default: 5
    },

    defaultSupplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier"
    }
  },
  { timestamps: true }
)

const Item =
  (models.Item as mongoose.Model<ItemDocument>) ||
  model<ItemDocument>("Item", ItemSchema)

export default Item