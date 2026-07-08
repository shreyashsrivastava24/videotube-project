import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// faced challenges here
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    const totalComments = await Comment.countDocuments({ video: videoId });
    const comments = await Comment.find({ video: videoId })
        .populate("owner", "username fullName avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    const totalPages = Math.ceil(totalComments / limitNum);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                pagination: {
                    totalComments,
                    currentPage: pageNum,
                    totalPages,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            },
            "Comments fetched successfully"
        )
    )

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    const { content } = req.body;
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required")
    }
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });
    const populatedComment = await Comment.findById(comment._id).populate("owner", "username fullName avatar");

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                populatedComment,
                "Comment added successfully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    const { videoId, commentId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }
    const { content } = req.body;
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required")
    }
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content: content },
        { new: true }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedComment,
                "Comment Updated Successfully"
            )
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}