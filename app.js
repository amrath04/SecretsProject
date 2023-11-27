//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
//const encrypt = require("mongoose-encryption");   //encryption algo
const md5=require("md5");


app.use(express.static("public"));
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email:String,
    password:String,
});

//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

const User = new mongoose.model("User", userSchema);


app.get("/",(req,res)=>{
    res.render("home.ejs")
})
app.get("/login",(req,res)=>{
    res.render("login.ejs")
})
app.get("/register",(req,res)=>{
    res.render("register.ejs")
});

app.post("/register",(req,res)=>{

    

    const newUser = new User({
        email:req.body.username,
        password:md5(req.body.password)

    });

    newUser.save()
    .then(result => {
      // Handle the result
      res.render("secrets.ejs");
    })
    .catch(err => {
      // Handle the error
      console.log(err);
    });

});

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);

   

    User.findOne({email:username})
  .then(foundUser => {
    // Handle the result
    if(foundUser){
        if(foundUser.password === password){
            res.render("secrets.ejs");
        }
    }
  })
  .catch(err => {
    // Handle the error
    if(err){
        console.log(err);
    }
  });

})

app.listen(3000,function(){
    console.log("Server running on port 3000");
})