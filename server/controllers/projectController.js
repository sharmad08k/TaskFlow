const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => e.msg),
      });
    }

    const { name, description, color } = req.body;

    const project = await Project.create({
      name,
      description,
      color,
      owner: req.user._id,
    });

    await project.populate('members.user', 'name email');

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating project',
    });
  }
};

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id,
    })
      .populate('members.user', 'name email')
      .sort({ updatedAt: -1 });

    // Get task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]);

        const counts = {
          total: 0,
          todo: 0,
          in_progress: 0,
          review: 0,
          done: 0,
        };

        taskCounts.forEach((tc) => {
          counts[tc._id] = tc.count;
          counts.total += tc.count;
        });

        const projectObj = project.toObject();
        projectObj.taskCounts = counts;

        // Get the current user's role
        const member = project.members.find(
          (m) => m.user._id.toString() === req.user._id.toString()
        );
        projectObj.myRole = member ? member.role : null;

        return projectObj;
      })
    );

    res.json({
      success: true,
      data: projectsWithCounts,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching projects',
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private (member)
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'members.user',
      'name email'
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check membership
    const member = project.members.find(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project',
      });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const projectObj = project.toObject();
    projectObj.tasks = tasks;
    projectObj.myRole = member.role;

    res.json({
      success: true,
      data: projectObj,
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching project',
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (admin only)
exports.updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => e.msg),
      });
    }

    const project = req.project;
    const { name, description, color, status } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;
    if (status) project.status = status;

    await project.save();
    await project.populate('members.user', 'name email');

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating project',
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (admin only)
exports.deleteProject = async (req, res) => {
  try {
    const project = req.project;

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    res.json({
      success: true,
      message: 'Project and all associated tasks deleted',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting project',
    });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (admin only)
exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = req.project;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already a member
    const existingMember = project.members.find(
      (m) => m.user.toString() === userId
    );
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    project.members.push({
      user: userId,
      role: role || 'member',
    });

    await project.save();
    await project.populate('members.user', 'name email');

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding member',
    });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (admin only)
exports.removeMember = async (req, res) => {
  try {
    const project = req.project;
    const { userId } = req.params;

    // Can't remove the owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project owner',
      });
    }

    const memberIndex = project.members.findIndex(
      (m) => m.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in project',
      });
    }

    project.members.splice(memberIndex, 1);

    // Unassign tasks from removed member
    await Task.updateMany(
      { project: project._id, assignee: userId },
      { assignee: null }
    );

    await project.save();
    await project.populate('members.user', 'name email');

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing member',
    });
  }
};

// @desc    Update member role
// @route   PUT /api/projects/:id/members/:userId
// @access  Private (admin only)
exports.updateMemberRole = async (req, res) => {
  try {
    const project = req.project;
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be admin or member',
      });
    }

    // Can't change owner's role
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot change the project owner's role",
      });
    }

    const member = project.members.find((m) => m.user.toString() === userId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in project',
      });
    }

    member.role = role;
    await project.save();
    await project.populate('members.user', 'name email');

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating member role',
    });
  }
};
