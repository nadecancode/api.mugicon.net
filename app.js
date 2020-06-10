let createError = require("http-errors");
let express = require("express");
let path = require("path");
let cookieParser = require("cookie-parser");
let logger = require("morgan");
let expression = require("./util/expression");
let convict = require("convict");

let config = convict({
    port: {
        doc: "The port that MUGI API will bind on.",
        format: "port",
        default: 8002,
        env: "PORT",
        arg: "port"
    },
});

config.loadFile("./config.json");
config.validate({allowed: "strict"});

let mc_status_router = require("./routes/mc-status");
let aeries = require("./routes/aeries");
let index = require("./routes/index");

let app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/mc-status", mc_status_router);
app.use("/aeries", aeries);
app.use("/", index);

let port = config.get("port");

app.listen(port);
console.log("MUGI API is currently listening on port " + port);

module.exports = app;
