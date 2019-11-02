var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

// ROOT ROUTE
router.get("/",function(req,res){
    // res.send("LANDING pAGE IN WORK");
    res.render("./landing");
});

// -------AUTHENICATION ROUTES ---------------
// SHOW REGISTER FORM
router.get("/register",function(req,res){
    res.render("register");
});

router.post("/register",function(req,res){
    User.register(new User({username: req.body.username}), req.body.password, function(err,user){
        if(err){
            console.log("Hoppla \n", err);
            req.flash("error",err.message);
            return res.render("register");
        }
        passport.authenticate("local")(req,res,function(){
            req.flash("success","Welcome to YelpCamp" + user.username);
            res.redirect("campgrounds");
        });
    });
});

// lOGIN ROUTES
router.get("/login",function(req,res){
    res.render("login");
});

// passport.authenicate is called middleware,i.e runs immediately after submitting post request
// but before callback
router.post("/login",passport.authenticate("local",{
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}),function(req,res){   
    // empty
    console.log("LOGIN is this function active");
});

// LOGOUT ROUTES
router.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged you out !!!");
    
    res.redirect("/campgrounds");
});

// middleware to test if user is logged in otherwise he can go to secret page via search line
function isLoggedIn(req,res,next){
    console.log("isLoggedIn called!");
    if(req.isAuthenticated()){
        console.log("user " + req.body.username + " is authenicated!")
        return next();
    }
    
    res.redirect("/login");
}

module.exports = router;