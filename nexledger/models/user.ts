import mongoose, { Schema, Document, models, model } from "mongoose"

export interface UserDocument extends Document {
  name: string
  email?: string
  phone?: string
  password: string

  role: "customer" | "retailer"

  refreshToken?: string | null

  referralCode?: string

  isActive: boolean

  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"]
    },

    phone: {
      type: String,
      sparse: true,
      unique: true,
      match: [/^[6-9]\d{9}$/, "Invalid phone number"]
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["customer", "retailer"],
      required: true,
      index: true // 🔥 IMPORTANT
    },

    refreshToken: {
      type: String,
      default: null
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

/* ================= INDEXES ================= */

// Role-based queries
UserSchema.index({ role: 1 })

const User =
  (models.User as mongoose.Model<UserDocument>) ||
  model<UserDocument>("User", UserSchema)

export default User