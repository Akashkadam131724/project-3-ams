import { Schema, model } from "mongoose";
import {
  comparePassword,
  hashPassword,
} from "../../common/helpers/password.helper.js";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function hashPasswordOnSave() {
  if (!this.isModified("password")) return;
  this.password = await hashPassword(this.password);
});

userSchema.pre("findOneAndUpdate", async function hashPasswordOnUpdate() {
  const update = this.getUpdate();
  if (!update) return;

  if (update.password) {
    update.password = await hashPassword(update.password);
  }

  if (update.$set?.password) {
    update.$set.password = await hashPassword(update.$set.password);
  }
});

userSchema.methods.comparePassword = function compareUserPassword(
  candidatePassword
) {
  return comparePassword(candidatePassword, this.password);
};

const User = model("User", userSchema);

export default User;
