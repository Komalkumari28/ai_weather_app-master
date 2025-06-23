import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiroutes from "./routes/apiroutes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", apiroutes);

// Try to connect to MongoDB if URI is provided
if (process.env.MONGO_URI) {
  import("mongoose").then(({ default: mongoose }) => {
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log("✅ MongoDB Connected"))
      .catch(err => console.error("❌ MongoDB connection error:", err));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
