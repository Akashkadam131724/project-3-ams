import mongoose from "mongoose";

const { connect } = mongoose;
console.log(process.env.MONGO_URI, "process.env.MONGO_URI------------")
const connectDB = async () => {
  try {
    await connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;
