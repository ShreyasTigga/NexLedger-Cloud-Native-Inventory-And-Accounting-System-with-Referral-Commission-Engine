import mongoose, { Schema, Document, models, model } from "mongoose"

export interface SupplierDocument extends Document {
  name: string
  phone?: string
  email?: string
  createdAt: Date
  updatedAt: Date
}

const SupplierSchema = new Schema<SupplierDocument>(
  {
    name: { type: String, required: true },
    phone: String,
    email: String
  },
  { timestamps: true }
)

const Supplier =
  (models.Supplier as mongoose.Model<SupplierDocument>) ||
  model<SupplierDocument>("Supplier", SupplierSchema)

export default Supplier
