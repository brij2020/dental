const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secret123";
const JWT_ISSUER = process.env.JWT_ISSUER || "dental-system";

/**
 * Verify Token
 */
exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).send({ message: "No token provided" });
  }

  try {
	const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET, { issuer: JWT_ISSUER });
    req.user = decoded;
    next();
  } catch (err) {
    console.log(err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).send({ code: 'TOKEN_EXPIRED', message: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).send({ code: 'INVALID_TOKEN', message: 'Invalid token' });
    }
    return res.status(401).send({ message: "Unauthorized" });
  }
};

/**
 * Role based access
 */
exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).send({ message: "Access denied" });
    }
    next();
  };
};
