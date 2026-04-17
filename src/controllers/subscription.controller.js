import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (channelId.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    });

    if (existingSubscription) {
        await existingSubscription.deleteOne();

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
    }

    await Subscription.create({
        channel: channelId,
        subscriber: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, {}, "Subscribed successfully"));
});

// controller to return subscriber list of a channel
const getChannelSubscribers = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId || req.user._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.find({
        channel: channelId
    }).populate("subscriber", "username avatar email");

    const subscribersArr = subscribers
        .map(sub => sub.subscriber)
        .filter(Boolean);

    return res.status(200).json(
        new ApiResponse(200, subscribersArr, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const channelsSubscribed = await Subscription.find({
        subscriber: req.user._id
        // "channel" field me jo ObjectId hai usko actual User document se replace karega
        // "username avatar email" = projection (sirf ye fields laani hain)
        // matlab User collection se sirf username, avatar aur email hi fetch honge
        // baki fields (password, createdAt, etc.) ignore ho jayengi (better performance + clean response)
    }).populate("channel", "username avatar email");

    // improved for frontend to avoid unnecessary nesting
    const channelsArr = channelsSubscribed
        .map(sub => sub.channel)
        // har subscription object se sirf channel data nikaal raha hai
        .filter(Boolean);
        // agar koi channel null/undefined ho to usse remove kar raha hai

    return res.status(200).json(
        new ApiResponse(200, channelsArr, "Subscribed channels fetched successfully")
    )
})

export {
    toggleSubscription,
    getChannelSubscribers,
    getSubscribedChannels
}