
const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('./models/user.model');

module.exports = async (req, res) => {
    const filePath = req.query.filePath;
    const vid = filePath;
    const url = "http://127.0.0.1:5000/vsubmit/".concat(vid);

    try {
        const response = await axios.post(url, {
            header: {
                'Content-Type': 'application/json',
            },
        });
        // res.json(response.data);
        const userName = req.session.name;
        const userEmail = req.session.email;

        const prediction = response.data['prediction'];
        const vidPath = response.data['vid_path'];
        const datetime = new Date().toLocaleString();
        if(userName&&userEmail){
            // Find the document in the database
            const existingResponse = await User.findOne({name:userName,email:userEmail});

            // Update the history field by pushing a new response object
            existingResponse.videoHistory.push({
                videoPath: vidPath,
                prediction: prediction,
                datetime:datetime
            });

            // Save the updated document
            await existingResponse.save();
        }

        // Redirect or render as needed
        res.redirect(`/?videoPath=${encodeURIComponent(vidPath)}&prediction=${encodeURIComponent(prediction)}`);
    } catch (error) {
        console.log(error);
        res.status(500).send({'Internal Server Error':error});
    }
};
