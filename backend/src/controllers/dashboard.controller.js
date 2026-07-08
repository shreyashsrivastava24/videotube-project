import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

    const channelId = req.user?._id

    // total videos
    const totalVideos = await Video.countDocuments({
        owner: channelId
    })

    // total views
    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                }
            }
        }
    ])

    // total subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    })

    // total likes on all videos (only count video likes for this channel)
    const totalLikes = await Like.aggregate([
        {
            $match: {
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoData"
            }
        },
        {
            $unwind: "$videoData"
        },
        {
            $match: {
                "videoData.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "totalLikes"
        }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalViews: totalViews[0]?.totalViews || 0,
                totalSubscribers,
                totalLikes: totalLikes[0]?.totalLikes || 0
            },
            "Channel stats fetched successfully"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {

    const channelId = req.user?._id

    const videos = await Video.find({
        owner: channelId
    }).sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Channel videos fetched successfully"
        )
    )
})

export {
    getChannelStats,
    getChannelVideos
}