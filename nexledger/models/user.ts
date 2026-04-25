import mongoose, { Schema, Document, models, model } from "mongoose"

export interface UserDocument extends Document {
  name: string
  email?: string
  phone?: string
  password: string
  role: "customer" | "retailer"
  refreshToken?: string | null

  referralCode?: string // ✅ NEW

  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      sparse: true,
      lowercase: true,
      unique: true 
    },

    phone: {
      type: String,
      sparse: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["customer", "retailer"],
      required: true
    },

    refreshToken: {
      type: String,
      default: null
    },

    referralCode: {
      type: String,
      unique: true,   
      sparse: true    
    }
  },
  {
    timestamps: true
  }
)

const User =
  (models.User as mongoose.Model<UserDocument>) ||
  model<UserDocument>("User", UserSchema)

export default User