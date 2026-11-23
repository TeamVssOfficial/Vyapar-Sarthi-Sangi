
import mongoose from "mongoose";
import bcrypt from 'bcrypt'
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required to register"],
            trim: true,
            minlength: [3, "Name must be at least 3 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"]
        },

        email: {
            type: String,
            required: [true, "Email is required to register"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                "Please enter a valid email address"
            ]
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must contain at least 8 characters"],
            select: false
        },

        role: {
            type: String,
            enum: {
                values: ["user", "admin", "manager"],
                message: "{VALUE} is not a valid role"
            },
            default: "user"
        },

        lastLogin: {
            type: Date,
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        },

        isVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return
    }
    const hash = await bcrypt.hash(this.password, 10)
    this.password = hash
    return
})

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)

}

const userModel = mongoose.model("User", userSchema);

export default userModel;
