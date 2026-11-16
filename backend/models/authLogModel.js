import mongoose from "mongoose";

const authLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        action: {
            type: String,
            enum: ["REGISTER", "LOGIN", "LOGOUT", "LOGIN_FAILED"],
            required: true,
        },
        ip: {
            type: String,
            default: "unknown",
        },
        userAgent: {
            type: String,
            default: "unknown",
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        metadata: {
            type: Object,
            default: {},
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const authLogModel = mongoose.model("AuthLog", authLogSchema);
export default authLogModel;
