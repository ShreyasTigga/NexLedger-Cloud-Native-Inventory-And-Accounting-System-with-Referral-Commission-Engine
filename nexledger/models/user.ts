import mongoose, { Schema, Document, models, model } from "mongoose"

export interface UserDocument extends Document {
  name: string
  email?: string
  phone?: string
  password: string
  role: "customer" | "retailer"
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["customer", "retailer"],
      required: true
    }
  },
  { timestamps: true }
)

const User =
  (models.User as mongoose.Model<UserDocument>) ||
  model<UserDocument>("User", UserSchema)

export default User