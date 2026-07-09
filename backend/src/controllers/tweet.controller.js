import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty")
    }
    const tweet = await Tweet.create(
        {
            content: content.trim(),
            owner: req.user._id
        }
    )
    if (!tweet) {
        throw new ApiError(500, "Failed to create tweet");
    }

    return res.status(201).json(
        new ApiResponse(201, tweet, "Tweet created successfully")
    );
})

// Reusable aggregation pipeline stages (after optional $match)
const buildTweetPipeline = (currentUserId) => {
    const userObjId = currentUserId
        ? new mongoose.Types.ObjectId(String(currentUserId))
        : null;

    return [
        // Join owner info
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
            }
        },
        { $unwind: "$ownerDetails" },
        // Join likes
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "tweetLikes"
            }
        },
        // Compute likesCount and isLiked
        {
            $addFields: {
                likesCount: { $size: "$tweetLikes" },
                isLiked: userObjId
                    ? { $in: [userObjId, "$tweetLikes.likedBy"] }
                    : false,
                owner: {
                    _id: "$ownerDetails._id",
                    username: "$ownerDetails.username",
                    fullName: "$ownerDetails.fullName",
                    avatar: "$ownerDetails.avatar"
                }
            }
        },
        // Clean up
        {
            $project: {
                tweetLikes: 0,
                ownerDetails: 0
            }
        },
        { $sort: { createdAt: -1 } }
    ];
};

const getAllTweets = asyncHandler(async (req, res) => {
    const pipeline = buildTweetPipeline(req.user?._id);
    const tweets = await Tweet.aggregate(pipeline);

    return res.status(200).json(
        new ApiResponse(200, tweets, "Tweets fetched successfully")
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const targetUserId =
        userId && isValidObjectId(userId)
            ? new mongoose.Types.ObjectId(userId)
            : new mongoose.Types.ObjectId(String(req.user._id));

    const pipeline = [
        { $match: { owner: targetUserId } },
        ...buildTweetPipeline(req.user?._id)
    ];

    const tweets = await Tweet.aggregate(pipeline);

    return res.status(200).json(
        new ApiResponse(200, tweets, "User tweets fetched successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }
    const { content } = req.body;
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty");
    }
    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user._id
        },
        { content: content?.trim() },
        { new: true, runValidators: true }
    )
    if (!updatedTweet) {
        throw new ApiError(404, "Unauthorized request or tweet not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedTweet,
                "Tweet Updated Successfully"
            )
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }
    const tweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user._id
    });
    if (!tweet) {
        throw new ApiError(404, "Tweet not found or unauthorized");
    }

    res.status(200).json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    );
})

export {
    createTweet,
    getAllTweets,
    getUserTweets,
    updateTweet,
    deleteTweet
}