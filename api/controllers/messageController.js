import Message from "../models/message.js";
import Student from "../models/student.js";
import Class from "../models/class.js";
import User from "../models/user.js";
import Teacher from "../models/teacher.js"
import mongoose from "mongoose";
// Send a message
export const sendMessage = async (req, res) => {
  const { sender, recipients, subject, message, attachment } = req.body;
  const { branchId } = req.user;

  if (!sender) {
    return res.status(400).json({ error: "Sender ID is required" });
  }

  try {
    const newMessage = new Message({
      sender,
      recipients: {
        users: recipients.users || [],
        students: recipients.students || [],
        classes: recipients.classes || [],
      },
      subject,
      message,
      attachment,
      branchId,
    });
    await newMessage.save();
    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Get inbox messages for a user
export const getInbox = async (req, res) => {
  const { userId } = req.query;
  const { branchId } = req.user;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const user = await User.findOne({ _id: userId, branchId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRole = user.role;
    let query = { branchId };

    if (userRole === "teacher") {
      const teacher = await Teacher.findOne({ userId, branchId });
      const teacherClasses = await Class.find({ teacherId: teacher._id, branchId });
      query = {
        $or: [
          { "recipients.users": userId }, // Direct messages to teacher
          { "recipients.classes": { $in: teacherClasses.map((c) => c._id) } }, // Messages to their classes
          { "recipients.students": { $exists: true } }, // Messages to students they teach (simplified)
        ],
        sender: { $ne: userId }, // Exclude messages sent by the teacher
        branchId,
      };
    } else if (userRole === "admin") {
      query = {
        "recipients.users": userId,
        sender: { $ne: userId },
        branchId,
      };
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    const messages = await Message.find(query)
      .populate("sender", "name role")
      .populate("recipients.users", "name role")
      .populate("recipients.students", "name")
      .populate("recipients.classes", "name");
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch inbox" });
  }
};

// Get sent messages for a user
export const getSentMessages = async (req, res) => {
  const { userId } = req.query; // Pass userId as query param since no auth
  const { branchId } = req.user;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const messages = await Message.find({ sender: userId, branchId })
      .populate("recipients.users", "name role")
      .populate("recipients.students", "name")
      .populate("recipients.classes", "name");
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch sent messages" });
  }
};

// Get all classes (for admin/teacher recipient selection)
export const getAllClasses = async (req, res) => {
  try {
    const { branchId } = req.user;
    const classes = await Class.find({ branchId }).populate("teacherId", "name");
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch classes" });
  }
};

// Get classes for a specific teacher
export const getTeacherClasses = async (req, res) => {
  const { teacherId } = req.params;
  const { branchId } = req.user;
  try {
    const teacher = await Teacher.findOne({ userId: teacherId, branchId });
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    const classes = await Class.find({ teacherId: teacher._id, branchId });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch teacher classes" });
  }
};

// Get all students (for admin/teacher recipient selection)
export const getAllStudents = async (req, res) => {
  const { classIds } = req.body; // Expect classIds array in request body
  const { branchId } = req.user;
  try {
    let students;
    if (classIds && classIds.length > 0) {
      students = await Student.find({ classId: { $in: classIds }, branchId });
    } else {
      students = await Student.find({ branchId }); // Fallback to all students if no classIds
    }
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

// Get admins (for teacher/parent recipient selection)
export const getAdmins = async (req, res) => {
  try {
    const { branchId } = req.user;
    const admins = await User.find({ role: "admin", branchId });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
};

// Get student by parent (for parent to find their child’s class)
export const getStudentByParent = async (req, res) => {
  const { parentId } = req.params;
  const { branchId } = req.user;
  try {
    const user = await User.findOne({ _id: parentId, branchId });
    if (!user) return res.status(404).json({ error: "Parent not found" });
    const student = await Student.findOne({
      $or: [
        { "fatherInfo.email": user.email },
        { "motherInfo.email": user.email },
      ],
      branchId,
    });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch student" });
  }
};

// Get teachers for a specific class (for parent recipient selection)
export const getClassTeachers = async (req, res) => {
  const { classId } = req.params;
  const { branchId } = req.user;
  try {
    const classData = await Class.findOne({ _id: classId, branchId }).populate("teacherId", "name userId");
    if (!classData) return res.status(404).json({ error: "Class not found" });
    const teachers = await User.find({
      _id: { $in: classData.teacherId.map((t) => t.userId) },
      branchId,
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch class teachers" });
  }
};

export const deleteMessages = async (req, res) => {
  const { messageIds } = req.body;
  const { branchId } = req.user;
  try {
    await Message.deleteMany({ _id: { $in: messageIds }, branchId });
    res.json({ message: 'Messages deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete messages' });
  }
};

export const getStudentByEmail = async (req, res) => {
  const { email } = req.query;
  const { branchId } = req.user;
  try {
    const student = await Student.findOne({ admissionNumber: email, branchId }); // Adjust field name if needed
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};


export const getTeachersByClasses = async (req, res) => {
  try {
    const { classIds } = req.body;
    const { branchId } = req.user;

    if (!classIds || classIds.length === 0) {
      return res.status(400).json({ error: 'classIds are required' });
    }

    const objectClassIds = classIds.map(id => new mongoose.Types.ObjectId(id));
    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    const classes = await Class.find({
      _id: { $in: objectClassIds },
      branchId: branchObjectId
    }).populate('teacherId', 'name userId');

    console.log(JSON.stringify(classes, null, 2)); 

    const allTeachers = classes.flatMap(cls => cls.teacherId);
    res.json(allTeachers);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
};
export const getParentsByClasses = async (req, res) => {
  const { classIds } = req.body;
  const { branchId } = req.user;
  try {
    const students = await Student.find({ classId: { $in: classIds }, branchId });
    const parentEmails = [...new Set(students.flatMap(s => [s.fatherInfo.email, s.motherInfo.email].filter(Boolean)))];
    const parents = await User.find({ email: { $in: parentEmails }, role: 'parent', branchId });
    res.json(parents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch parents' });
  }
};