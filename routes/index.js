let express = require('express');

let router = express.Router();


router.get("/", (request, response) => {
    response.redirect("https://doc.mugicon.net");
});

router.post("/", (request, response) => {
    response.redirect("https://doc.mugicon.net");
});

module.exports = router;