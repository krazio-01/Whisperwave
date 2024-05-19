const jwt = require('jsonwebtoken');

const generateAuthToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, {
        expiresIn: '5d',
    });
};

module.exports = generateAuthToken;