let express = require('express');
let expression = require('../util/expression');
let token = require('../util/token');
let httpRequest = require('request');
let HTMLParser = require('fast-html-parser');
let base64 = require('../util/base64');

let tokenCache = {};

let router = express.Router();

router.post("/account/authenticate", async (request, response) => {
    let auth = request.headers['authorization'];

    if (!auth) {
        response
            .status(403)
            .send({
                "code": 403,
                "message": "A valid `Authorization` header must be included"
            });
        return;
    }

    if (!auth.startsWith("Basic")) {
        response
            .status(403)
            .send({
                "code": 403,
                "message": "Only `Basic` Authorization method is valid at this moment"
            });
        return;
    }

    auth = base64.decode(auth.replace(/^Basic/, '').trim());

    let email = auth.split(":")[0], password = auth.split(":")[1];

    if (!email || !password || !expression.isValidEmail(email)) {
        response
            .status(400)
            .send({
               "code": 400,
               "message": "Invalid request, the login request mut have both query `email` and `password`, and `email` query has to be a valid email address"
            });
        return;
    }

    retrieveAuthenticationCookie(email, (cookie) => {
        validateAuthenticationCookie(email, password, cookie, (status) => {
            if (status) {
                let key = token.randomToken(16);
                tokenCache[key] = cookie;
                response
                    .status(200)
                    .send({
                        "code": 200,
                        "message": "Success",
                        "token": key
                    });
            } else {
                response
                    .status(403)
                    .send({
                        "code": 403,
                        "message": "Failed to authenticate, possibly incorrect username or password"
                    });
            }
        })
    });
});

router.post("/account/keep-alive", async (request, response) => {
    let cookie = checkToken(request, response);
    if (cookie) {
        keepAlive(cookie, (content) => {
            if (content) {
                response
                    .status(200)
                    .send({
                        "code": 200,
                        "message": "Successfully refreshed the token's timeout time"
                    })
            }
        })
    }
});

router.post("/grades/summary", async (request, response) => {
    let cookie = checkToken(request, response);
    if (cookie) {
        fetchGrades(cookie, (content) => {
            response
                .status(200)
                .send({
                    "code": 200,
                    "data": content
                });
        });
    }
});

router.post("/grades/transcript", async (request, response) => {
    let cookie = checkToken(request, response);
    if (cookie) {
        fetchTranscript(cookie, (content) => {
            if (content) {
                response
                    .status(200)
                    .send({
                        "code": 200,
                        "data": content
                    });
            } else {
                response
                    .status(403)
                    .send({
                        "code": 403,
                        "message": "An error occurred during the attempt of fetching transcripts, please try again or refresh your authentication token"
                    });
            }
        });
    }
});

function checkToken(request, response) {
    let auth = request.headers['authorization'];
    if (!auth) {
        response
            .status(403)
            .send({
                "code": 403,
                "message": "The query `token` is missing"
            });
        return null;
    }

    if (!auth.includes("Bearer")) {
        response
            .status(403)
            .send({
               "code": 403,
               "message": "Only `Bearer` Authorization method is supported at this moment"
            });
        return;
    }
    let token = auth.replace(/^Bearer/, '').trim();

    let cookie = tokenCache[token];
    if (!cookie) {
        response
            .status(403)
            .send({
                "code": 403,
                "message": "The query `token` does not exist in the cache, please refresh it using the /account/authenticate endpoint"
            });

        return null;
    }

    return cookie;
}

function fetchTranscript(cookie, contentCallback) {
    httpRequest({
        method: 'GET',
        url: 'https://parent.hlpusd.k12.ca.us/aeries.net/Transcripts.aspx',
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cookie': cookie
        }
    }, (request, response) => {
        if (response.statusCode === 200) {
            let document = HTMLParser.parse(response.body);
            if (!document.querySelector("ctl00_MainContent_subHIS_tblEverything")) { // Parent table doesn't exist so we return an empty value here
                contentCallback({});
                return;
            }

            contentCallback({
                "graduation": {
                    "track": document.querySelector("ctl00_MainContent_subHIS_rptGPAInfo_ctl01_lblGRT2").textContent
                },
                "gpa": {
                    "weighted": Number.parseFloat(document.querySelector("ctl00_MainContent_subHIS_rptGPAInfo_ctl01_lblTP").textContent),
                    "unweighted": Number.parseFloat(document.querySelector("ctl00_MainContent_subHIS_rptGPAInfo_ctl01_lblTPN").textContent)
                },
                "credit": {
                    "attended": Number.parseFloat(document.querySelector("ctl00_MainContent_subHIS_rptGPAInfo_ctl01_lblCA").textContent),
                    "completed": Number.parseFloat(document.querySelector("ctl00_MainContent_subHIS_rptGPAInfo_ctl01_lblCC").textContent)
                },
                "ranking": {
                    "current": Number.parseInt(document.querySelector("ctl00_MainContent_subHIS_rptGPAInfo_ctl01_lblCR").textContent),
                    "size": Number.parseInt(document.querySelector("ctl00_MainContent_subHIS_rptGPAInfo_ctl01_lblCS").textContent)
                }
            });
        } else {
            contentCallback(null);
        }
    })
}

function keepAlive(cookie, contentCallback) {
    httpRequest({
        method: 'POST',
        url: 'https://parent.hlpusd.k12.ca.us/aeries.net/GeneralFunctions.asmx/KeepSessionAlive',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cookie': cookie
        }
    }, (request, response) => {
        contentCallback(response.statusCode === 200 || response.statusCode === 302); // The response code from Aeries could be either 200 or 302
    })
}

function fetchGrades(cookie, contentCallback) {
    httpRequest({
        method: 'GET',
        url: 'https://parent.hlpusd.k12.ca.us/aeries.net/Widgets/ClassSummary/GetClassSummary?IsProfile=True',
        headers: {
            'Content-Type': 'text/plain',
            'Cookie': cookie
        }
    }, (request, response) => {
        let responseContent = [];

        let content = JSON.parse(response.body);
        for (let index = 0; index < content.length; index++) {
            let gradeResponse = content[index];
            responseContent[index] = {
                "id": gradeResponse['CourseNumber'],
                "name": gradeResponse['CourseName'],
                "period": gradeResponse['Period'],
                "teacher": gradeResponse['TeacherName'],
                "room": gradeResponse['RoomNumber'],
                "grade": {
                    "percent": Number.parseFloat(gradeResponse['Percent']),
                    "mark": gradeResponse['CurrentMark']
                },
                "term": {
                    "group": gradeResponse['TermGrouping'],

                }
            };
        }

        contentCallback(responseContent);
    });
}

function validateAuthenticationCookie(email, password, cookie, validationCallback) {
    if (!cookie) {
        validationCallback(false);
        return;
    }

    httpRequest(
        {
            uri: 'https://parent.hlpusd.k12.ca.us/aeries.net/LoginParent.aspx',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36',
                'Host': 'parent.hlpusd.k12.ca.us',
                'Origin': 'https://parent.hlpusd.k12.ca.us',
                'Referer': 'https://parent.hlpusd.k12.ca.us/aeries.net/LoginParent.aspx',
                'X-Requested-With': 'XMLHttpRequest',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'navigate',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Cookie': cookie
            },
            xhrFields: {
                withCredentials: true,
            },
            form: {
                'checkCookiesEnabled': 'true',
                'checkMobileDevice': 'false',
                'checkStandaloneMode': 'false',
                'checkTabletDevice': 'false',
                'g-recaptcha-request-token': '',
                'portalAccountPassword': password,
                'portalAccountUsername': email,
                'portalAccountUsernameLabel': '',
                'submit': ''
            }
        },
        (request, response) => {
            validationCallback(response.body.includes('Object moved')); // Avoid parsing HTML documents, saves performance
        }
    )
}

function retrieveAuthenticationCookie(email, tokenCallback) {
    httpRequest(
        {
            uri: 'https://parent.hlpusd.k12.ca.us/aeries.net/GeneralFunctions.asmx/GetIDPFromDomain',
            method: 'POST',
            xhrFields: {
                withCredentials: true, // For 'set-cookie' response header
            },
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            json: {
                "EM": email // Mock Aeries request
            }
        },
        (request, response) => {
            let setCookie = response.headers['set-cookie'];
            if (!setCookie) {
                tokenCallback(null);
                return;
            }

            tokenCallback(httpRequest.cookie(setCookie[0])); // The only Cookie returned is the Session ID, so the first here is fine
        }
    )
}

module.exports = router;