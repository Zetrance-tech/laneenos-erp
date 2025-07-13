import Notice from '../models/notice.js';
import Session from '../models/session.js';
import Class from '../models/class.js';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import mongoose from 'mongoose';

// Helper function to get student IDs for a parent
const getStudentIdsForParent = async (parentEmail, branchId) => {
  const students = await Student.find({
    branchId,
    $or: [
      { 'fatherInfo.email': parentEmail },
      { 'motherInfo.email': parentEmail },
    ],
    status: 'active',
  }).select('_id');
  return students.map((student) => student._id);
};

// Add a new notice
export const addNotice = async (req, res) => {
  try {
    const { branchId } = req.user;
    const { title, noticeDate, publishOn, message, messageTo, sessionId, classIds } = req.body;

    // Validate required fields
    if (!title || !noticeDate || !publishOn || !message || !messageTo || !sessionId) {
      return res.status(400).json({ message: 'Title, noticeDate, publishOn, message, messageTo, and sessionId are required' });
    }

    // Validate messageTo
    const validRecipients = ['Parent', 'Teacher'];
    let recipients = Array.isArray(messageTo) ? messageTo : JSON.parse(messageTo);
    if (!recipients.every((role) => validRecipients.includes(role))) {
      return res.status(400).json({ message: 'messageTo must only include Parent and/or Teacher' });
    }

    // Validate sessionId
    const session = await Session.findOne({ _id: sessionId, branchId });
    if (!session) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    // Validate classIds if provided
    if (classIds && classIds.length > 0) {
      const invalidIds = classIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length) {
        return res.status(400).json({ message: 'Invalid class ID format' });
      }
      const classes = await Class.find({ _id: { $in: classIds }, sessionId, branchId });
      if (classes.length !== classIds.length) {
        return res.status(400).json({ message: 'One or more classes not found or do not belong to the specified session' });
      }
    }

    // Create new notice
    const newNotice = new Notice({
      title,
      noticeDate: new Date(noticeDate),
      publishOn: new Date(publishOn),
      attachment: null, // No file upload, so set to null
      message,
      messageTo: recipients,
      sessionId,
      classIds: classIds || [], // Use empty array if classIds is not provided
      branchId,
    });

    await newNotice.save();
    res.status(201).json({ message: 'Notice added successfully', notice: newNotice });
  } catch (error) {
    console.error('Error adding notice:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a notice
export const deleteNotice = async (req, res) => {
  try {
    const { branchId } = req.user;
    const { id } = req.params;
    const deletedNotice = await Notice.findOneAndDelete({ _id: id, branchId });

    if (!deletedNotice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Error deleting notice:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all notices (for admin)
export const getNotices = async (req, res) => {
  try {
    const { branchId } = req.user;
    const notices = await Notice.find({ branchId })
      .populate('sessionId', 'name')
      .populate('classIds', 'name')
      .sort({ createdAt: -1 }); // Sort by creation date, newest first
    res.status(200).json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get notices for a specific role
export const getNoticesByRole = async (req, res) => {
  try {
    const { branchId, role, userId } = req.user;
    const validRoles = ['parent', 'teacher'];

    // Normalize role to match validRoles (case-insensitive)
    const normalizedRole = role.toLowerCase();
    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    let notices;

    if (normalizedRole === 'parent') {
      // Find parent by userId to get their email
      const parent = await mongoose.model('User').findById(userId).select('email');
      if (!parent) {
        return res.status(404).json({ message: 'Parent not found' });
      }

      // Get student IDs for the parent
      const studentIds = await getStudentIdsForParent(parent.email, branchId);
      if (!studentIds.length) {
        return res.status(200).json([]); // No students, so no notices
      }

      // Find students to get their sessionIds and classIds
      const students = await Student.find({
        _id: { $in: studentIds },
        branchId,
      }).select('sessionId classId');

      if (!students.length) {
        return res.status(200).json([]); // No students, so no notices
      }

      const sessionIds = [...new Set(students.map((s) => s.sessionId.toString()))];
      const classIds = [...new Set(students.map((s) => s.classId?.toString()).filter((id) => id))];

      notices = await Notice.find({
        messageTo: 'Parent', // Match schema's capitalized 'Parent'
        branchId,
        sessionId: { $in: sessionIds },
        $or: [
          { classIds: { $in: classIds } },
          { classIds: { $size: 0 } }, // Notices for all classes in the session
        ],
      })
        .populate('sessionId', 'name')
        .populate('classIds', 'name')
        .sort({ createdAt: -1 });
    } else if (normalizedRole === 'teacher') {
      // Find classes assigned to the teacher
      const classes = await Class.find({ teacherId: userId, branchId }).select('_id sessionId');
      if (!classes.length) {
        return res.status(200).json([]); // No classes, so no notices
      }

      const sessionIds = [...new Set(classes.map((c) => c.sessionId.toString()))];
      const classIds = classes.map((c) => c._id.toString());

      notices = await Notice.find({
        messageTo: 'Teacher', // Match schema's capitalized 'Teacher'
        branchId,
        sessionId: { $in: sessionIds },
        $or: [
          { classIds: { $in: classIds } },
          { classIds: { $size: 0 } }, // Notices for all classes in the session
        ],
      })
        .populate('sessionId', 'name')
        .populate('classIds', 'name')
        .sort({ createdAt: -1 });
    }

    res.status(200).json(notices);
  } catch (error) {
    console.error('Error fetching notices by role:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a notice
export const updateNotice = async (req, res) => {
  try {
    const { branchId } = req.user;
    const { id } = req.params;
    const { title, noticeDate, publishOn, message, messageTo, sessionId, classIds } = req.body;

    // Validate required fields
    if (!title || !noticeDate || !publishOn || !message || !messageTo || !sessionId) {
      return res.status(400).json({ message: 'Title, noticeDate, publishOn, message, messageTo, and sessionId are required' });
    }

    // Validate messageTo
    const validRecipients = ['Parent', 'Teacher'];
    let recipients;
    try {
      recipients = Array.isArray(messageTo) ? messageTo : JSON.parse(messageTo);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid messageTo format' });
    }
    if (!recipients.every((role) => validRecipients.includes(role))) {
      return res.status(400).json({ message: 'messageTo must only include Parent and/or Teacher' });
    }

    // Validate sessionId
    const session = await Session.findOne({ _id: sessionId, branchId });
    if (!session) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    // Validate classIds if provided
    if (classIds && classIds.length > 0) {
      const invalidIds = classIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length) {
        return res.status(400).json({ message: 'Invalid class ID format' });
      }
      const classes = await Class.find({ _id: { $in: classIds }, sessionId, branchId });
      if (classes.length !== classIds.length) {
        return res.status(400).json({ message: 'One or more classes not found or do not belong to the specified session' });
      }
    }

    const updatedNotice = await Notice.findOneAndUpdate(
      { _id: id, branchId },
      {
        title,
        noticeDate: new Date(noticeDate),
        publishOn: new Date(publishOn),
        message,
        messageTo: recipients,
        sessionId,
        classIds: classIds || [], // Use empty array if classIds is not provided
      },
      { new: true, runValidators: true }
    )
      .populate('sessionId', 'name')
      .populate('classIds', 'name');

    if (!updatedNotice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    res.status(200).json({ message: 'Notice updated successfully', notice: updatedNotice });
  } catch (error) {
    console.error('Error updating notice:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};