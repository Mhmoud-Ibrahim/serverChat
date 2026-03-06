import mongoose, { connect } from "mongoose";

export const dbConnections = () => {
  if (mongoose.connection.readyState >= 1) return;

  // تأكد أن الاسم مطابق لما وضعته في Hugging Face (سواء MONGO_URL أو MONGO_URI)
  const url = process.env.MONGO_URL;

  if (!url) {
    console.error("❌ Error: MONGO_URL is not defined in environment variables");
    return;
  }

  return connect(url)
    .then(() => console.log("✅ DB connected successfully"))
    .catch((err) => console.error("❌ DB connection error:", err));
};
