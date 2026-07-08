import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            // kisi v field ko searchable bnana hai to uska index true kr dete (optimised tarika for fast searaching)
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary(service like aws) url
            required: true,
        },
        coverImage: {
            type: String, //cloudinary(service like aws) url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required!']
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

//isme arrow fn use nhi krte kyuki isme this ka ref nhi hota context nhi pta hota but normal function me hota (has access to document via 'this')
//ye jo encryption wagera time taking process hai so in fn ko async likha jata h
//middleware hai to next ka access hona hi chiye,ab kam ho gya to next ko aage pass kr do
// pre hook mongoose me ek function hota hai jo ksi operation (jaise save, delete, update) ke hone se pehle automatically run hota hai,used here to hash password before storing
userSchema.pre("save", async function () {
    // If password is NOT modified → skip hashing
    if (!this.isModified("password")) return;

    //jb v ye password field save/modify ho rha encrypt kr do
    this.password = await bcrypt.hash(this.password, 10)
     // move to next middleware / save
})

//bcrypt password check v krta, true false return krta
//cryptography hai to time lgega hi
userSchema.methods.isPasswordCorrect = async function (password) {
    //bcrypt.compare → checks plain password vs hashed password(this.password)
    return await bcrypt.compare(password, this.password)
}

//dono JWT token hain

//Generate Access Token contains more user data (used for authentication)
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this.id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET, // secret key
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};


// Generate Refresh Token contains minimal data (used to get new access token)
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this.id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};


export const User = mongoose.model("User", userSchema);