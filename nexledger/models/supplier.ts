import mongoose, { Schema, Document, models, model } from "mongoose"

export interface SupplierDocument extends Document {
  retailerId: mongoose.Types.ObjectId

  name: string
  phone?: string
  email?: string
  address?: string

  isActive: boolean

  createdAt: Date
  updatedAt: Date
}

const SupplierSchema = new Schema<SupplierDocument>(
  {
    retailerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true // 🔥 IMPORTANT
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      match: [/^[6-9]\d{9}$/, "Invalid phone number"]
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"]
    },

    address: {
      type: String,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

/* ================= INDEXES ================= */

// Prevent duplicate suppliers per retailer
SupplierSchema.index(
  { retailerId: 1, name: 1 },
  { unique: true }
)

// Fast lookup
SupplierSchema.index({ retailerId: 1, createdAt: -1 })

const Supplier =
  (models.Supplier as mongoose.Model<SupplierDocument>) ||
  model<SupplierDocument>("Supplier", SupplierSchema)

export default Supplier