import mongoose, { Schema } from "mongoose";

const propertySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, max: 9999 },
  mainImage: { type: String, maxlength: 9999 },
  description: { type: String, maxlength: 89787 },
  propertyImages: { type: [String] },
  title: { type: String, required: true, maxlength: 10220 },
  propertyType: { type: String, required: true, maxlength: 32 },
  postFor: { type: String, required: true, maxlength: 32 },
  location: {
    type: Object,
    state: { type: String, required: true, maxlength: 328989 },
    city: { type: String, required: true, maxlength: 328989 },
    localAddress :{type :String , maxlength:32000 },
    district: { type: String, required: true, maxlength: 328989 },
    pinCode: { type: String, required: true, maxlength: 328989 },
  },
  basicInfo: {
    type: Object,
    bedRooms: { type: String, required: true, maxlength: 32 },
    bathRooms: { type: String, required: true, maxlength: 32 },
    totalArea: { type: String, required: true, maxlength: 32 },
    carPetArea: { type: String, required: true, maxlength: 32 },
    ageOfProperty: { type: String, required: true, maxlength: 32 },
  },
  amenities: {
    type: Object,
    carParking: { type: String, default: "N" },
    mainMaintenance: { type: String, default: "N" },
    vastuCompliant: { type: String, default: "N" },
    powerBackup: { type: String, default: "N" },
    park: { type: String, default: "N" },
    gym: { type: String, default: "N" },
    clubHouse: { type: String, default: "N" },
  },
  landMarks: {
    type: Object,
    hospital: { type: String, required: true, maxlength: 32 },
    bank: { type: String, required: true, maxlength: 32 },
    atm: { type: String, required: true, maxlength: 32 },
    metro: { type: String, required: true, maxlength: 32 },
    railway: { type: String, required: true, maxlength: 32 },
    airport: { type: String, required: true, maxlength: 32 },
  },
  price: {
    type: String,
    required: false,
    default: "not Disclosed",
  },

  isSold: {
    type: Boolean,
    default: false,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
  postedAt: { type: Date, default: Date.now },
});

const property = mongoose.model("property", propertySchema);

export default property;
