const { response } = require("express");
const listing = require("../models/listings");
const review = require("../models/reviews.js");
const user = require("../models/user.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.getListing = async (req, res) => {
    const { id } = req.params;
    const data = await listing.findById(id).populate({
        path: 'reviews', populate: {
            path: 'author',
        }
    }).populate('owner');
    if (!data) {
        req.flash("error", "Listing not found");
        return res.redirect("/");
    }
    res.render("listing", { data });
}

module.exports.newListing = async (req, res, next) => {
   const response= await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    })
        .send()
        
    
    const url = req.file.path;
    const filename = req.file.filename;
    const newListing = new listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry=response.body.features[0].geometry;
    await newListing.save();
    req.flash("success", "Listing created successfully");
    res.redirect("/");
}

module.exports.delReview = async (req, res) => {
    let { id, reviewId } = req.params;
    await listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await review.findByIdAndDelete(reviewId);
    req.flash("success", "review deleted successfully");
    res.redirect(`/listings/${id}`);
}

module.exports.updateListing1 = async (req, res) => {
    const { id } = req.params;
    const listingToEdit = await listing.findById(id);
    if (!listingToEdit) {
        req.flash("error", "listing not found");
        return res.redirect("/");
    }
    res.render("update", { listing: listingToEdit });
}

module.exports.updateListing2 = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body.listing;

    const existingListing = await listing.findById(id);
    if (!existingListing) {
        req.flash("error", "listing not found");
        return res.redirect("/");
    }

    const updatedlisting = await listing.findByIdAndUpdate(id, updatedData);
    if (typeof req.file !== "undefined") {
        const url = req.file.path;
        const filename = req.file.filename;
        updatedlisting.image = { url, filename };
        await updatedlisting.save();
    }
    req.flash("success", "Listing updated successfully");
    res.redirect("/");
}

module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;
    const dellisting = await listing.findByIdAndDelete(id);
    if (!dellisting) {
        req.flash("error", "listing not found");
        return res.redirect("/");
    }
    req.flash("success", "Listing deleted successfully");
    res.redirect("/");
}

module.exports.addReview = async (req, res) => {
    let foundListing = await listing.findById(req.params.id);
    let newreview = new review(req.body.review);
    newreview.author = req.user._id;
    foundListing.reviews.push(newreview);
    await foundListing.save();
    await newreview.save();
    req.flash("success", "review added successfully");
    res.redirect(`/listings/${foundListing._id}`);
}

module.exports.signup = async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const newuser = new user({ email, username });
        const registeredUser = await user.register(newuser, password);
        req.login(registeredUser, (err) => {
            if (err) {
                next(err);
            }
            req.flash("success", "User registered successfully");
            res.redirect("/");
        })

    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
}

module.exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            req.flash("error", "logout was not done successfully");
            return res.redirect("/");
        }
        req.flash("success", "user logged out successfully");
        res.redirect("/");
    })
}