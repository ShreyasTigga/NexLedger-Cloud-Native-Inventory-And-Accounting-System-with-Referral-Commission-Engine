import mongoose, { Schema, Document, models, model } from "mongoose"

export interface ItemDocument extends Document {
  name: string
  sku: string
  costPrice: number
  sellingPrice: number
  stockQuantity: number
  createdAt: Date
  updatedAt: Date
}

const ItemSchema = new Schema<ItemDocument>(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    stockQuantity: { type: Number, default: 0 }
  },
  { timestamps: true }
)

const Item =
  (models.Item as mongoose.Model<ItemDocument>) ||
  model<ItemDocument>("Item", ItemSchema)

export default Item
