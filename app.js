//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session'); //step1
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
    googleId:String,
    secret:String,
});

userSchema.plugin(passportLocalMongoose);  //step3
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());  //step4


passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",(req,res)=>{
    res.render("home.ejs")
});

app.get('/auth/google',
    passport.authenticate('google',{scope:["profile"]})
);
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login",(req,res)=>{
    res.render("login.ejs")
})
app.get("/register",(req,res)=>{
    res.render("register.ejs")
});

app.get("/secrets", function (req, res) {
    // Find users with non-null secrets
    User.find({ "secret": { $ne: null } })
    .then(foundUsers => {
        // Render the "secrets" view with the found users
        res.render("secrets", { userWithSecrets: foundUsers || [] });
    })
    .catch(err => {
        console.error(err);
        // Handle the error, e.g., by sending an error response
        res.status(500).send("Internal Server Error");
    });
});




app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    console.log(submittedSecret)
    console.log(req.user.id);
    User.findById(req.user.id)
    .then(foundUser => {
        if (foundUser) {
            foundUser.secret = submittedSecret;
            return foundUser.save();
        }
    })
    .then(() => res.redirect("/secrets"))
    .catch(err => console.error(err)); 
});

app.post("/register",function(req,res){
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
});