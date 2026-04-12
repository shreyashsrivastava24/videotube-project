import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

//using cors for cross origin resource sharing

const app = express();

//configuration krte hai app bnne k baad

//basically app.use hm tb use krte jb koi middleware use krni ho ya koi configuration setting

app.use(
  cors({
    //config settings
    //hm sirf apne frontend ko hi allow krenge baat krne k liye backend se
    origin: process.env.CORS_ORIGIN,
    //credentials allowed
    credentials: true,
  })
);
//data k aane ki taiyari...data body me aa skta,json se,url se etc
//unlimited json allow nhi krunga wrna server crash
// form bhra tb data liya
app.use(express.json({ limit: "16kb" }));
//if data through url,then if data is sent something then encoders or url change data
//extended allows nested objects
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
//kai bar hum images.pdf wagera apne hi folder pe store rkhna chahte hain to ek public folder bna dete taki koi v access kr skta
app.use(express.static("public"));
//cookieparse ka kaam itna sa hai ki mai mere server se user k browser se cookies access kr pau and uski cookies set v kr pau so that mai cookies pe crud operations kr pau kyuki kuch tarike hote hain jis se hum secure cookies user k browser me rkh skte ho and un secure cookies ko server hi read kr skta ,remove kr skta
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

//routes declaration
//app.get hm tb krte the jb router export nhi kr rhe the hm app k through yhi routes likh rhe the yhi controller likh rhe the but ab cheezein separated hain to middleware lana pdega so app.use
//ab koi v /users pe jayega to hm control de denge userRouter ko
app.use("/api/v1/users", userRouter);
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

export { app };
//NOTE: multer se hm file uploading configure kr skte as file v to aayegi, phle express me json easily nhi le pate the then body parser use krte the now easily le skte
