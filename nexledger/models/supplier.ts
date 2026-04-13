import mongoose, { Schema, Document, models, model } from "mongoose"

export interface SupplierDocument extends Document {
  retailerId: mongoose.Types.ObjectId
  name: string
  phone?: string
  email?: string
  createdAt: Date
  updatedAt: Date
}

const SupplierSchema = new Schema<SupplierDocument>(
  {
    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },    
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