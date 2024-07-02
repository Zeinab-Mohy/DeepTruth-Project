
require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const UsersRouter = require('./routes/user.route');
const userController = require('./controllers/users.controller')
const httpStatusText = require('./utils/httpStatusText');
const session = require('express-session');
const cors = require('cors')
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const apiRouter = require('./api');
const api2Router = require('./api2');
const avatarRouter = require('./avatar');
const User = require('./models/user.model');
const avatar = require('./avatar');


const uri = process.env.MONGO_URL;
mongoose.connect(uri);

app.set('view engine','ejs');
app.use(express.static("public"))
app.use('/uploads',express.static(path.join(__dirname,'uploads')))
app.use('/uploads2',express.static(path.join(__dirname,'uploads2')))
app.use('/photos',express.static(path.join(__dirname,'photos')))
app.use(cors())
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));
// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json());
app.use(bodyParser.json());
// Define a route for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Set the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});
// Set up multer
const upload = multer({ storage: storage });

app.post('/submit', upload.single('my_image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    // res.send(`File uploaded successfully. Path: ${filePath}`);
    res.redirect(`/api?filePath=${encodeURIComponent(filePath)}`);

});

const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads2/'); // Set the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});
// Set up multer
const upload2 = multer({ storage: storage2 });
// const upload2 = multer({ dest: 'uploads2/' });
app.post('/vsubmit', upload2.single('my_video'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    // res.send(`File uploaded successfully. Path: ${filePath}`);
    res.redirect(`/api2?filePath=${encodeURIComponent(filePath)}`);

});

app.use('/api', apiRouter);
app.use('/api2', api2Router);
app.use('/avatar', avatarRouter);
// app.use('/',UsersRouter);
app.get('/',async(req,res)=>{
    const userName = req.session.name;
    const userEmail = req.session.email;

    const imgPath = decodeURIComponent(req.query.imagePath);
    const vidPath = decodeURIComponent(req.query.videoPath);
    const prediction = decodeURIComponent(req.query.prediction);
    const datetime = decodeURIComponent(req.query.datetime);

    if(userName){
        try {
            const user = await User.findOne({email:userEmail});
            res.render("index",{ prediction: prediction,vidPath:vidPath,imgPath:imgPath, name: userName, email: userEmail,datetime:datetime,avatar:user.avatar });
        } catch (error) {
            console.error("Error fetching user from DB:", error);
        }

    }else{
    // if(imgPath){
    //     res.render("index",{ prediction: prediction,imgPath:imgPath , name: userName, email: userEmail });
    // }else if(vidPath){
        res.render("index",{ prediction: prediction,vidPath:vidPath,imgPath:imgPath, name: userName, email: userEmail,datetime:datetime });
    // }
    }
})
app.get('/register',(req,res)=>{
    const name = "";
    const email = "";
    res.render("register",{name:name,email:email});
})
app.post('/register',userController.register)

app.get('/login',(req,res)=>{
    const email = "";
    res.render("login",{email:email});
})
app.post('/login',userController.login)

app.get('/profile', async(req, res) => {
    const userName = req.session.name;
    const userEmail = req.session.email;

    const user = await User.findOne({email:userEmail});
    res.render('profile',{name:userName,email:userEmail,imageHistory:user.imageHistory,videoHistory:user.videoHistory,avatar:user.avatar})
});

app.get('/logout', (req, res) => {
    delete req.session.name;
    delete req.session.email;
    const name = "";
    const prediction = "";
    res.render("index",{name:name,prediction:prediction});
});

app.get('/delete',userController.deleteUser);
app.post('/update',userController.updateUser);

const storage3 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'photos/'); // Set the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});
// Set up multer
const photos = multer({ storage: storage3 });

app.post('/newUpdate', photos.single('my_photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    // res.send(`File uploaded successfully. Path: ${filePath}`);
    res.redirect(`/avatar?filePath=${encodeURIComponent(filePath)}`);

});
// global middleware for not found router
app.all('*', (req, res, next)=> {
    return res.status(404).json({ status: httpStatusText.ERROR, message: 'this resource is not available'})
})


app.listen(process.env.PORT||8000,()=>{
    console.log(`server is connected successfully`);
});