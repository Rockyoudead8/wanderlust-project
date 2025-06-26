const expressError=require("./errorExpress");
const express = require("express");
const app = express();
app.get("/",(req,res)=>{
    res.send("hello arpit")
})
app.get("/admin",(req,res)=>{
    throw new expressError(403,"YOU CAN NOT ACCESS THIS PAGE");
})

const port=3000;
app.listen(port,()=>{
    console.log("listening to the port 3000");
})