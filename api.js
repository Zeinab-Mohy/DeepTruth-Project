
const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('./models/user.model');

module.exports = async (req, res) => {
    const filePath = req.query.filePath;
    const img = filePath;
    const url = "http://127.0.0.1:5000/submit/".concat(img);

    try {
        const response = await axios.post(url, {
            header: {
                'Content-Type': 'application/json',
            },
        });
        const userName = req.session.name;
        const userEmail = req.session.email;

        const prediction = response.data['predict'];
        const imgPath = response.data['img_path'];
        const datetime = new Date().toLocaleString();
        if(userName&&userEmail){
            // Find the document in the database
            const existingResponse = await User.findOne({name:userName,email:userEmail});

            // Update the history field by pushing a new response object
            existingResponse.imageHistory.push({
                imagePath: imgPath,
                prediction: prediction,
                datetime: datetime
            });

            // Save the updated document
            await existingResponse.save();
        }

        // Redirect or render as needed
        res.redirect(`/?imagePath=${encodeURIComponent(imgPath)}&prediction=${encodeURIComponent(prediction)}&datetime=${encodeURIComponent(datetime)}`);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};
