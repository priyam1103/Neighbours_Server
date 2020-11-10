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
  app.get("/api/nearby", auth,async (req, res) => {
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
  })
  