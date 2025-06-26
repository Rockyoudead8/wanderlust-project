const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalmMongoose=require('passport-local-mongoose');

const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
});

userSchema.plugin(passportLocalmMongoose);

module.exports=mongoose.model("user",userSchema);