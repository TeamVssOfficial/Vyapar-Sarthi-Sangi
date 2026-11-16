import { Timestamp } from "bson";
import mongoose from "mongoose";

const tokenblacklistschema = mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: [true, "token is already blacklist"],
    },
  },
  {
    Timestamp: true,
  },
);

const tokenblacklistmodel = mongoose.model("token", tokenblacklistschema);

export default tokenblacklistmodel;
