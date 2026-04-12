//agr kisi route pe file aayegi to mai iss middleware ko lga dunga
//form ka data ja rha images v lete jao
//yha pe mereko filename mil jayegi as ye return krta file name jo path aana chiye tha wo aa jayega

import multer from "multer";

//we are using disk storage instead of memory storage
const storage = multer.diskStorage({
    //here req is request jo aa rhi, file agr aa rhi to uske liye file and cb means callback
    destination: function (req, file, cb) {
        //destination de diya...mai sari files public folder me rkhunga
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        //jis v name se user ne rkha tha usi name se save kr lenge not a good practice as same name ki kai files ho to overwrite ho jayengi
        cb(null, file.originalname)
    }
})

export const upload = multer({
     storage, 
    })