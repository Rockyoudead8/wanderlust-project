const mongoose = require('mongoose');
const listing = require('../models/listings');
const inData = require('./data');
const user=require("../models/user")
mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');

const inDB = async () => {
    await listing.deleteMany({});

    const foundUser = await user.findOne();  // use imported model directly

    const updatedData = inData.data.map(obj => ({
        ...obj,
        owner: foundUser._id
    }));

    await listing.insertMany(updatedData);
    console.log('data was saved');
};

inDB();


inDB();
