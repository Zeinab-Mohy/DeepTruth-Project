
const User = require('../models/user.model');
const httpStatusText = require('../utils/httpStatusText');
const validator = require('validator')
const asyncWrapper = require("../middleware/asyncWrapper");
const bcrypt = require('bcryptjs');

const getAllUsers = asyncWrapper(async(req,res)=>{
    const users = await User.find();
    if(users==null){
        return res.status(404).json({
            status:httpStatusText.FAIL,
            data:null
        })
    }
    return res.status(200).json({
        status:httpStatusText.SUCCESS,
        data:users
    })
})

const register = asyncWrapper(async(req,res)=>{
    const {name, email, password} = req.body;
    // const name = req.body.name;
    // const email = req.body.email;
    // const password = req.body.password;
    // console.log('Request Body:', {name, email, password} );
    const validate = validator.isEmail(email);
    if(validate==false){
        return res.render('register', { showError: true, message: "Invalid Email Address",name:name,email:email });

        // return res.status(500).json({
        //     status:httpStatusText.ERROR,
        //     message:"invalid email address"
        // })
    }

    const oldUser = await User.findOne({email:email}).maxTimeMS(20000);;
    if(oldUser){
        return res.render('register', { showError: true, message: "This Email Is Already Exist",name:name,email:email });

        // return res.status(400).json({
        //     status:httpStatusText.FAIL,
        //     message:"This Email Is Already Exist",
        // })
    }

    if(!password){
        return res.render('register', { showError: true, message: "Password Is Required",name:name,email:email });

        // return res.status(500).json({
        //     status:httpStatusText.ERROR,
        //     message:"this field is required"
        // })
    }
    // const validatePassword = validator.isStrongPassword(password);
    // if(validatePassword==false){
    //     return res.status(500).json({
    //         status:httpStatusText.ERROR,
    //         message:"invalid password"
    //     })
    // }

    //password hashing
    const hashedPassword = await bcrypt.hash(password,10);

    const firstLetter = name.charAt(0).toUpperCase()
    const remainLetters = name.slice(1)
    const capitalizedName = firstLetter+remainLetters

    const newUser = new User({
        name:capitalizedName,
        email:email,
        password : hashedPassword
    });
    await newUser.save();
    res.redirect("/login");
    // return res.status(201).json({
    //     status:httpStatusText.SUCCESS,
    //     data:{
    //         user:newUser
    //     }
    // });
})

const login = asyncWrapper(async(req,res)=>{
    const {email,password} = req.body;

    if(!email){
        return res.render('login', { showError: true, message: "This Email Is Required",email:email });
        // return res.status(400).json({
        //     status:httpStatusText.FAIL,
        //     message:"Try Again",
        //     showError: true,
        // })
    }

    const validate = validator.isEmail(email);
    if(validate==false){
        return res.render('login', { showError: true, message: "Invalid Email Address",email:email });

        // return res.status(500).json({
        //     status:httpStatusText.ERROR,
        //     message:"invalid email address"
        // })
    }

    if(!email&&!password){
        return res.render('login', { showError: true,email:email, message: "Email And Password Are Required" });

        // return res.status(400).json({
        //     status:httpStatusText.FAIL,
        //     message:"Email And Password Are Required",
        //     showError: true,
        // })
    }

    const user = await User.findOne({email:email});
    if(!user){
        return res.render('login', { showError: true, message: "This Account does not exist",email:email });
        // return res.status(400).json({
        //     status:httpStatusText.FAIL,
        //     message:"Try Again",
        //     showError: true,
        // })
    }
    const matchedPassword = await bcrypt.compare(password,user.password);
    if(!password){
        return res.render('login', { showError: true, message: "This Password Is Required",email:email });
        // return res.status(400).json({
        //     status:httpStatusText.FAIL,
        //     message:"Try Again",
        //     showError: true,
        // })
    }
    if(user && matchedPassword){
        req.session.name = user.name;
        req.session.email = user.email;
        req.session.password = user.matchedPassword;
        req.session.imageHistory = user.imageHistory;
        req.session.videoHistory = user.videoHistory;
        // res.redirect('/profile');
        return res.render('profile',{name:user.name,email:user.email,imageHistory:user.imageHistory,videoHistory:user.videoHistory,avatar:user.avatar})
        // res.redirect(`/profile?name=${user.name}&email=${user.email}`);
        // return res.status(201).json({
        //     status:httpStatusText.SUCCESS,
        //     data:{
        //         user:user
        //     },
        //     massage:"Logged is successfully"
        // });
    }else{
        return res.render('login', { showError: true, message: "Password Is Invalid" ,email:email});
        // return res.status(400).json({
        //     status:httpStatusText.FAIL,
        //     message:"Try Again",
        // })
    }
})

const deleteUser = asyncWrapper(async(req,res)=>{
    const email = req.session.email;
    const matchedPassword = req.session.matchedPassword;

    const deletedUser = await User.findOneAndDelete({email:email});
    res.redirect('/logout');
    // res.status(200).json({
    //     status:httpStatusText.SUCCESS,
    //     data:null
    // });
})

const updateUser = asyncWrapper(async (req,res)=>{
    const name = req.body.name;
    const email = req.body.email ;
    const matchedPassword = req.session.password;
    const avatar =req.session.avatar

    const imageHistory = req.session.imageHistory;
    const videoHistory = req.session.videoHistory;

    const savedEmail = {email:req.session.email};
    const oldname = req.session.name;
    const oldemail = req.session.email;
    const UserData = {name,email,matchedPassword,avatar};

    const existUser = await User.findOne({email:oldemail}).maxTimeMS(20000);

    if(!name&&!email){
        return res.render('profile', { showError: true, message: "This Email & This Name Are Required",name:oldname,email:oldemail,imageHistory:imageHistory,videoHistory:videoHistory,avatar:existUser.avatar});
    }
    else if(!name){
        return res.render('profile', { showError: true, message: "This Name Is Required",name:oldname,email:oldemail,imageHistory:imageHistory,videoHistory:videoHistory ,avatar:existUser.avatar});
    }
    else if(!email){
        return res.render('profile', { showError: true, message: "This Email Is Required",name:oldname,email:oldemail,imageHistory:imageHistory,videoHistory:videoHistory,avatar:existUser.avatar });
    }

    const validate = validator.isEmail(email);
    if(validate==false){
        return res.render('profile', { showError: true, message: "Invalid Email Address",name:oldname,email:oldemail,imageHistory:imageHistory,videoHistory:videoHistory,avatar:existUser.avatar });

        // return res.status(500).json({
        //     status:httpStatusText.ERROR,
        //     message:"invalid email address"
        // })
    }

    const oldUser = await User.findOne({email:email}).maxTimeMS(20000);
    if(oldUser&&oldUser.email!=oldemail){
        return res.render('profile', { showError: true, message: "This Email Is Already Exist",name:oldname,email:oldemail,oldUser:oldUser.email,imageHistory:imageHistory,videoHistory:videoHistory,avatar:existUser.avatar });
        // return res.status(400).json({
        //     status:httpStatusText.FAIL,
        //     message:"This Email Is Already Exist",
        // })
    }
    
    const newUser = await User.findOneAndUpdate(savedEmail,UserData);
    // console.log(newUser);
    res.redirect('/login');
})

module.exports = {
    getAllUsers,
    register,
    login,
    deleteUser,
    updateUser,
}