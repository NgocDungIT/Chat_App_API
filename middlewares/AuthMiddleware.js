const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).send('You are not authorized!');

    jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
        if (err) {
            return res.status(403).send('Token is not verified!');
        }
        req.userId = decoded.data.userId;
        next();
    });
}

module.exports = { verifyToken };
