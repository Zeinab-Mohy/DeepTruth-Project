

const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('./models/user.model');

module.exports = async (req, res) => {
    const filePath = req.query.filePath;
    const name = req.session.name;
    const email = req.session.email ;
    const matchedPassword = req.session.password;
    const avatar = filePath;

    const UserData = {name,email,matchedPassword,avatar};

    const newUser = await User.findOneAndUpdate({email},UserData);
    // res.redirect('/profile');
    res.redirect(`/profile?avatar=${encodeURIComponent(avatar)}`);

};
