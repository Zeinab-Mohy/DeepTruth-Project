
const mondoose = require('mongoose');
const validator = require('validator')

const userSchema = new mondoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail,"This field must be a valid email"]
    },
    password:{
        type: String,
        required: true,
        validate: [validator.isStrongPassword,"This field must be a strong password"]
    },
    imageHistory: [
        {
            imagePath: String,
            prediction: String,
            datetime:String
        }
    ],
    videoHistory: [
        {
            videoPath: String,
            prediction: String,
            datetime:String
        }
    ],
    avatar:{
        type:String,
        default:'photos\\profile.jpg'
    },
}) 

module.exports = mondoose.model("User",userSchema)