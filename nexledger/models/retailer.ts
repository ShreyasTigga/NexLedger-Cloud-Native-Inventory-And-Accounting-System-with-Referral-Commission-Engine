import mongoose, { Schema, Document, models, model } from "mongoose"

export interface RetailerDocument extends Document {
  userId: mongoose.Types.ObjectId
  businessName: string
}

const RetailerSchema = new Schema<RetailerDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  businessName: {
    type: String,
    required: true
  }
})

const Retailer =
  (models.Retailer as mongoose.Model<RetailerDocument>) ||
  model<RetailerDocument>("Retailer", RetailerSchema)

export default Retailer