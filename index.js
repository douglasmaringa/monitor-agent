const express = require("express");
const app = express();
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

// Routes imports
const agentRoute = require("./routes/agent");

// Middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(cors());

// Initializing routes
app.use("/api/agent", agentRoute);

app.listen(8080, () => {
  console.log("Server running on port 8080");
});
