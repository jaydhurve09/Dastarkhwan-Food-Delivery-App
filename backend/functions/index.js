const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

// Initialize express app
const app = express();
app.use(cors({origin: true}));


// Example route
app.get("/hello", (req, res) => {
  res.send("👋 Hello from Firebase Cloud Functions with Express!");
});

// Export the Express app as a function
exports.api = functions.https.onRequest(app);
