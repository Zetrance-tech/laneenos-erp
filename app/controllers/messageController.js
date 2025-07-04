import Message from "../models/message.js";
import Student from "../models/student.js";
import Class from "../models/class.js";
import User from "../models/user.js";

// export const sendMessage = async (req, res) => {
//   const { recipients, subject, body, attachment } = req.body;
//   const senderId = req.user.userId;
//   const senderRole = req.user.role;

//   try {
//     if (!recipients || !subject || !body) {
//       return res.status(400).json({ error: "Recipients, subject, and body are required" });
//     }

//     let validRecipients = { users: [], students: [], classes: [] };

//     if (senderRole === "admin") {
//       const allTeachers = await User.find({ role: "teacher" }).select("_id"); // Changed: Use User instead of Teacher
//       const allParents = await User.find({ role: "parent" }).select("_id");
//       const allStudents = await Student.find().select("_id");
//       const allClasses = await Class.find().select("_id");

//       validRecipients.users = (recipients.users || []).filter(id =>
//         [...allTeachers.map(t => t._id.toString()), ...allParents.map(p => p._id.toString())].includes(id.toString())
//       );
//       validRecipients.students = (recipients.students || []).filter(id =>
//         allStudents.some(s => s._id.toString() === id.toString())
//       );
//       validRecipients.classes = (recipients.classes || []).filter(id =>
//         allClasses.some(c => c._id.toString() === id.toString())
//       );

//       if (validRecipients.users.length === 0 && validRecipients.students.length === 0 && validRecipients.classes.length === 0) {
//         return res.status(400).json({ error: "No valid recipients provided" });
//       }
//     } else if (senderRole === "teacher") {
//       const teacherClasses = await Class.find({ teacherId: senderId }); // Changed: Use User._id directly
//       const allowedClassIds = teacherClasses.map(c => c._id);
//       const allowedStudents = await Student.find({ classId: { $in: allowedClassIds } }).select("_id");
//       const allowedAdmins = await User.find({ role: "admin" }).select("_id");

//       validRecipients.students = (recipients.students || []).filter(id =>
//         allowedStudents.some(s => s._id.toString() === id.toString())
//       );
//       validRecipients.users = (recipients.users || []).filter(id =>
//         allowedAdmins.some(a => a._id.toString() === id.toString())
//       );

//       if (validRecipients.users.length === 0 && validRecipients.students.length === 0) {
//         return res.status(403).json({ error: "You can only message your class students or an admin" });
//       }
//     } else if (senderRole === "parent") {
//       const student = await Student.findOne({
//         $or: [
//           { "fatherInfo.email": req.user.email },
//           { "motherInfo.email": req.user.email },
//         ],
//       });
//       if (!student) return res.status(404).json({ error: "Student not found" });

//       const classData = await Class.findById(student.classId).populate("teacherId");
//       if (!classData) return res.status(404).json({ error: "Class not found" });

//       const allowedTeachers = classData.teacherId.map(t => t._id.toString()); // Changed: teacherId is User._id
//       const allowedAdmins = (await User.find({ role: "admin" }).select("_id")).map(a => a._id.toString());

//       validRecipients.users = (recipients.users || []).filter(id =>
//         [...allowedTeachers, ...allowedAdmins].includes(id.toString())
//       );

//       if (validRecipients.users.length === 0) {
//         return res.status(403).json({ error: "You can only message your child’s teacher(s) or an admin" });
//       }
//     } else {
//       return res.status(403).json({ error: "Unauthorized role" });
//     }

//     const newMessage = new Message({
//       sender: senderId,
//       recipients: validRecipients,
//       subject,
//       body,
//       attachment,
//     });
//     await newMessage.save();

//     res.status(201).json({ message: "Message sent successfully", data: newMessage });
//   } catch (error) {
//     console.error("Error in sendMessage:", error);
//     res.status(500).json({ error: "Failed to send message" });
//   }
// };


export const sendMessage = async (req, res) => {
  const { recipients, subject, body, attachment } = req.body;
  const senderId = req.user.userId;
  const senderRole = req.user.role;

  try {
    if (!recipients || !subject || !body) {
      return res.status(400).json({ error: "Recipients, subject, and body are required" });
    }

    let validRecipients = { users: [], classes: [] }; // Removed students for teachers

    if (senderRole === "admin") {
      const allTeachers = await User.find({ role: "teacher" }).select("_id");
      const allParents = await User.find({ role: "parent" }).select("_id");
      const allClasses = await Class.find().select("_id");

      validRecipients.users = (recipients.users || []).filter(id =>
        [...allTeachers.map(t => t._id.toString()), ...allParents.map(p => p._id.toString())].includes(id.toString())
      );
      validRecipients.classes = (recipients.classes || []).filter(id =>
        allClasses.some(c => c._id.toString() === id.toString())
      );

      // Expand classes to include all parents
      if (validRecipients.classes.length > 0) {
        const classStudents = await Student.find({ classId: { $in: validRecipients.classes } });
        const parentIds = await User.find({
          $or: [
            { email: { $in: classStudents.map(s => s.fatherInfo.email) } },
            { email: { $in: classStudents.map(s => s.motherInfo.email) } },
          ],
        }).select("_id");
        validRecipients.users.push(...parentIds.map(p => p._id));
      }

      if (validRecipients.users.length === 0 && validRecipients.classes.length === 0) {
        return res.status(400).json({ error: "No valid recipients provided" });
      }
    } else if (senderRole === "teacher") {
      const teacherClasses = await Class.find({ teacherId: senderId });
      const allowedClassIds = teacherClasses.map(c => c._id);
      const classStudents = await Student.find({ classId: { $in: allowedClassIds } });
      const allowedParents = await User.find({
        $or: [
          { email: { $in: classStudents.map(s => s.fatherInfo.email) } },
          { email: { $in: classStudents.map(s => s.motherInfo.email) } },
        ],
      }).select("_id");
      const allowedAdmins = await User.find({ role: "admin" }).select("_id");

      validRecipients.users = (recipients.users || []).filter(id =>
        [...allowedParents.map(p => p._id.toString()), ...allowedAdmins.map(a => a._id.toString())].includes(id.toString())
      );
      validRecipients.classes = (recipients.classes || []).filter(id =>
        allowedClassIds.some(c => c.toString() === id.toString())
      );

      // Expand classes to include all parents
      if (validRecipients.classes.length > 0) {
        const classStudents = await Student.find({ classId
: { $in: validRecipients.classes } });
        const parentIds = await User.find({
          $or: [
            { email: { $in: classStudents.map(s => s.fatherInfo.email) } },
            { email: { $in: classStudents.map(s => s.motherInfo.email) } },
          ],
        }).select("_id");
        validRecipients.users.push(...parentIds.map(p => p._id));
      }

      if (validRecipients.users.length === 0 && validRecipients.classes.length === 0) {
        return res.status(403).json({ error: "You can only message your class parents or an admin" });
      }
    } else if (senderRole === "parent") {
      const student = await Student.findOne({
        $or: [
          { "fatherInfo.email": req.user.email },
          { "motherInfo.email": req.user.email },
        ],
      });
      if (!student) return res.status(404).json({ error: "Student not found" });

      const classData = await Class.findById(student.classId).populate("teacherId");
      if (!classData) return res.status(404).json({ error: "Class not found" });

      const allowedTeachers = classData.teacherId.map(t => t._id.toString());
      const allowedAdmins = (await User.find({ role: "admin" }).select("_id")).map(a => a._id.toString());

      validRecipients.users = (recipients.users || []).filter(id =>
        [...allowedTeachers, ...allowedAdmins].includes(id.toString())
      );

      if (validRecipients.users.length === 0) {
        return res.status(403).json({ error: "You can only message your child’s teacher(s) or an admin" });
      }
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    const newMessage = new Message({
      sender: senderId,
      recipients: validRecipients,
      subject,
      body,
      attachment,
    });
    await newMessage.save();

    res.status(201).json({ message: "Message sent successfully", data: newMessage });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

export const getInbox = async (req, res) => {
  const userId = req.user.userId;
  const userRole = req.user.role;

  try {
    let query = { sender: { $ne: userId } };

    if (userRole === "admin") {
      query["recipients.users"] = userId; 
    } else if (userRole === "teacher") {
      const teacherClasses = await Class.find({ teacherId: userId }); // Changed: Use User._id directly
      const teacherClassIds = teacherClasses.map(c => c._id);
      query.$or = [
        { "recipients.users": userId }, 
        { "recipients.classes": { $in: teacherClassIds } },
      ];
    } else if (userRole === "parent") {
      query["recipients.users"] = userId; 
    }

    const messages = await Message.find(query)
      .populate("sender", "name role")
      .populate("recipients.users", "name role")
      .populate("recipients.students", "name")
      .populate("recipients.classes", "name")
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch inbox" });
  }
};

export const getSentMessages = async (req, res) => {
  const userId = req.user.userId;

  try {
    const messages = await Message.find({ sender: userId })
      .populate("recipients.users", "name role")
      .populate("recipients.students", "name")
      .populate("recipients.classes", "name")
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch sent messages" });
  }
};

export const markMessageRead = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (!message.readBy.some(rb => rb.user.toString() === userId.toString())) {
      message.readBy.push({ user: userId });
      await message.save();
    }
    res.json({ message: "Message marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mark message as read" });
  }
};

export const getMessageRecipients = async (req, res) => {
  const userId = req.user.userId;
  const userRole = req.user.role;

  try {
    let recipients = { users: [], classes: [] }; // Removed students

    if (userRole === "admin") {
      recipients.users = await User.find({ role: { $in: ["teacher", "parent"] } }).select("name _id");
      recipients.classes = await Class.find().select("name _id");
    } else if (userRole === "parent") {
      const student = await Student.findOne({
        $or: [
          { "fatherInfo.email": req.user.email },
          { "motherInfo.email": req.user.email },
        ],
      });
      if (!student) return res.status(404).json({ error: "Student not found" });

      const classData = await Class.findById(student.classId).populate("teacherId");
      recipients.users = [
        ...(await User.find({ role: "admin" }).select("name _id")),
        ...(classData.teacherId.map(t => ({ name: t.name, _id: t._id }))),
      ];
    } else if (userRole === "teacher") {
      const teacherClasses = await Class.find({ teacherId: userId });
      recipients.classes = teacherClasses.map(c => ({ name: c.name, _id: c._id }));
      const classStudents = await Student.find({ classId: { $in: teacherClasses.map(c => c._id) } });
      const allowedParents = await User.find({
        $or: [
          { email: { $in: classStudents.map(s => s.fatherInfo.email) } },
          { email: { $in: classStudents.map(s => s.motherInfo.email) } },
        ],
      }).select("name _id");
      recipients.users = [
        ...(await User.find({ role: "admin" }).select("name _id")),
        ...allowedParents,
      ];
    }

    res.json(recipients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch recipients" });
  }
};