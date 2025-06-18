
import Notice from '../models/notice.js';
// Add a new notice
export const addNotice = async (req, res) => {
  try {
    const { title, noticeDate, publishOn, message, messageTo } = req.body;

    if (!title || !noticeDate || !publishOn || !message || !messageTo) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    let recipients;
    try {
      recipients = Array.isArray(messageTo) ? messageTo : JSON.parse(messageTo);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid messageTo format' });
    }
    const newNotice = new Notice({
      title,
      noticeDate: new Date(noticeDate),
      publishOn: new Date(publishOn),
      attachment: null, 
      message,
      messageTo: recipients,
    });

    await newNotice.save();
    res.status(201).json({ message: 'Notice added successfully', notice: newNotice });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a notice
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNotice = await Notice.findByIdAndDelete(id);

    if (!deletedNotice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all notices
export const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const getNoticesByRole = async (req, res) => {
  try {
    let { role } = req.params;
    const validRoles = [
      "Student",
      "Parent",
      "Admin",
      "Teacher",
      "Accountant",
      "Librarian",
      "Receptionist",
      "Super Admin",
    ];

    role = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const notices = await Notice.find({ messageTo: role }).sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateNotice = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, noticeDate, publishOn, message, messageTo } = req.body;
      if (!title || !noticeDate || !publishOn || !message || !messageTo) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      let recipients;
      try {
        recipients = Array.isArray(messageTo) ? messageTo : JSON.parse(messageTo);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid messageTo format' });
      }
  
      const updatedNotice = await Notice.findByIdAndUpdate(
        id,
        {
          title,
          noticeDate: new Date(noticeDate),
          publishOn: new Date(publishOn),
          message,
          messageTo: recipients,
        },
        { new: true, runValidators: true }
      );
  
      if (!updatedNotice) {
        return res.status(404).json({ message: 'Notice not found' });
      }
  
      res.status(200).json({ message: 'Notice updated successfully', notice: updatedNotice });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };