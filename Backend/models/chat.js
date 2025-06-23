import mongoose from "mongoose";
const schema = new mongoose.Schema({
  name: String,
  message: String,
  sender: String,
  timestamp: { type: Date, default: Date.now }
});
export default mongoose.model("Chat", schema);
