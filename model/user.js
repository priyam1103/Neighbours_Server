  
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const config = require("../service/config");
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
    },
    mobileNo: {
      type: String,
      required: true,
      unique: true,
    },
    
    verification: {
      otp: {
        type: String,
        default: () => Math.floor(100000 + Math.random() * 900000),
      },
    },
    current_loc: {
      type: Object,
      default:null
    },
    socketId: {
      type:String
    },
    image: {
      type:String
    },
    mood: {
      type:String
    },
    birthday: {
      type:String,
      default:"",
    },
    description: {
      type: String,
      default:"",
    },
    likes: {
      type: String,
      default:"",
    },
    dislikes: {
      type: String,
      default:"",
    },
    reviews: {
      type: String,
      default:"",
      
    },
    verified: {
      type: Boolean,
      default:false
    },
    notifications: {
      type: Array,
      default: [],
    },
    incomingConnections: {
      type: Array,
      default:[]
    },
    outgoingConnections: {
      type: Array,
      default:[]
    },
    matched: {
      type: Object,
      default:{}
    },
    connectionRequests: {
      type: Array,
      default: []
    },
    comments: {
      type: Array,
      default:[]
    },
    connections: {
      type: Number,
      default:0
    }
   
  },
  { timestamps: true },{versionKey: false}
);

UserSchema.method("generateAuthToken", async function () {
  const user = this;
  const token = jwt.sign(
    { id: user._id, username: user.username },
    config.JWT_SECRET
  );
  return token;
});



const User = mongoose.model("User", UserSchema);
module.exports = User;