import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        },
        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet"
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Problem: Agar simple unique index lagate bina partial filter ke,
// to MongoDB me issue aata kyuki har document me sirf ek field (video/comment/tweet)
// hoti hai aur baaki null/undefined hoti hain.
// Isse duplicate key errors ya unwanted conflicts aate the.
//
// Solution: Partial index use kiya taki uniqueness sirf us field par lage
// jo actually document me exist karti hai.
// Isse ensure hota hai ki ek user kisi bhi video/comment/tweet ko sirf ek hi baar like kare
// aur unnecessary index conflicts avoid ho.
likeSchema.index(
    { video: 1, likedBy: 1 },
    { unique: true, partialFilterExpression: { video: { $exists: true } } }
);

likeSchema.index(
    { comment: 1, likedBy: 1 },
    { unique: true, partialFilterExpression: { comment: { $exists: true } } }
);

likeSchema.index(
    { tweet: 1, likedBy: 1 },
    { unique: true, partialFilterExpression: { tweet: { $exists: true } } }
);

export const Like = mongoose.model("Like", likeSchema);