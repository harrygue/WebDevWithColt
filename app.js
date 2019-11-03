var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
var flash = require("connect-flash");
var Campground = require("./models/campground");
var Comment = require("./models/comment");
var User = require("./models/user");
var seedDB = require("./seeds");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");

// first connection line was shown in video 304 (Jan) and throws an error, so use old connection string
// mongoose.connect("mongodb:27017//localhost/yelp_camp",{useNewUrlParser: true});
// mongoose.connect("mongodb://localhost/yelp_camp",{useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect("mongodb+srv://Harald:ObEc4511hg@yelpcampcluster-u38dh.mongodb.net/test?retryWrites=true&w=majority",{useNewUrlParser: true, useUnifiedTopology: true});

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

var campgoundRoutes = require("./routes/campgrounds"),
    commentRoutes = require("./routes/comments"),
    indexRoutes = require("./routes/index");

// ------PASSPORT CONFIGURATION ---------

app.use(require("express-session")({
    secret:"MySecret!!!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
//passport.serializeUser(function(user,done){
//    console.log("Serialize User called");
//    return	done(null,user);
//});

passport.deserializeUser(User.deserializeUser());
//passport.deserializeUser(function(user,done){
//    console.log("Deserialize User called");
//    return done(null,user);
//});


// execute seedDB function
///seedDB();

// middleware in order to pass current user to every ejs page
// need to be placed after all passport ingestions
app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/campgrounds",campgoundRoutes);
app.use("/campgrounds/:id/comments",commentRoutes);
app.use("/",indexRoutes);



app.listen(process.env.PORT || 3000,function(){
    console.log("YELPCAMP Server listens on port 3000");
});