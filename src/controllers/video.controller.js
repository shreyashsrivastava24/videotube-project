import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getPublicIdFromUrl } from "../utils/publicIdExtractor.js";

// faced lot of challenges here
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
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
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
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
  const newVideoLocalPath = req.files?.videoFile?.[0]?.path;
  const newThumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  if (!newVideoLocalPath && !newThumbnailLocalPath) {
    throw new ApiError(400, "No new video or thumbnail provided for update");
  }
  let video, thumbnail;
  if (newVideoLocalPath) {
    video = await uploadOnCloudinary(newVideoLocalPath, "video");
  }
  if (newThumbnailLocalPath) {
    thumbnail = await uploadOnCloudinary(newThumbnailLocalPath, "image");
  }
  if (!video && !thumbnail) {
    throw new ApiError(400, "Failed to upload new video or thumbnail");
  }
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      videoFile: video?.url || oldVideo.videoFile,
      thumbnail: thumbnail?.url || oldVideo.thumbnail,
      title: title || oldVideo.title,
      description: description || oldVideo.description,
      duration: video?.duration || oldVideo.duration,
    },
    { new: true }
  );
  if (video) {
    await uploadOnCloudinary.deleteVideo(getPublicIdFromUrl(oldVideo.videoFile));
  }
  if (thumbnail) {
    await uploadOnCloudinary.deleteImage(getPublicIdFromUrl(oldVideo.thumbnail));
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
  const videoPublicId = getPublicIdFromUrl(video.videoFile);
  const thumbnailPublicId = getPublicIdFromUrl(video.thumbnail);
  await uploadOnCloudinary.deleteVideo(videoPublicId);
  await uploadOnCloudinary.deleteImage(thumbnailPublicId);
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
