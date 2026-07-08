//files server pe upload ho gyi now server se cloudinary
//successfully file upload ho jati hai to server se remove kr denge as server is temporary storage
// Frontend public hota hai (sab dekh sakte hain), isliye sensitive data (API_SECRET etc.) waha nahi rakhte — isliye backend/server use karte hain jahan data hidden rehta hai
// node js k saath by default aati fs(file system) lib
//fs me link = file ko access karna, unlink = file ko system se delete kar dena

import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const safeUnlink = (filePath) => {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        // Non-critical: log but don't throw
        console.error("Failed to delete temp file:", filePath, err.message);
    }
};

//file wala mamla v database jaisa pechida hai use try catch
//file upload hone me time lgega hi use async await
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            //kon sa resurce upload kr rhe
            resource_type: "auto"
        })
        safeUnlink(localFilePath);
        return response;
    } catch (error) {
        //file successfully upload nhi hui hai ya koi localfilepath me kuch error h
        //unlinkSync file delete hone tak code rokta hai, unlink background me delete karta hai bina code roke
        safeUnlink(localFilePath);
        return null;
    }
}

export { uploadOnCloudinary }