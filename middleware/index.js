var express = require("express");
var Comment = require("../models/comment");
var Campground = require("../models/campground");

var middleware = {};


// middleware to test if user is authenticated (loggied in) and has permission to edit or delete a certain comment
middleware.checkCommentOwnership = function(req,res,next){
    if(req.isAuthenticated()){
        console.log("Inside Comment Middleware, user authenticated");
        Comment.findById(req.params.comment_id,function(err,selectedComment){
            if(err){
                console.log("Hoppla, \n",err);
                req.flash("error","Something went wrong when trying to access this comment!");
                res.redirect("back");
            } else {
                // use .equals to be able to compare a string with an object (mongoose object)
                if(selectedComment.author.id.equals(req.user._id)){
                    console.log("correct user");
                    next();
                } else {
                    console.log("incorrect user, not allowed to update or delete comments");
                    req.flash("error","You don't have permission to do that!");
                    res.redirect("back");
                }
            }
        });
    } else {
        console.log("redirect to back");
        req.flash("error","You need to be logged in to do that!");
        res.redirect("back");
    }
}

// middleware to test if user is authenticated (loggied in) and has permission to edit or delete a certain campground
middleware.checkCampgroundOwnership = function(req,res,next){
    if(req.isAuthenticated()){
        console.log("user authenticated");
        Campground.findById(req.params.id,function(err,foundCampground){
            if(err){
                console.log("Hoppla, \n",err);
                req.flash("error","Campground not found!");
                res.redirect("back");
            } else {
                // use .equals to be able to compare a string with an object (mongoose object)
                if(foundCampground.author.id.equals(req.user._id)){
                    console.log("correct user");
                    next();
                } else {
                    req.flash("error","You don't have permission to do that!");
                    res.redirect("back");
                }
            }
        });
    } else {
        console.log("redirect to back");
        req.flash("error","You need to be logged in to do that!");
        res.redirect("back");
    }
}

// middleware to test if user is logged in otherwise he can go to secret page via search line
middleware.isLoggedIn = function(req,res,next){
    console.log("isLoggedIn called!");
    if(req.isAuthenticated()){
        console.log("user " + req.body.username + " is authenicated!")
        return next();
    }
    req.flash("error","Please Login First !");
    res.redirect("/login");
}

module.exports = middleware;