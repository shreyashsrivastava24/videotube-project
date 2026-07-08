//jitni jldi hmari application load ho utni jldi sare env variables hr jgh available ho jane chiye taki main file me load ho jaye to sbko uska access mil jaye so hum kosis krte ki jo first file load ho rhi hai usi me env vars load ho jaye
//hme code me consistency chiye thi isliye req wala use nhi kia
//require('dotenv').config({path: './env'})
import connectDB from "./db/index.js";
import dotenv from "dotenv"
import {app} from "./app.js"

//due to import syntax
dotenv.config({
    path: './.env'
})

//Database dusre continent me hai (async await) and database se baat krne me dikkt aati hai (try catch ,promise)
//Database se to hum baat krenge hi chahe user,video controller me to hr baar itna wrapper bar bar likhna hoga so iss se acha mai ek utility file bna du jo meri help kr de...aap ko jb ek fn iss trh execute krna hai to mere method me fn pass kr dena mai execute kr k wapas de dunga ,wrapper lga dunge iske aage..........asyncHandler

connectDB()
//mongodb successfully connected...jo kam app k through krna h
.then(() => {
  //abhi tk sirf database connect hua tha ab app listen kregi
  //app listen kregi tbhi to server start hoga
  app.listen(process.env.PORT || 8000,() => {
    console.log(`Server is running at port : ${process.env.PORT}`);
  })
})
//connection failed
.catch((err)=>{
  console.log("MONGODB connection FAILED !!: ",err);
})


/*
//index file bhot polluted ho gyi iss approach se 
import express from "express"
const app = express()

// function connectDB(){
// }
// connectDB()

//use IIFE(Immediately Invoked Function Expression)
(async () => {
    try{
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      //Database connect to ho gya pr hmari express app database se baat nhi kr pa rhi
      app.on("error",(error) => {
        console.log("ERROR: ".error);
        throw error
      })
      //jb baat kr pa rhe then
      app.listen(process.env.PORT,() => {
        console.log(`App is listening on port ${process.env.PORT}`)
      })
    } catch(error){
      console.error("ERROR: ",error)
      throw error
    }
})()
    */