const User = require("../model/user");
const Mailer = require("../utils/Mailer");
const Online = require("../model/online");
const nodemailer = require("nodemailer");
exports.me = async function (req, res) {
  try {
      const id = res.locals._id;
      // console.log(id)
    const user_ = await User.findOne({ _id: id });
    const online = await Online.findOne({ ofUser: user_._id });
    if (online) {
      online.current_time = new Date();
      await online.save();
    }
    if (!user_) {
      res.status(401).json({ message: "Invalid session " });
    } else {
        // console.log(user_)
      res.status(200).json({ user_ });
    }
  } catch (err) {
    res.status(400).json({ message: "Error occured" });
  } 
};

exports.description = async function (req, res) {
  try {
    const { birthday, description, likes, dislikes,id } = req.body;
        // console.log(id)
        const user_ = await User.findOne({ _id: id });
        if (!user_) {
          res.status(401).json({ message: "Invalid session " });
        } else {
          // console.log(user_);
          user_.birthday = birthday;
          user_.description = description;
          user_.likes = likes;
          user_.dislikes = dislikes;
          
          const token = user_.generateAuthToken();
          user_.verification.otp = Math.floor(100000 + Math.random() * 900000)
          await user_.save()
// console.log(user_)
          res.status(200).json({ user_ });
         
        }
    }
  catch (err) {
    // console.log(err);
    res.status(400).json({ message: "Error occured" });
    }
}

exports.signUp = async function (req, res) {
  try {
    const { emailId, username, mobileNo } = req.body;
    const user_email = await User.findOne({ emailId: emailId.trim() });
    const user_username = await User.findOne({ username: username.trim() });
    const user_mobileno = await User.findOne({ mobileNo: mobileNo.trim() });

    //     { username: username.trim() },
    //     { mobileNo: mobileNo.trim() },
    //   ],
    // });
    if(user_email){
       res.status(401).json({
        message: "Email id already exists"
      });
    }else if(user_username){
res.status(401).json({
        message: "Username already exists"
      });
    }else if(user_mobileno){
res.status(401).json({
        message: "Mobile Number already exists"
      });

    }
    
   
    else {
    
      const user_ = new User({
        username: username.trim(),
        emailId: emailId,
        mobileNo: mobileNo,
      });
      await user_.save();
// console.log(user_)
      
      //await Mailer.sendVerifyEmail(user_, user_.verification.otp);

      res
        .status(200)
        .json({ user_, message: "Sign Up Successfull" });
    }
  } catch (err) {
      // console.log(err)
    res.status(400).json({ message: "Please try again later" });
  }
};

exports.SignIn = async function (req, res) {
  try {
    const {emailId } = req.body;
    const user_ = await User.findOne({emailId:emailId.trim() });
    if (user_) {
        user_.verification.otp = Math.floor(100000 + Math.random() * 900000)
        await user_.save()
        // console.log(user_)
      
      //   let transporter = nodemailer.createTransport({
      //     host: "smtp.gmail.com",
      //     port: 25,
      //     secure: false, 
      //     auth: {
      //       user: "priyampoddar89@gmail.com", 
      //       pass: "YamVani24",
      //     },
      //     tls: {
      //       rejectUnauthorized: false
      //   }
      //   });
      // //console.log(transporter)
      //   let info = await transporter.sendMail({
      //     from: '"Fred Foo 👻" <>', 
      //     to: `${user_.emailId}`,
      //     subject: "Neighbours OTP",
      //     html: `<p style="font-weight:bold">Hello ${user_.username} your otp is ${user_.verification.otp}.</p>`, 
      //   });
      res
        .status(200)
        .json({ user_, message: "Sign Up Successfull" });
    } else {
      res.status(401).json({ message: "Email id does not exists" });
    }
  } catch (err) {
    res.status(400).json({ message: "Error occured" });
  }
};

exports.verifyUser = async function (req, res) {
  try {
  
    const { otp, emailId } = req.body;
    const user_ = await User.findOne({ emailId: emailId });
    if (user_) {
      // console.log(otp)
     // console.log(user_.verification.otp)
      if (user_.verification.otp == otp) {
       
        user_.verification = {};
        if (!user_.verified) {
          user_.verified = true;
        }
        await user_.save();
        // console.log(await user_.generateAuthToken())
     
        const token = await user_.generateAuthToken();
        // console.log(token);
        res.status(200).json({ token, user_, message: "User verified" });
      } else {
        res.status(401).json({ message: "Invalid otp" });
      }
    } else {
      res.status(400).json({ message: "Network error" });
    }
  } catch (err) {
    res.status(400).json({ message: "Error occured" });
  }
};

exports.ResetPassToken = async function (req, res) {
  try {
    const { emailId } = req.body;
    const user = await User.findOne({ emailId: emailId });
    if (user) {
      const resetToken = await user.generateResetPasswordToken();
      await Mailer.sendResetPassword(user, resetToken);

      res.status(200).json({ message: "Reset link sent" });
    } else {
      res.status(401).json({ message: "email does not exists" });
    }
  } catch (err) {
    res.status(400).json({ message: "Error occured" });
  }
};

exports.ResetTokenVerify = async function (req, res) {
  try {
    const resetToken = req.params.resetToken;
    const user = await User.findOne({ "resetPassword.token": resetToken });

    if (user) {
      if (Date.now() > user.resetPassword.expiresIn) {
        res.status(400).json({ message: "Reset Link Expired" });
        user.resetPassword = {};
        await user.save();
      } else {
        res.status(200).json({ status: true });
      }
    } else {
      res.status(401).json({ message: "Invalid Link" });
    }
  } catch (err) {
    res.status(400).json({ message: "Error occured" });
  }
};
