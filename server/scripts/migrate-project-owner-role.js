import mongoose from "mongoose";
import ProjectMember from "../src/modules/projects/projectMember.model.js";

const LEGACY = "project_super_admin";
const CURRENT = "project_owner";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!uri) {
  console.error("Set MONGODB_URI or MONGO_URI in .env");
  process.exit(1);
}

await mongoose.connect(uri);

const result = await ProjectMember.updateMany(
  { role: LEGACY },
  { $set: { role: CURRENT } }
);

console.log(
  `Updated ${result.modifiedCount} project member(s) from ${LEGACY} to ${CURRENT}.`
);

await mongoose.disconnect();
