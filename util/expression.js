let DOMAIN_REGEX = /(?:[\w-]+\.)+[\w-]+/;

// https://stackoverflow.com/questions/4460586/javascript-regular-expression-to-check-for-ip-addresses
let IP_V4_REGEX = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;

// https://stackoverflow.com/questions/201323/how-to-validate-an-email-address-using-a-regular-expression
let EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

let NON_MISSING_ASSIGNMENTS_SPAN_REGEX = /<span\s(?:class="NonMissingAssignment")>(.*)<\/span>/;

let MISSING_ASSIGNMENTS_SPAN_REGEX = /<span>(.*)<\/span>/; // Missing assignments would return a span wrapped with <a> tag so just detect plain <span> here is good

let GRADE_BOOK_NUMBER_REGEX = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/;

let ATTENDANCE_CUT_REGEX = /[^<>]+(?=<\/)/g; // Just cut all of the HTML text contents

module.exports.matchAttendance = function (input) {
    if (!input || input.length <= 0) return []; // If the attendance doesn't exist then just return an empty array. However it should not happen in most of the cases

    return input.match(ATTENDANCE_CUT_REGEX);
};

// Match the Gradebook Number from the provided through the combination of Regex + substring because I suck at Regex :(
module.exports.matchGradebookNumber = function (input) {
    if (!input || input.length <= 0) return -1; // If the Gradebook doesn't exist return -1 as the gradebook number

    let s = input.match(GRADE_BOOK_NUMBER_REGEX)[2];
    return Number.parseInt(s.substring(s.indexOf("GradebookNumber=") + "GradebookNumber=".length, s.indexOf("&amp")));
};

// If the user does not have any missing assignment, then the user just simply doesn't have any missing assignment (return 0)
module.exports.matchMissingAssignments = function (input) {
    let missing = input.match(MISSING_ASSIGNMENTS_SPAN_REGEX);
    if (missing) return missing[1];
    return 0;
};

module.exports.isValidDomain = function (value) {
    return DOMAIN_REGEX.test(value);
};

module.exports.isValidAddress = function (value) {
    return IP_V4_REGEX.test(value);
};

module.exports.isValidEmail = function (value) {
    return EMAIL_REGEX.test(value);
};