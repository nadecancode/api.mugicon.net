let net = require("net");
let express = require("express");
let expression = require("../util/expression");

let router = express.Router();

let MC_DEFAULT_PORT = 25565;
let NUM_FIELDS = 6;      // number of values expected from server

router.get("/", async (request, response,) => {
    let port = request.query["port"] ? Number.parseInt(request.query["port"]) : MC_DEFAULT_PORT; // If the port parameter doesn"t exist then use the MineCraft default one
    if (port < 0 || port > 65535) { // The port must be between 0 and 65535
        response
            .status(400)
            .send({
                "code": 400,
                "message": "The `port` value must be an integer between 0 and 25565"
            });
        return;
    }

    let address = request.query["address"];
    if (address === null || typeof address !== "string" || (!expression.isValidDomain(address) && !expression.isValidAddress(address))) {
        response
            .status(400)
            .send({
                "code": 400,
                "message": "The `address` value is not valid, it has to be either a domain or an IPv4 address"
            });
        return;
    }

    let timeout = Math.min(5000, request.query["timeout"] !== null ? request.query["timeout"] : Number.MAX_VALUE);

    let startTime = new Date(), latency = -1;

    let socketConnection = net.connect({
        host: address,
        port: port
    }, function () {
        let buf = Buffer.alloc(2);
        buf[0] = 254;
        buf[1] = 1;
        latency = new Date() - startTime;
        socketConnection.write(buf);
    });

    socketConnection
        .setTimeout(timeout, () => {
            response
                .status(404)
                .send({
                    "code": 404,
                    "message": "Cannot connect to the specified server, or the timeout exceeded",
                    "data": {
                        "host": address,
                        "port": port
                    }
                });

            socketConnection.end();
        });

    socketConnection
        .on("data", data => {
            // https://github.com/ldilley/minestat/blob/master/JavaScript/minestat.js, since there is no point trying to reinvent the wheel
            if (data !== null && data !== "") {
                let serverInfo = data.toString().split("\x00\x00\x00");
                if (serverInfo !== null && serverInfo.length >= NUM_FIELDS) {
                    response
                        .status(200)
                        .send({
                            "code": 200,
                            "message": "Success",
                            "data": {
                                "minecraft_version": serverInfo[2].replace(/\u0000/g, ""),
                                "server_motd": serverInfo[3].replace(/\u0000/g, ""),
                                "player_count": serverInfo[4].replace(/\u0000/g, ""),
                                "max_player_count": serverInfo[5].replace(/\u0000/g, ""),
                                "latency": latency
                            }
                        });
                } else {
                    response
                        .status(401)
                        .send({
                            "code": 401,
                            "message": "Could not establish a connection to the server, it\"s probably offline"
                        });
                }
            }
            socketConnection.end();
        });

    socketConnection
        .once("error", (e) => {
            response
                .status(401)
                .send({
                    "code": 401,
                    "message": "Unexpected error occurred during the socket connection, could not establish a connection to the specified server",
                    "data": {
                        "address": address,
                        "port": port
                    }
                });
        })
});

module.exports = router;