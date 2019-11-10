var express = require("express");
var router = express.Router();
var path = require('path');
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function(req,file,callback){
        callback(null,Date.now() + file.originalname);
    }
});
var imageFilter = function(req,file,cb){
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
        return cb(new Error('Only image files are allowed!'),false);
    }  
    cb(null, true)
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'dlxmy2ytu',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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
router.post("/",middleware.isLoggedIn,upload.single('image'),function(req,res){
    cloudinary.uploader.upload(req.file.path, function(result){
        req.body.campground.image = result.secure_url;
        req.body.campground.image_id = result.public_id;
        req.body.campground.author = { id: req.user._id, username: req.user.username};
    // create new campground and save to db
        Campground.create(req.body.campground,function(err,newCampground){
            if(err){
                req.flash("error",err.message);
                console.log("ERROR: \n",err);V
                return res.redirect('back');
            } 
            req.flash("success","New Campground successfully created !")
            return res.redirect("/campgrounds/" + newCampground.id);
        });
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
router.put("/:id",middleware.checkCampgroundOwnership,upload.single('image'),function(req,res){
    // if a new file has been uploaded
    if(req.file){
        Campground.findById(req.params.id,function(err, campground){
            if(err){
                req.flash("error", err.message);
                return res.redirect('back');
            }
            console.log("Campground found, delete now old file with ", campground.image);
            console.log("image_id: ", path.basename(campground.image).split(".")[0]);
            // delete the old image from cloudinary
            if(!campground.image_id){
                // retrieve image_id from URL: it is the file name without extension
                campground.image_id = path.basename(campground.image).split(".")[0];
                console.log("image_id: ",campground.image_id);
            }
            cloudinary.v2.uploader.destroy(campground.image_id, function(err,result){
                if(err){
                    req.flash("error",err.message);
                    return res.redirect('back');
                }
                // upload a new one
                console.log("old image deleted");
                cloudinary.v2.uploader.upload(req.file.path,function(err,result){
                    if(err){
                        res.flash("error",err.message);
                        return res.redirect('back');
                    }
                    console.log("upload new image", result.public_id);
                    // add the cloudinary url for the immage to the campground
                    req.body.campground.image = result.secure_url;
                    // add image puplic id to the campground object
                    req.body.campground.image_id = result.public_id;
                    Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,campground){
                        if(err){
                            console.log("Hoppla, update not work: \n",err);
                            return res.redirect("/campgrounds");
                        } 
                        console.log("Campground updated ",req.params.id);
                        req.flash("success","Successfully updated Campground " + campground.name);
                        return res.redirect("/campgrounds/"+campground.id);
                    });    
                });
            });
        });
    } else {
        Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updatedCampground){
            if(err){
                console.log("Hoppla, update not work: \n",err);
                return res.redirect("/campgrounds");
            } 
            console.log("req.body.id="+req.params.id);
            req.flash("success","Successfully updated Campground " + updatedCampground.name);
            return res.redirect("/campgrounds/"+updatedCampground.id);
        });    
    }
});

// DESTROY
router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
    //res.send("hit delete route");
    Campground.findByIdAndDelete(req.params.id,function(err,campground){
        if(err){
            req.flash("error",err.message) 
            return res.redirect("/campgrounds");
        } 
        cloudinary.v2.uploader.destroy(campground.image_id,function(err,result){
            if(err){
                req.flash("error",err.massage);
                return res.redirect('back');
            }
            Comment.deleteMany({_id: { $in: campground.comments}}, function(err){
                if(err){
                    req.flash("error",err.message); 
                    return res.redirect('back');
                } 
                req.flash("success","Campground including comments deleted!");
                return res.redirect("/campgrounds");
            });
        });
    });
});

module.exports = router;