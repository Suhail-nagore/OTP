const express = require('express');
const mongoose = require('mongoose');
const twilio = require('twilio');
const ejs = require("ejs")
const bodyParser = require('body-parser');



const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.set("view engine", "ejs");

// Initialize Mongoose and connect to your MongoDB
mongoose.connect('mongodb+srv://gozoomtechnologies:SSo5soLQtxL5g0Eq@cluster0.fg54dni.mongodb.net/otp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Initialize Twilio client
const client = new twilio('AC3b29565601bf6629793e5425641ced3e', '75fe1c8b879c588351c0a81a39080edb'); // Replace with your Twilio Account SID and Auth Token

// Define a Mongoose model for phone numbers and OTPs
const userSchema = new mongoose.Schema({
  phoneNumber: String,
  otp: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const User = mongoose.model('User', userSchema);



app.get("/" , function(req, res) {
    res.render("index.ejs");
})

app.get("/verify", function(req, res){
    res.render("verify");
});


// Define a route for sending an OTP
app.post('/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  
  // Generate a random OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  // Send the OTP via SMS
  try {
    const message = await client.messages.create({
      to: phoneNumber,
      from: '+12029153161', // Replace with your Twilio phone number
      body: `Your OTP is: ${otp}`,
    });

    // Save the OTP in MongoDB
    await User.create({ phoneNumber, otp });

    // res.send(`OTP sent to ${phoneNumber}: ${otp}`).render("verify");
    res.render("verify");
    // console.log(`OTP sent to ${phoneNumber}: ${otp}`);
  } catch (error) {
    res.status(500).send('Failed to send OTP');
    console.log(error);
  }
});

// Define a route for verifying OTP
app.post('/verify-otp', async (req, res) => {
    const { phoneNumber, code } = req.body;
  
    try {
      // Find the latest user record for the provided phone number
      const latestUser = await User.findOne({ phoneNumber }).sort({ createdAt: -1 });
  
      if (latestUser && code == latestUser.otp) {
        res.send('OTP verified successfully.');
      } else {
        res.status(403).send('OTP verification failed.');
      }
    } catch (error) {
      console.log(error);
    }
  });
  

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
