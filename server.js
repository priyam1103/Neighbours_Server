const express = require("express");
const app = express();
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose");
const auth = require("./middleware/auth")
const config = require("./service/config");
const { cloudinary } = require("./cloudinary");
const http = require("http");
const server = http.createServer(app) 
const io = require("socket.io")(server);
var CronJob = require('cron').CronJob;

const cors = require("cors");
app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
const Online = require("./model/online");
const User = require("./model/user");


const { user } = require("./utils/Mailer");
const PORT = 3006;
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
} 

mongoose
  .connect("mongodb+srv://priyam1103:priyam7035@cluster0.cis4d.mongodb.net/Neighbours?retryWrites=true&w=majority", { useNewUrlParser: true })
    .then(() => console.log("connected"));
  
require("./service/routes")(app);
var job = new CronJob('*/30 * * * *', async function () {


  var current_user, current_iconn, i, current_incoming, current_index, current_outgoing;
  
  const online_users = await Online.find();
  online_users.map(async(item, index) => {
    if ( new Date() - item.current_time > 30 * 60000) {
      const user_ = await User.findOne({ _id: item.ofUser })

      
      new Promise(async (resolve, reject) => {

        await user_.outgoingConnections.map(async (item, index) => {
          // console.log(item)
          current_index = -1;
       
          current_user = await User.findOne({ _id: item });
          if (current_user) {
            current_incoming = current_user.connectionRequests;
            current_iconn = current_user.incomingConnections;
            for (i = current_incoming.length - 1; i >= 0; i--) {
            
              if (current_incoming[i].from.id == user_.id) {
                current_index = i;
              
              }
            }
            if (current_index != -1) {
            // console.log(current_incoming[current_index], "accept");
              await current_incoming.splice(current_index, 1)
           
              current_user.connectionRequests = null;
              current_user.incomingConnections = null;
              current_iconn.splice(current_iconn.indexOf(user_.id), 1)
              current_user.incomingConnections = current_iconn;
              current_user.connectionRequests = current_incoming;
              // await current_user.save();
              await current_user.updateOne({ $set: { connectionRequests: current_incoming, incomingConnections: current_iconn } });
            }
          
            io.to(current_user.socketId).emit("updateRequests", current_user);
          }

        })
        resolve();
      
      }).then(async () => {
        new Promise(async (resolve, reject) => {
          await user_.incomingConnections.map(async (item, index) => {
            current_user = await User.findOne({ _id: item });
            current_outgoing = current_user.outgoingRequests;

            current_outgoing.splice(current_outgoing.indexOf(user_.id), 1);
            await current_user.updateOne({ $set: { outgoingConnections: current_outgoing } });
            
          io.to(current_user.socketId).emit("updateRequests", current_user)
          })
          resolve();
        }).then(() => {
          new Promise(async (resolve, reject) => {
     
        
            user_.connectionRequests = [];
            user_.incomingConnections = [];
            user_.outgoingConnections = [];
            user_.mood = "";
            user_.current_loc =null;
            
            resolve();
          }).then(async () => {
            await user_.save();
          // console.log(item._id)
            await Online.findOneAndDelete({_id:item._id})
            io.to(user_.socketId).emit("getUser",user_)
          })
        })
      })

      
    }
  })
}, null, true, 'America/Los_Angeles');
job.start();
var job1 = new CronJob('*/15 * * * *', async function () {
  const users = await User.find({ verified: false });
  users.map(async(item, index) => {
    await User.findOneAndDelete({ _id: item._id });
  })
}, null, true, 'America/Los_Angeles');
job1.start();
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.query.token;
    const decoded = await jwt.verify(token, config.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id });
    //console.log("hello from backend");
    if (!user) {
      
    } else {
      socket.user = user;
      next()
    }
  }
  catch (err) {
    
  }
})

io.on('connection', async (socket) => {
  const user = await User.findOneAndUpdate({ _id: socket.user._id },
    { $set: { socketId: socket.id } }, { upsert: true });
  socket.user = user;
  
  socket.on("sendConnection", async (data, callback) => {
    try {
      const { id } = data;
      var conti = true;
      const connecting_user = await User.findOne({ _id: id });
      const sending_user = await User.findOne({ _id: socket.user.id });
      sending_user.outgoingConnections.map((item, index) => {
        // console.log(item)
        if (item == id) {

        // console.log("dej")
          callback({ message: "Already sent" })
          conti = false;
        }
      })
      if (conti) {
      
      
        connecting_user.incomingConnections.push(socket.user.id);
        sending_user.outgoingConnections.push(id);
        connecting_user.connectionRequests.push({
          from: {
            image: sending_user.image,
            id: sending_user._id,
            current_mood: sending_user.mood,
            username: sending_user.username
          
          },
          timestamp: new Date()
        })
        // connecting_user.notifications.push(
        //   {
        //     from: {
        //       image: sending_user.image,
        //       id: sending_user._id,
        //       current_mood: sending_user.mood,
        //       username: sending_user.username
            
        //     },
        //     to: connecting_user.id,
        //     timestamp: new Date(), type: "incomingRequest"
        //   });
      
        await connecting_user.save();
        await sending_user.save();
        callback({ message: "sent" })
        //io.to(sending_user.socketId).emit("recieveNotification", sending_user);
        io.to(connecting_user.socketId).emit("recieveNotification", connecting_user);
      }
      //console.log(sending_user);
      //console.log(connecting_user);
    } catch (err) {
      //console.log(err)
    }
  })
  socket.on("myRequests", async (data, callback) => {
    try {
      const user = await User.findOne({ _id: socket.user.id });
    // console.log(user,"njnjk")
      callback({
  data_:user
      })
    }
    catch (err) {
    // console.log(err);
    }
  })
  socket.on("updateLocation", async (data, callback) => {
    try {
      const id = socket.user.id;
    // console.log(id, "my")
      const user = await Online.findOne({ ofUser: id });
      var current_user, current_iconn, i, current_incoming, current_index,current_outgoing;
    
       
        
        const user_ = await User.findOne({ _id: id });
        

        new Promise(async (resolve, reject) => {

          await user_.outgoingConnections.map(async (item, index) => {
            // console.log(item)
            current_index = -1;
         
            current_user = await User.findOne({ _id: item });
            current_incoming = current_user.connectionRequests;
            current_iconn = current_user.incomingConnections;
            for (i = current_incoming.length - 1; i >= 0; i--) {
              
              if (current_incoming[i].from.id == user_.id) {
                current_index = i;
                
              }
            }
            if (current_index != -1) {
            // console.log(current_incoming[current_index], "accept");
              await current_incoming.splice(current_index, 1)
             
               current_user.connectionRequests = null;
              current_user.incomingConnections = null;
              current_iconn.splice(current_iconn.indexOf(user_.id),1)
               current_user.incomingConnections = current_iconn;
              current_user.connectionRequests = current_incoming;
              // await current_user.save();
              await current_user.updateOne({ $set: { connectionRequests: current_incoming,incomingConnections:current_iconn } });
            }
            io.to(current_user.socketId).emit("updateRequests", current_user)
           

          })
          resolve();
        
        }).then(async () => {
          new Promise(async (resolve, reject) => {
            await user_.incomingConnections.map(async (item, index) => {
              current_user = await User.findOne({ _id: item });
              current_outgoing = current_user.outgoingRequests;

              current_outgoing.splice(current_outgoing.indexOf(user_.id), 1);
              await current_user.updateOne({ $set: { outgoingConnections: current_outgoing } });
              
            io.to(current_user.socketId).emit("updateRequests", current_user)
            })
            resolve();
          }).then(() => {
            new Promise(async (resolve, reject) => {
              user.mood = data.mood;
              user.location = data.location;
              user.address = data.address;
              user.image = data.image;
              user_.image = data.image;
              user_.connectionRequests = [];
              user_.incomingConnections = [];
              user_.outgoingConnections = [];
              user_.mood = data.mood;
              user_.current_loc = data.location;
              
              resolve();
            }).then(async () => {
              await user.save();
              await user_.save();
              io.to(user_.socketId).emit("getUser",user_)
            })
          })
        })
    
    // console.log("succ")
    
      callback({ message: "success" })

    } catch (err) {
      //console.log(err)
    }
  })
  socket.on("addComment", async (data, callback) => {
    const user = await User.findOne({ _id: socket.user.id });
    const user_ = await User.findOne({ _id: user.matched.with.id });
    const comment = {
      from: user.id,
      comment: data.comment,
      image:user.image
    }
    user_.comments.push(comment)
    user_.save();
    callback({message:"done"})
  // console.log(comment)
  })
  socket.on("acceptRequest", async (data, callback) => {
    try {
      const { fromId } = data;
      const accepting_user = await User.findOne({ _id: socket.user.id });
      const requested_user = await User.findOne({ _id: fromId });
      var current_user, current_iconn, i, rm_index, current_incoming, current_index;
      var c1, c2;
    // console.log(fromId)
      accepting_user.matched = {
        with: {
          id: requested_user._id,
          image: requested_user.image,
          address: requested_user.address,
          mobileNo: requested_user.mobileNo,
          mood: requested_user.mood,
          username: requested_user.username
        }
      }
      requested_user.matched = {
        with: {
          id: accepting_user._id,
          image: accepting_user.image,
          address: accepting_user.address,
          mobileNo: accepting_user.mobileNo,
          mood: accepting_user.mood,
          username: accepting_user.username
        }
      }
     // console.log(accepting_user.outgoingConnections);
     const accpt_con = accepting_user.outgoingConnections; 
      new Promise(async(resolve, reject) => {
        await accpt_con.map(async (item, index) => {
          if (requested_user.outgoingConnections.indexOf(item) != -1) {
          
            current_user = await User.findOne({ _id: item });
            current_incoming = current_user.connectionRequests;
         

            for (i = current_incoming.length - 1; i >= 0; i--) {
            
              if (current_incoming[i].from.id == accepting_user.id) {
              c1 = i;
              }
            
            if ( current_incoming[i].from.id == requested_user.id) {
              c2 = i;
             }
            }
            await current_incoming.splice(c1, 1)
            await current_incoming.splice(c2, 1)
           
            await accepting_user.outgoingConnections.splice(accepting_user.outgoingConnections.indexOf(item), 1)
            await requested_user.outgoingConnections.splice(requested_user.outgoingConnections.indexOf(item), 1)
            current_user.connectionRequests = null;
            // current_user.incomingConnections = null;
            // current_user.incomingConnections = current_iconn;
            current_user.connectionRequests = current_incoming;
            await current_user.save();
                //  await current_user.updateOne({ $set: { connectionRequests: current_incoming } })
             
                        io.to(current_user.socketId).emit("updateRequests", current_user)
            
          }
        })
        resolve();
       
    
      }).then(() => {
        new Promise(async (resolve, reject) => {

          await accepting_user.outgoingConnections.map(async (item, index) => {
            // console.log(item)
            current_index = -1;
         
            current_user = await User.findOne({ _id: item });
            current_incoming = current_user.connectionRequests;
  
            for (i = current_incoming.length - 1; i >= 0; i--) {
              
              if (current_incoming[i].from.id == accepting_user.id) {
                current_index = i;
                
              }
            }
            if (current_index != -1) {
            // console.log(current_incoming[current_index], "accept");
              await current_incoming.splice(current_index, 1)
             
               current_user.connectionRequests = null;
              // current_user.incomingConnections = null;
              // current_user.incomingConnections = current_iconn;
              current_user.connectionRequests = current_incoming;
              // await current_user.save();
              await current_user.updateOne({ $set: { connectionRequests: current_incoming } });
            }
            io.to(current_user.socketId).emit("updateRequests", current_user)
           

          })
          resolve();
        
        }).then(() => {
        // console.log(requested_user.outgoingConnections)
          new Promise(async (resolve, reject) => {
            await requested_user.outgoingConnections.map(async (item, index) => {
              // console.log(item)
              current_index = -1;
          
              current_user = await User.findOne({ _id: item });
      
          
              current_incoming = current_user.connectionRequests;
              for (i = current_incoming.length - 1; i >= 0; i--) {
                if (current_incoming[i].from.id == requested_user.id) {
                  current_index = i;
                  //// console.log(current_index);
                }
              }
              if (current_index != -1) {
              // console.log(current_incoming[current_index], "request")
                await current_incoming.splice(current_index, 1)
                 current_user.connectionRequests = null;
                // current_user.incomingConnections = null;
                // current_user.incomingConnections = current_iconn;
                current_user.connectionRequests = current_incoming;
                await current_user.updateOne({ $set: { connectionRequests: current_incoming } });
               // await current_user.save();
              }
              io.to(current_user.socketId).emit("updateRequests", current_user)
             

            })
            resolve();
          }).then(async() => {
              accepting_user.incomingConnections = [];
      accepting_user.outgoingConnections = [];
          
      accepting_user.notifications.push({
        type: "acceptRequested",
        from: {
          image: requested_user.image,
          id: requested_user._id,
          current_mood: requested_user.mood,
          username: requested_user.username
          
        },
        timestamp: new Date()
      })
            io.to(accepting_user.socketId).emit("match",requested_user);
      io.to(accepting_user.socketId).emit("updateNotification",accepting_user)
      requested_user.incomingConnections = [];
      requested_user.outgoingConnections = [];
      requested_user.notifications.push({
        type: "requestAccepted",
        from: {
          image: accepting_user.image,
          id: accepting_user._id,
          current_mood: accepting_user.mood,
          username: accepting_user.username
        
        },
        timestamp: new Date()
      })
            io.to(requested_user.socketId).emit("updateNotification", requested_user)
            io.to(requested_user.socketId).emit("match",accepting_user);
      await accepting_user.save();
            await requested_user.save();
            await Online.findOneAndUpdate({ ofUser: accepting_user.id }, { $set: { matched: true } },{new: true}, (err, doc) => {
              if (err) {
                // console.log("Something wrong when updating data!");
              }
          
            // console.log(doc);
          });
            await Online.findOneAndUpdate({ofUser: requested_user.id},{$set:{matched:true}},{new: true}, (err, doc) => {
              if (err) {
                // console.log("Something wrong when updating data!");
              }
          
            // console.log(doc);
          });
      callback({ message: "done" })
          })
        })
      
      
  
        
    
    })
        
  

           
        
      
        //await current_user.save();
       
      //  current_user.connectionRequests = null;
      // // current_user.incomingConnections = null;
      //   current_user.connectionRequests = current_incoming;
      //   delete current_user.__v;
      //  await current_user.save();
      

  
    
    } catch (err) {
    // console.log(err)
    }
  })
  socket.on("rejectRequest", async (data, callback) => {
    const { ofId } = data;
    const rejectingUser = await User.findOne({ _id: socket.user.id });
    const rejectedUser = await User.findOne({ _id: ofId });
    var c_i;
    const connreq = rejectingUser.connectionRequests;

    
    new Promise(async (resolve, reject) => {
      await rejectedUser.outgoingConnections.splice(rejectedUser.outgoingConnections.indexOf(rejectingUser.id), 1);
      await rejectedUser.notifications.push({
        type: "rejection",
        from: {
          id: rejectingUser.id,
          username: rejectingUser.username,
          image: rejectingUser.image
        }
      })
      resolve();
    }).then(async() => {
      await rejectedUser.save();
    // console.log(rejectedUser)
      io.to(rejectingUser.socketId).emit("updateRequests", rejectedUser)
            
      for (var i = connreq.length - 1; i >= 0; i--){
        if (connreq[i].from.id == rejectedUser.id) {
          c_i = i;
        }
      }

      new Promise(async (resolve, reject) => {
        await rejectingUser.connectionRequests.splice(c_i,1)
        await rejectingUser.incomingConnections.splice(rejectingUser.incomingConnections.indexOf(rejectedUser.id), 1);
        resolve();
      }).then(async () => {
        await rejectingUser.save();
        io.to(rejectingUser.socketId).emit("updateRequests", rejectingUser)
            
        callback({message:"done"})
      })
      
  
    })


   
    

  })

  socket.on("endConnection", async (data, callback) => {
  // console.log(socket.user.id)
   
    const user2 = await User.findOne({ _id: socket.user.id });
    const user_ = await User.findOne({ _id: user2.matched.with.id });

    
    // new Promise(async(resolve, reject) => {
    //   user1.matched = {};

    // })
   
      new Promise((resolve, reject) => {
        user2.matched = null;
        user2.current_loc = null;
        user2.mood = "";
        user2.connections = user2.connections + 1;
        resolve();
     
      
      }).then(async () => {
      // console.log(user2);
        await user2.save();
     
        const comment = {
          from: user2.id,
          comment: data.comment,
          image:user2.image
        }
        user_.comments.push(comment)
        user_.save();
        
      // console.log(comment)
    })
    await Online.findOneAndDelete({ofUser:socket.user.id})
    
    
    callback({message:"done"})

  })
})
app.post("/api/upload", auth, async (req, res) => {
  const id = res.locals._id;
        try {
          //console.log(req.body);
      
          const user = await User.findOne({ _id: id });
          
          const online = new Online({
            mood: req.body.mood,
            reason: req.body.reason,
            location: req.body.location,
            address: req.body.address,
            image: req.body.image,
            current_time:new Date(),
            intrest: req.body.intrest,
            ofUser: id,
            username: user.username,
            mobileNo:user.mobileNo
          });
          await online.save()
          user.image = req.body.image;
          user.mood = req.body.mood;
          user.current_loc = req.body.location;
          await user.save();

          res.status(200).json({ message: "success" });
        } catch (err) {
        // console.error(err);
          res.status(500).json({ err: "Something went wrong" });
        }
    });
      
app.get("/api/notifications", auth, async (req, res) => {
  try {
    const id = res.locals._id;
    const user = await User.findOne({ _id: id });
    const notifications = user.notifications;
    const connectionRequests = user.connectionRequests;

    res.status(200).json({ notifications,connectionRequests });
  } catch (err) {
    //console.log(err);
    res.status(400).json({ message: "Error occured" });
  }
})
app.get("/api/currentDetails",auth,async(req,res)=>{
  try{
     const id = res.locals._id;
     //console.log(id);

     const user = await Online.findOne({ofUser:id});
     //console.log(user);
     if(user == null){
  res.status(200).json({message:"No current profile"});
     }else{
     
       res.status(200).json({
  message:"Already have a current profile",
  user
})

     }
       }catch(err){
        res.status(400).json({ message: "Error occured" });
  }
})
app.get("/api/userDetails/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
  // console.log(id)
    const user = await User.findById(id);
  // console.log(user)
    res.status(200).json({ user });
  } catch (err) {
    res.status(400).json({ message:"Error" });
  }
})
app.post("/api/update/:what", auth, async (req, res) => {
  try {
    
    const id = res.locals.id;
    const { what } = req.params;
    const { data } = req.body;
    const user = await User.findOne({ _id: id });
    if (what == "likes") {
      user.likes = data;
      await user.save();   
    } else if (what == "dislikes") {
      user.dislikes = data;
      await user.save();
    }else if (what == "description") {
      user.description = data;
      await user.save();
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(400).json({message:"error"})
  }
})
app.get("/api/nearby", auth, async (req, res) => {
  try {
    const id = res.locals._id;
    const my_online_acc = await Online.findOne({ ofUser: id });
    //console.log(id)

    if (my_online_acc) {
      //console.log(lat)
      //const { lat, lng, postal } = req.params;
      const lat = my_online_acc.location.latitude;
      const lng = my_online_acc.location.longitude;
      const postal = my_online_acc.address.postalCode;
  
      const nearyby_users = await Online.find({
        "address.postalCode": postal, 'ofUser': { $ne: id }
      })
      //console.log(nearyby_users.length)
 
      const ne = [];
      nearyby_users.map((index) => {
    
        var user = index;
        ////console.log(nearyby_users[0].location)
        //console.log(index.ofUser)
        //console.log(user.location)
        var dist = getDistanceFromLatLonInKm(lat, lng, user.location.latitude, user.location.longitude);
        //console.log(dist.toFixed(2))
        user = {
          user, distance: dist.toFixed(2)
        }
        ne.push(user)
  
      })
      ////console.log(ne)
      ne.sort((a, b) => a.distance - b.distance)
  
      res.status(200).json({ ne })
    }
  } catch (err) {
    res.status(400).json({ message: "Error occured" });
  }
})

server.listen(PORT, () => {
  console.log("listening to the port: " + PORT);
});
