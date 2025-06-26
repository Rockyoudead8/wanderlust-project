if(process.env.NODE_ENV!="production"){
    require('dotenv').config()
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const listing = require("./models/listings");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./er/errorExpress.js");
const review = require("./models/reviews.js");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require("passport");
const localStrategy = require("passport-local");
const user = require("./models/user.js");
const isLoggedIn = require("./middlewares/isloggedin.js");
const multer  = require('multer')
const { saveRedirectUrl } = require("./middlewares/isloggedin.js");
const { getListing, newListing, delReview, updateListing1, updateListing2, deleteListing, addReview, signup, logout } = require("./controllers/listing.js");
const {storage}=require("./cloudConfig.js");
const upload = multer({ storage });
const url=process.env.MONGODB_URL;

// View engine & middlewares
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));



app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
const store = MongoStore.create({
    mongoUrl: url, 
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 3600, 
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};
app.use(session(sessionOptions));
app.use(flash());


// passport things
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser()); // serialize means to store the informaiton of the user
passport.deserializeUser(user.deserializeUser()); // it means to removing the information of the user


// flash middleware
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user;
    next();
});


// Connect to MongoDB
mongoose.connect(url)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("MongoDB connection error:", err));

// Routes
app.get("/", async (req, res) => {
    const allListings = await listing.find();
    res.render("index", { allListings });
});
app.get("/listings/new", isLoggedIn, (req, res) => {
    res.render("new");
});
app.get("/listings/:id", getListing);
app.post("/create", upload.single('listing[image]'),wrapAsync(newListing));
app.get("/listings/:id/update", isLoggedIn, updateListing1);
app.put("/listings/:id",upload.single('listing[image]'), updateListing2);
app.delete("/listing/:id/delete", isLoggedIn, deleteListing);

//reviews route
app.delete("/listings/:id/reviews/:reviewId", delReview);
app.post("/listings/:id/reviews", isLoggedIn, addReview);

// signup route
app.get("/signup", (req, res) => {
    res.render("signup.ejs");
})
app.post("/signup", signup);

// login route
app.get("/login", (req, res) => {
    res.render("login.ejs");
})
app.post("/login", passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true,
}), saveRedirectUrl, async (req, res) => {
    req.flash("success", "welcome to wanderlust");
    let url = res.locals.redirectUrl || "/"
    res.redirect(url);
})

// logout route
app.get("/logout", logout)

// app.all("*", (req, res, next) => {
//     next(new ExpressError(404, "page note found"));
// })

app.use((err, req, res, next) => {
    let { status = 500, message = "something went wrong" } = err;
    res.status(status).send(message);
});

// Start server
const port = 8080;
app.listen(port, () => {
    console.log("Listening on port 8080");
});
