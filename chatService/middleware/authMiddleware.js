const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Middleware to verify user token
const verifyUserToken = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.USER_JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid user token' });
      }
      req.userId = decoded.id;
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.ADMIN_JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid admin token' });
      }
      req.adminId = decoded.id;
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Middleware to verify either user or admin token
const verifyAnyToken = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Try user token first
    jwt.verify(token, process.env.USER_JWT_SECRET, (userErr, userDecoded) => {
      if (!userErr) {
        req.userId = userDecoded.id;
        return next();
      }

      // If user token is invalid, try admin token
      jwt.verify(token, process.env.ADMIN_JWT_SECRET, (adminErr, adminDecoded) => {
        if (adminErr) {
          return res.status(401).json({ message: 'Invalid token' });
        }
        req.adminId = adminDecoded.id;
        next();
      });
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Helper function to extract token from request
const extractToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.userToken) {
    return req.cookies.userToken;
  } else if (req.cookies?.adminToken) {
    return req.cookies.adminToken;
  }
  return null;
};

module.exports = {
  verifyUserToken,
  verifyAdminToken,
  verifyAnyToken
};