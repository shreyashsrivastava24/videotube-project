import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Video unliked Successfully"
                )
            )
    }
    const likeCreated = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(
            201,
            likeCreated,
            "Video liked successfully"
        )
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404,"Comment not found")
    }
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Comment unliked Successfully"
            )
        )
    }
    const likeCreated = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })
    return res.status(201).json(
        new ApiResponse(
            201,
            likeCreated,
            "Comment liked Successfully"
        )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404,"Tweet not found")
    }
    const existingLike = await Like.findOne({
       tweet : tweetId,
       likedBy: req.user._id
    })
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(
            new ApiResponse(
                200,
                {},
                "Tweet unliked successfully"
            )
        )
    }
    const likeCreated = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })
    return res.status(201).json(
        new ApiResponse(
            201,
            likeCreated,
            "Tweet liked successfully"
        )
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.find({
        likedBy: req.user._id,
        // docs which have video
        video: { $exists: true, $ne: null }
        // populate as video: ObjectId → replace with full video document
    }).sort({ createdAt: -1 }).populate({
        path: "video",
        populate: {
            path: "owner",
            select: "username fullName avatar"
        }
    });

    // frontend ko sirf videos chiye 
    const videos = likes.map(like => like.video).filter(Boolean);

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Successfully fetched liked videos"
        )
    );
});

const getVideoLikesCount = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const count = await Like.countDocuments({
        video: videoId
    });
    const isLiked = await Like.exists({
        video: videoId,
        likedBy: req.user._id
    });
    return res.status(200).json(
        new ApiResponse(200, { count, isLiked: !!isLiked }, "Video likes count fetched successfully")
    );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getVideoLikesCount
}