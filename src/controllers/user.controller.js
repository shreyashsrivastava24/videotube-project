import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getPublicIdFromUrl } from "../utils/publicIdExtractor.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

// we dont need asynch handler here as we are not handling any web req ye hmara internal method hai
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    //access token to hm user ko de dete but refresh token hm save krke rkhte database me v taki bar bar user se password n puchna pde
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // validation skip kr do save krte time as password is req
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refersh and access tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend(filhaal hm postman se lenge)
  // destructure krke user details le rhe hain and req.body se sari details mil jati agr body se aa rhi aur jruri nhi hai ki hmesha data body se hi aaye wo url se bhi aa skta hai ya form se bhi aa skta hai
  //form ya json se data aarha hai to body me mil jayega aur url se aa rha hai to urlencoded se mil jayega
  const { fullName, email, username, password } = req.body;
  //console.log("email: ", email)

  // validation krna hoga ki user ne sahi details di hai ya nhi
  //.some() method array ke andar check krta hai ki koi bhi element condition ko satisfy krta hai ya nhi
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError("All fields are required", 400);
  }

  // check if user already exists: username,name
  // now we need to import  the user model to check if the user already exists in the database as model mongoose k through bna hai so ye database se contact kr skta
  // findone() method will return first document that matches the condition and if no document matches it will return null
  const existedUser = await User.findOne({
    // $ sign is used for logical operators in mongoose and mongodb
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(
      409,
      "User already exists with the provided username or email"
    );
  }

  // check for images,check for avatar
  // middleware req k andr aur fields add krta hai
  // multer hme req.files ka access de deta
  // localpath mtlb abhi server pr hai cloudinary pe ni
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // upload them to cloudinary and get the url
  //upload me time lgega
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  //check avatar as it is req field
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // create user obejct - create entry in db
  // remove pasword and refresh token from user object before sending response
  // check for user creation

  // database se baat kr re
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    //avatar to mandatory tha but coverimage check krna hoga
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  // mongodb hr ek entry k sath ek _id named field add kr deta
  // checking db me entry hui ya nhi
  // .select method lga k "-name_of_field -refreshToken" se selected field nhi aaynge
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return response to frontend
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body se data lao
  // username or email
  // find the user in db
  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new ApiError(
      404,
      "User not found with the provided username or email"
    );
  }

  // password check
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // access and refresh token generate
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // send cookie
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // by default ye cookies frontend se modify ho skti hai but aisa krne se sirf server se hi modifiable hogi
  const options = {
    httpOnly: true,
    secure: true,
  };

  // hmare pass cookie parser hai to cookie set krna easy hai, cookie me hm refresh token rkh rhe hain taki access token expire hone pr refresh token se naya access token generate kr ske bina user se dobara login kiye
  // hmne tokens cookies me set to kr diya tha but hum bhej re kyuki maybe user ko chiye ho tokens
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from the document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized access, refresh token is missing");
  }
  // verify the incoming refresh token
  // hmara incoming token decoded me bdl gya
  //hmne token generate krte time user id dala tha to verify krne pr hme user id mil jayega decoded token me se
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token, user not found");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token mismatch,either used or expired");
    }
    // options use krenge as cookies me token bhej rhe hain
    const options = {
      httpOnly: true,
      secure: true,
    };
    // decoded tokens
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }
  // not saved just set
  user.password = newPassword;
  // saved
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return (
    res
      .status(200)
      // req pe middleware run ho chuka hoga to req.user me user ki details hongi
      .json(
        new ApiResponse(
          200,
          req.user,
          "Current user details fetched successfully"
        )
      )
  );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    // returns the newly upated info
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // req.file ka access multer middleware se milega
  // local pr multer ne file upload kr di hogi
  // old avatar url nhi object return kr rha uss obj se avatar url nikalna hoga
  const oldAvatar = await User.findById(req.user?._id).select("avatar");
  let PublicIdOldAvatar;
  if (oldAvatar?.avatar) {
    PublicIdOldAvatar = getPublicIdFromUrl(oldAvatar?.avatar);
  }
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar image on cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  try {
    if (PublicIdOldAvatar) {
      await cloudinary.uploader.destroy(PublicIdOldAvatar);
    }
  } catch (error) {
    console.error("Error while deleting old avatar from cloudinary: ", error);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // req.file ka access multer middleware se milega
  // local pr multer ne file upload kr di hogi
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is required");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover image on cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

//aggregation pipelines
const getUserChannelProfile = asyncHandler(async (req, res) => {
  // kisi v channel ki profile chiye to uske url pe jate to params use krke username nikalenge url se
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing in the request params");
  }
  const channel = await User.aggregate([
    // lets say user is chai aur code
    // document filtered
    // hmare pass 1 doc hai ye ab iske basis pe hme lookup krna
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    // chai aur code k subscribers kitne h?
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    // maine kitno ko suscribe kiya hai
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // jo fields chahiye wo select krlo baki ko hata do
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(
      404,
      "Channel does not exist with the provided username"
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Channel fetched successfully")
    );
});

//aggregation pipelines with nested lookups and sub pipelines
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        // sub pipeline for ownwer
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              // sub pipeline for owner to get only required fields
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          // just for making frontend task easy to get data in required format
          {
            // add a field array me se first value nikal lo using first operator as owner array me hoga lookup se to usme se first value nikal lo
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "User watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
