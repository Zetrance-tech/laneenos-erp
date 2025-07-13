import mongoose from 'mongoose';
import Notice from '../models/notice.js';
import Session from '../models/session.js';
import Class from '../models/class.js';
import Student from '../models/student.js';
import Teacher from '../models/teacher.js';
import User from '../models/user.js';

// Add a new notice
export const addNotice = async (req, res) => {
  try {
    const { branchId } = req.user;
    const { title, noticeDate, publishOn, message, messageTo, sessionId, classIds } = req.body;

    if (!title || !noticeDate || !publishOn || !message || !messageTo || !sessionId) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const validRecipients = ['Parent', 'Teacher'];
    let recipients = Array.isArray(messageTo) ? messageTo : JSON.parse(messageTo);
    if (!recipients.every((r) => validRecipients.includes(r))) {
      return res.status(400).json({ message: 'messageTo must only include Parent and/or Teacher' });
    }

    const session = await Session.findOne({ _id: sessionId, branchId });
    if (!session) return res.status(400).json({ message: 'Invalid session ID' });

    if (classIds && classIds.length) {
      const invalidIds = classIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length) return res.status(400).json({ message: 'Invalid class IDs' });

      const existing = await Class.find({ _id: { $in: classIds }, sessionId, branchId });
      if (existing.length !== classIds.length) return res.status(400).json({ message: 'Invalid or missing classes' });
    }

    const newNotice = new Notice({
      title,
      noticeDate: new Date(noticeDate),
      publishOn: new Date(publishOn),
      attachment: null,
      message,
      messageTo: recipients,
      sessionId,
      classIds: classIds?.length ? classIds : [],
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

    const deleted = await Notice.findOneAndDelete({ _id: id, branchId });
    if (!deleted) return res.status(404).json({ message: 'Notice not found' });

    res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Error deleting notice:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all notices (Admin)
export const getNotices = async (req, res) => {
  try {
    const { branchId } = req.user;

    const notices = await Notice.find({ branchId })
      .populate('sessionId', 'name')
      .populate('classIds', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get notices by role
export const getNoticesByRole = async (req, res) => {
  try {
    const { branchId, userId } = req.user;
    let role = req.params.role;

    const validRoles = ['Parent', 'Teacher'];
    role = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    let notices = [];

    if (role === 'Parent') {
      const parent = await User.findById(userId).select('email');
      if (!parent) return res.status(404).json({ message: 'Parent not found' });

      const students = await Student.find({
        $or: [
          { 'fatherInfo.email': parent.email },
          { 'motherInfo.email': parent.email }
        ],
        branchId,
      }).select('sessionId classId');

      if (!students.length) return res.status(200).json([]);

      const sessionIds = students.map(s => s.sessionId);
      const classIds = students.map(s => s.classId).filter(Boolean);

      notices = await Notice.find({
        messageTo: role,
        branchId,
        sessionId: { $in: sessionIds },
        $or: [
          { classIds: { $in: classIds } },
          { classIds: { $size: 0 } },
        ]
      })
        .populate('sessionId', 'name')
        .populate('classIds', 'name')
        .sort({ createdAt: -1 });

    } else if (role === 'Teacher') {
      const teacher = await Teacher.findOne({ userId, branchId }).select('_id');
      if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

      const classes = await Class.find({ teacherId: userId, branchId }).select('_id sessionId');
      if (!classes.length) return res.status(200).json([]);

      const sessionIds = classes.map(c => c.sessionId);
      const classIds = classes.map(c => c._id);

      notices = await Notice.find({
        messageTo: role,
        branchId,
        sessionId: { $in: sessionIds },
        $or: [
          { classIds: { $in: classIds } },
          { classIds: { $size: 0 } },
        ]
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

// Update notice
export const updateNotice = async (req, res) => {
  try {
    const { branchId } = req.user;
    const { id } = req.params;
    const { title, noticeDate, publishOn, message, messageTo, sessionId, classIds } = req.body;

    if (!title || !noticeDate || !publishOn || !message || !messageTo || !sessionId) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const validRecipients = ['Parent', 'Teacher'];
    let recipients;
    try {
      recipients = Array.isArray(messageTo) ? messageTo : JSON.parse(messageTo);
    } catch {
      return res.status(400).json({ message: 'Invalid messageTo format' });
    }

    if (!recipients.every(r => validRecipients.includes(r))) {
      return res.status(400).json({ message: 'messageTo must only include Parent and/or Teacher' });
    }

    const session = await Session.findOne({ _id: sessionId, branchId });
    if (!session) return res.status(400).json({ message: 'Invalid session ID' });

    if (classIds && classIds.length) {
      const invalidIds = classIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length) return res.status(400).json({ message: 'Invalid class IDs' });

      const existing = await Class.find({ _id: { $in: classIds }, sessionId, branchId });
      if (existing.length !== classIds.length) {
        return res.status(400).json({ message: 'Invalid or missing classes' });
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
        classIds: classIds?.length ? classIds : [],
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
