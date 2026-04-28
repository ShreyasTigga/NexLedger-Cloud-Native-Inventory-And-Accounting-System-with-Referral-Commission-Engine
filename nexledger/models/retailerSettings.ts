import mongoose, { Schema, models, model } from "mongoose"

const RetailerSettingsSchema = new Schema({
  retailerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  categories: {
    type: [String],
    default: []
  },

  units: {
    type: [String],
    default: []
  }
})

export default models.RetailerSettings ||
  model("RetailerSettings", RetailerSettingsSchema)