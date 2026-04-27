import mongoose, { Schema, Document, models, model } from "mongoose"

export interface RetailerDocument extends Document {
  userId: mongoose.Types.ObjectId

  businessName: string
  ownerName: string
  email: string
  phone: string

  address: {
    line1: string
    city: string
    state: string
    pincode: string
    country: string
  }

  gstin?: string
  pan?: string

  isActive: boolean

  activeReferralConfigId?: mongoose.Types.ObjectId
}

const RetailerSchema = new Schema<RetailerDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true // 🔥 IMPORTANT
    },

    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      minlength: 2
    },

    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
      minlength: 2
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true, // 🔥 IMPORTANT
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[6-9]\d{9}$/, "Invalid Indian phone number"]
    },

    address: {
      line1: {
        type: String,
        required: [true, "Address is required"]
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      pincode: {
        type: String,
        match: [/^[1-9][0-9]{5}$/, "Invalid pincode"]
      },
      country: {
        type: String,
        default: "India"
      }
    },

    gstin: {
      type: String,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        "Invalid GSTIN format"
      ]
    },

    pan: {
      type: String,
      match: [
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        "Invalid PAN format"
      ]
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // 🔥 LINK TO ACTIVE CONFIG
    activeReferralConfigId: {
      type: Schema.Types.ObjectId,
      ref: "ReferralConfig"
    }
  },
  { timestamps: true }
)

/* ================= INDEXES ================= */

RetailerSchema.index({ email: 1 })
RetailerSchema.index({ phone: 1 })

const Retailer =
  (models.Retailer as mongoose.Model<RetailerDocument>) ||
  model<RetailerDocument>("Retailer", RetailerSchema)

export default Retailer