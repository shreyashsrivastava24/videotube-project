import { Router } from "express";
import {
    toggleSubscription,
    getChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.post("/c/:channelId", toggleSubscription);

router.get("/c/:channelId/subscribers", getChannelSubscribers);

router.get("/me/subscriptions", getSubscribedChannels);

export default router;