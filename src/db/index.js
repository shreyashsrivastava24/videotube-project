import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

//asynchronous method jaise hi complete hota then ek promise return krta
const connectDB = async () => {
    try {
        //mongoose ek return object deta so connection hone k baad jo v response aa rha wo hm hold kr skte is var me
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        //console.log(connectionInstance);
        //jha pe connection ho rha wo, aisa iss liye krte agr hm glti se production ki jgh kisi aur sever se connect ho to pta chl jaye
        console.log(`\n MONGODB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED: ", error);
        process.exit(1) //?
    }
}

export default connectDB