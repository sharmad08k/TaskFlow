const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create a task
// @route   POST /api/projects/:projectId/tasks
// @access  Private (project member)
exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => e.msg),
      });
    }

    const { title, description, assignee, priority, dueDate, labels, status } =
      req.body;

    // If assignee is specified, verify they are a project member
    if (assignee) {
      const project = req.project;
      const isMember = project.members.some(
        (m) => m.user.toString() === assignee
      );
      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: 'Assignee must be a project member',
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      project: req.params.projectId,
      assignee: assignee || null,
      createdBy: req.user._id,
      priority,
      dueDate: dueDate || null,
      labels: labels || [],
      status: status || 'todo',
    });

    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating task',
    });
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private (project member)
exports.getProjectTasks = async (req, res) => {
  try {
    const { status, priority, assignee, sort } = req.query;

    const filter = { project: req.params.projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    let sortObj = { createdAt: -1 };
    if (sort === 'dueDate') sortObj = { dueDate: 1 };
    if (sort === 'priority') sortObj = { priority: -1 };

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort(sortObj);

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tasks',
    });
  }
};

// @desc    Get single task
// @route   GET /api/projects/:projectId/tasks/:taskId
// @access  Private (project member)
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      project: req.params.projectId,
    })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching task',
    });
  }
};

// @desc    Update task
// @route   PUT /api/projects/:projectId/tasks/:taskId
// @access  Private (project member - status only for members, all fields for admin)
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      project: req.params.projectId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const { title, description, assignee, status, priority, dueDate, labels } =
      req.body;

    // Members can update status; admins can update everything
    if (req.memberRole === 'member') {
      // Members can only update status
      if (status) task.status = status;
    } else {
      // Admins can update everything
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
      if (labels) task.labels = labels;

      if (assignee !== undefined) {
        if (assignee) {
          // Verify assignee is a project member
          const project = req.project;
          const isMember = project.members.some(
            (m) => m.user.toString() === assignee
          );
          if (!isMember) {
            return res.status(400).json({
              success: false,
              message: 'Assignee must be a project member',
            });
          }
        }
        task.assignee = assignee || null;
      }
    }

    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating task',
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/projects/:projectId/tasks/:taskId
// @access  Private (admin only)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      project: req.params.projectId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting task',
    });
  }
};

// @desc    Get dashboard data for current user
// @route   GET /api/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    // Get all projects where user is a member
    const projects = await Project.find({
      'members.user': req.user._id,
    }).select('_id name color');

    const projectIds = projects.map((p) => p._id);

    // Get all tasks assigned to user or in user's projects
    const myTasks = await Task.find({
      assignee: req.user._id,
    })
      .populate('project', 'name color')
      .populate('assignee', 'name email')
      .sort({ dueDate: 1 });

    // Get overdue tasks
    const overdueTasks = await Task.find({
      project: { $in: projectIds },
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' },
    })
      .populate('project', 'name color')
      .populate('assignee', 'name email')
      .sort({ dueDate: 1 });

    // Get task stats across all user projects
    const taskStats = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      total: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };

    taskStats.forEach((ts) => {
      stats[ts._id] = ts.count;
      stats.total += ts.count;
    });

    // Get recent tasks
    const recentTasks = await Task.find({
      project: { $in: projectIds },
    })
      .populate('project', 'name color')
      .populate('assignee', 'name email')
      .sort({ updatedAt: -1 })
      .limit(10);

    // Priority distribution
    const priorityStats = await Task.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          status: { $ne: 'done' },
        },
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorities = { low: 0, medium: 0, high: 0, urgent: 0 };
    priorityStats.forEach((ps) => {
      priorities[ps._id] = ps.count;
    });

    res.json({
      success: true,
      data: {
        stats,
        priorities,
        myTasks,
        overdueTasks,
        recentTasks,
        projectCount: projects.length,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard',
    });
  }
};
