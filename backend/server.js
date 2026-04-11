require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("Backend running ");
});

// dummy save route
app.post("/api/save", (req, res) => {
  console.log("DATA RECEIVED:", req.body);

  res.json({
    message: "Data received successfully",
    data: req.body
  });
});

app.listen(3000, () => console.log("Server running on 3000"));