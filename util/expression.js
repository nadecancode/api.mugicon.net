let DOMAIN_REGEX = /(?:[\w-]+\.)+[\w-]+/;

// https://stackoverflow.com/questions/4460586/javascript-regular-expression-to-check-for-ip-addresses
let IP_V4_REGEX = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/;

// https://stackoverflow.com/questions/201323/how-to-validate-an-email-address-using-a-regular-expression
let EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

module.exports.isValidDomain = function (value) {
    return DOMAIN_REGEX.test(value);
};

module.exports.isValidAddress = function (value) {
    return IP_V4_REGEX.test(value);
};

module.exports.isValidEmail = function (value) {
    return EMAIL_REGEX.test(value);
};