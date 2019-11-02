var express = require("express");
var router = express.Router({mergeParams:true}); // because comment route would not work after route shortening
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

// comments new
router.get("/new",middleware.isLoggedIn,function(req,res){
    Campground.findById(req.params.id,function(err,campground){
        if(err){
            console.log(err);
        } else {
            res.render("comments/new",{campground:campground});
        }
    });
});

// comments create
router.post("/",middleware.isLoggedIn,function(req,res){
    var newComment = req.body.comment; // {author:req.body.author, text:req.body.text};
    Campground.findById(req.params.id,function(err,foundCampground){
        if(err){
            console.log("Error in find Campground by ID: \n",err)
        } else {
            Comment.create(newComment,function(err,comment){
                if(err){
                    console.log("Oh, ERROR when creating a comment!!!\n",err);
                    res.redirect("/campgrounds");
                } else {
                    // add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    foundCampground.comments.push(comment);
                    foundCampground.save();
                    req.flash("success","Comment created successfully! Thanks:-)");
                    // console.log("created new Comment for Campground: \n",foundCampground.name);
                    res.redirect("/campgrounds/" + req.params.id);
                }
            });
        }
    });
});

// EDIT for comments
router.get("/:comment_id/edit",middleware.checkCommentOwnership,function(req,res){
    console.log("hit edit route");
    Comment.findById(req.params.comment_id,function(err,selectedComment){
        if(err){
            res.redirect("back");
        } else {
            res.render("comments/edit",{selectedComment:selectedComment,campground_id:req.params.id});
        }
    });
});

// UPDATE for comments
router.put("/:comment_id",middleware.checkCommentOwnership,function(req,res){
    console.log("hit update route");
    var updatedComment = req.body.comment;
    console.log(updatedComment);
    Comment.findByIdAndUpdate(req.params.comment_id,updatedComment,function(err,selectedComment){
        if(err){
            console.log("Hoppla \n",err);
            res.redirect("back");
        } else {
            console.log("comment updated");
            req.flash("success","Comment updated successfully!");
            res.redirect("/campgrounds/"+req.params.id);
        }
    });
});

// DESTROY for comments
router.delete("/:comment_id",middleware.checkCommentOwnership,function(req,res){
    console.log("hit delete route");
    Comment.findByIdAndDelete(req.params.comment_id,function(err,selectedComment){
        if(err){
            res.redirect("back");
        } else {
            console.log("comment deleted");
            req.flash("success","Comment deleted!");
            res.redirect("back");
        }
    });
});

module.exports = router;