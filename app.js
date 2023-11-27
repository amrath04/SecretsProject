//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session'); //step1
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();



app.use(express.static("public"));
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({ extended: true }));

//step2
app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());    //passportjs.org documentation

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email:String,
    password:String,
});

userSchema.plugin(passportLocalMongoose);  //step3

//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());  //step4

passport.serializeUser(User.serializeUser());  
passport.deserializeUser(User.deserializeUser());


app.get("/",(req,res)=>{
    res.render("home.ejs")
})
app.get("/login",(req,res)=>{
    res.render("login.ejs")
})
app.get("/register",(req,res)=>{
    res.render("register.ejs")
});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
})

app.post("/register",(req,res)=>{
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login",function(req,res){
  const user = new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user, function(err){   //login method comes from passport
    if(err){
        console.log(err);
    }else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        });
    }
  })   
});

app.get("/logout", function(req, res) {
    req.logout(function(err) {
        if (err) {
            console.error(err);
        }
        res.redirect("/");
    });
});

app.listen(3000,function(){
    console.log("Server running on port 3000");
})