// ye sirf verify krega ki user hai ya nhi
// hme iski jrurat logout krte time pdi ki user ko logout kaise kraye,kyuki logout krne ke liye user ka access token chahiye hota hai to hme ye verify krna hoga ki token valid hai ya nhi
// hme kai jgh user ko authenticate krna hoga to har jgh ye code likhna pdega to isliye humne middleware me likha taki har jgh use kr ske
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid token: user not found")
        }
        req.user = user
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})