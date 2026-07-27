import mongoose from "mongoose";
import User from "../src/modules/users/user.model.js";

const SUPER_ADMIN = {
  name: process.env.SUPER_ADMIN_NAME,
  email: process.env.SUPER_ADMIN_EMAIL,
  password: process.env.SUPER_ADMIN_PASSWORD,
  isSuperAdmin: true,
};

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ email: SUPER_ADMIN.email });

    if (existing) {
      existing.isSuperAdmin = true;
      existing.name = SUPER_ADMIN.name;
      existing.password = SUPER_ADMIN.password;
      await existing.save();
      console.log(
        "Super Admin already existed — password re-hashed and isSuperAdmin=true"
      );
    } else {
      await User.create(SUPER_ADMIN);
      console.log("Super Admin created successfully (password hashed on save)");
    }

    console.log("\n--- Super Admin Credentials ---");
    console.log(`Email:    ${SUPER_ADMIN.email}`);
    console.log(`Password: ${SUPER_ADMIN.password}`);
    console.log("-------------------------------\n");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedSuperAdmin();
