const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - no token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized - invalid token',
    });
  }
};

// Check project membership and role
const projectAuth = (...roles) => {
  return async (req, res, next) => {
    try {
      const Project = require('../models/Project');
      const projectId =
        req.params.projectId || req.params.id || req.body.project;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required',
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
        });
      }

      const member = project.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );

      if (!member) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this project',
        });
      }

      if (roles.length > 0 && !roles.includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}`,
        });
      }

      req.project = project;
      req.memberRole = member.role;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
      });
    }
  };
};

module.exports = { protect, projectAuth };
