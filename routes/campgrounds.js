var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");

// isLoggedIn is the middleware to avoid that user can go to secret page via query link
// Index REST Route - shows all items
// router.get("/campgrounds",function(req,res) changed due to app.use("/campground",...) in app.js
router.get("/",function(req,res){

    // res.render("campgrounds",{campgrounds:campgrounds});

    // get Campgrounds from db
    Campground.find({},function(err,allCampgrounds){
        if(err){
            console.log(err);
        } else {
            // console.log(allCampgrounds);
            res.render("campgrounds/index",{campgrounds:allCampgrounds});
        }
    });
});

// Create REST Route - creates new
router.post("/",middleware.isLoggedIn,function(req,res){
    var author = { id: req.user._id, username: req.user.username};
    var newCampground = {name:req.body.name, image:req.body.url, description:req.body.description, price:req.body.price,author:author};
    // create new campground and save to db
    Campground.create(newCampground,function(err,newlyCreated){
        if(err){
            console.log(err);
        } else {
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
});

// New REST Route - shows form
router.get("/new",middleware.isLoggedIn,function(req,res){
    res.render("campgrounds/new");
});

// Show REST Route - shows details - place this after the New REST route
router.get("/:id",function(req,res){

    Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
        if(err){
            console.log("OH NO, ERROR :-(\n",err);
        } else {
            // console.log(foundCampground);
            res.render("campgrounds/show",{campground:foundCampground});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit",middleware.checkCampgroundOwnership,function(req,res){
    console.log("hit edit route");
    Campground.findById(req.params.id,function(err,foundCampground){
        res.render("campgrounds/edit",{campground:foundCampground});
    });
});
// UPDATE CAMPGROUND ROUTE
router.put("/:id",middleware.checkCampgroundOwnership,function(req,res){
    var updatedCampground = req.body.campground;
    //var author = { id: req.user._id, username: req.user.username};
    //var updatedCampground = {name:req.body.name, image:req.body.url, description:req.body.description, author:author};
    console.log(updatedCampground);
    Campground.findByIdAndUpdate(req.params.id,updatedCampground,function(err,upd_cg){
        if(err){
            console.log("Hoppla, update not work: \n",err);
            res.redirect("/campgrounds");
        } else {
            console.log("req.body.id="+req.params.id);
            req.flash("success","Successfully updated Campground " + updatedCampground.name);
            res.redirect("/campgrounds/"+req.params.id);
        }
    });    
});

// DESTROY
router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
    //res.send("hit delete route");
    Campground.findByIdAndDelete(req.params.id,function(err,campground){
        if(err){
            res.redirect("/campgrounds");
        } else {
            req.flash("success","Campground deleted!");
            res.redirect("/campgrounds");
        }
    });
});

module.exports = router;