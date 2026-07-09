import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getPublicIdFromUrl } from "../utils/publicIdExtractor.js";
import { v2 as cloudinary } from "cloudinary";

// faced lot of challenges here
const getAllVideos = asyncHandler(async (req, res) => {
  // 🔹 1. query params nikaal rahe hain URL se
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  // 🔹 2. pagination ke liye skip calculate
  const skip = (page - 1) * limit;

  // 🔹 3. empty match object (yahi filter banega)
  let match = { isPublished: true }; // Only show published videos in public feed

  // 🔹 4. agar search query hai to title/description me search karo
  if (query) {
    match.$or = [
      { title: { $regex: query, $options: "i" } }, // "i" = case insensitive
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // 🔹 5. agar userId diya hai to us user ke videos hi lao
  if (userId) {
    match.owner = new mongoose.Types.ObjectId(userId);
  }

  // 🔹 6. sorting object bana rahe hain
  const sort = {};
  sort[sortBy] = sortType === "asc" ? 1 : -1; // asc = 1, desc = -1

  // 🔹 7. MongoDB aggregation pipeline run
  const videos = await Video.aggregate([
    { $match: match },     // filter apply
    { $sort: sort },       // sorting
    { $skip: skip },       // pagination (skip)
    { $limit: Number(limit) }, // kitne records chahiye
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
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
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
  ]);

  // 🔹 8. response bhejna
  res.status(200).json({
    success: true,
    count: videos.length,
    videos,
  });
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // get video and thumbnail from req.files
  const localVideoPath = req.files?.videoFile?.[0]?.path;
  const localThumbnailPath = req.files?.thumbnail?.[0]?.path;
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }
  // upload to cloudinary
  if (!localVideoPath || !localThumbnailPath) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }
  const videoFile = await uploadOnCloudinary(localVideoPath, "video");
  const thumbnail = await uploadOnCloudinary(localThumbnailPath, "image");
  if (!videoFile || !thumbnail) {
    throw new ApiError(400, "Failed to upload video and thumbnail");
  }
  // save video details in db
  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videoFile.duration,
    owner: req.user?._id,
  });
  if (!video) {
    throw new ApiError(400, "Failed to publish video");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  // url se videoId le li
  const { videoId } = req.params;
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: { views: 1 }
    },
    { new: true }
  ).populate("owner", "username fullName avatar");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  
  // Push video to user's watch history array
  if (req.user?._id) {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { watchHistory: videoId }
      }
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

// faced challenge here
const updateVideo = asyncHandler(async (req, res) => {
  // old video
  const { videoId } = req.params;
  // new title and desc
  const { title, description } = req.body;
  const oldVideo = await Video.findById(videoId);
  if (!oldVideo) {
    throw new ApiError(404, "Old Video not found");
  }

  // Check ownership
  if (oldVideo.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  const newVideoLocalPath = req.files?.videoFile?.[0]?.path;
  const newThumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  let video, thumbnail;
  if (newVideoLocalPath) {
    video = await uploadOnCloudinary(newVideoLocalPath, "video");
    if (!video) {
      throw new ApiError(500, "Failed to upload new video to cloudinary");
    }
  }
  if (newThumbnailLocalPath) {
    thumbnail = await uploadOnCloudinary(newThumbnailLocalPath, "image");
    if (!thumbnail) {
      throw new ApiError(500, "Failed to upload new thumbnail to cloudinary");
    }
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        ...(title && { title }),
        ...(description && { description }),
        ...(video?.url && { videoFile: video.url }),
        ...(video?.duration && { duration: video.duration }),
        ...(thumbnail?.url && { thumbnail: thumbnail.url }),
      }
    },
    { new: true }
  );

  // Clean up old cloudinary assets if replaced
  if (video) {
    try {
      await cloudinary.uploader.destroy(getPublicIdFromUrl(oldVideo.videoFile), {
        resource_type: "video"
      });
    } catch (err) {
      console.error("Failed to delete old video from cloudinary:", err.message);
    }
  }
  if (thumbnail) {
    try {
      await cloudinary.uploader.destroy(getPublicIdFromUrl(oldVideo.thumbnail));
    } catch (err) {
      console.error("Failed to delete old thumbnail from cloudinary:", err.message);
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        "Video updated successfully"
      )
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Ownership check
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  const videoPublicId = getPublicIdFromUrl(video.videoFile);
  const thumbnailPublicId = getPublicIdFromUrl(video.thumbnail);
  await cloudinary.uploader.destroy(videoPublicId, { resource_type: "video" });
  await cloudinary.uploader.destroy(thumbnailPublicId);
  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Ownership check
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to change the publish status of this video");
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Publish status updated successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
