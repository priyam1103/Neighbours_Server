const mongoose = require("mongoose");

const OnlineSchema = new mongoose.Schema({
    username: {
        type:String
    },
    mobileNo: {
      type:String  
    },
    current_time: {
      type:Date  
    },
    reason: {
        type: String
    },
    mood: {
        type:String
    },
    address: {
        type:Object                         
    },
    location: {
        type:Object
    },
    intrest: {
        type:String
    },
    image: {
        type:Object
    },
    matched: {
        type: Boolean,
      default:false  
    },
    ofUser: {
        
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    
        
    }
}, { versionKey: false })

const Online = mongoose.model("Online", OnlineSchema)
module.exports = Online;