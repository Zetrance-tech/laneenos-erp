// import Consent from "../models/consent.js";
// import ConsentResponse from "../models/consentResponse.js";
// import Student from "../models/student.js";
// import User from "../models/user.js";
// // import parentModel from "../models/parent.js";
// import Class from "../models/class.js"

// export const createConsentRequest = async (req, res) => {
//   try {
//     const { title, description, sessionId, classId, file, validity, applyToAllClasses } = req.body;

//     if (!title || !description || !sessionId || (!classId && !applyToAllClasses)) {
//       return res.status(400).json({ message: "Title, description, session, and either class or applyToAllClasses are required" });
//     }

//     let classIds = [];
//     if (applyToAllClasses) {
//       const classes = await Class.find({}).select("_id");
//       classIds = classes.map((cls) => cls._id);
//     } else {
//       classIds = [classId];
//     }

//     const savedConsents = [];
//     const allConsentResponses = [];

//     for (const clsId of classIds) {
//       const consent = new Consent({
//         title,
//         description,
//         sessionId,
//         classId: clsId,
//         file: file || null,
//         validity: validity || null,
//       });
//       const savedConsent = await consent.save();
//       savedConsents.push(savedConsent);

//       const students = await Student.find({ 
//         classId: clsId, 
//         sessionId,
//         status: "active"
//       }).lean();

//       if (!students.length) {
//         console.warn(`No active students found for class ${clsId}`);
//         continue;
//       }

//       const consentResponses = await Promise.all(
//         students.map(async (student) => {
//           try {
//             const fatherEmail = student.fatherInfo?.email;
//             const motherEmail = student.motherInfo?.email;

//             const father = fatherEmail 
//               ? await User.findOne({ email: fatherEmail, role: "parent", status: "active" })
//               : null;

//             const mother = motherEmail 
//               ? await User.findOne({ email: motherEmail, role: "parent", status: "active" })
//               : null;

//             if (!father && fatherEmail) {
//               const parentData = await Student.findOne({ fatherEmail });
//               if (parentData) {
//                 const newFather = await User.findOneAndUpdate(
//                   { email: parentData.fatherEmail },
//                   {
//                     role: "parent",
//                     name: parentData.fatherName || "Father",
//                     email: parentData.fatherEmail,
//                     phone: parentData.fatherMobile,
//                     status: "active",
//                     password: "password"
//                   },
//                   { upsert: true, new: true }
//                 );
//                 if (newFather) return newFather;
//               }
//             }

//             if (!mother && motherEmail) {
//               const parentData = await Student.findOne({ fatherEmail: motherEmail });
//               if (parentData) {
//                 const newMother = await User.findOneAndUpdate(
//                   { email: motherEmail },
//                   {
//                     role: "parent",
//                     name: parentData.motherName || "Mother",
//                     email: motherEmail,
//                     phone: parentData.motherNumber || parentData.fatherMobile,
//                     status: "active",
//                     password: "password"
//                   },
//                   { upsert: true, new: true }
//                 );
//                 if (newMother) return newMother;
//               }
//             }

//             const responses = [];
//             if (father) {
//               responses.push(new ConsentResponse({
//                 consentId: savedConsent._id,
//                 studentId: student._id,
//                 parentId: father._id,
//                 status: "pending"
//               }).save());
//             }

//             if (mother && motherEmail !== fatherEmail) {
//               responses.push(new ConsentResponse({
//                 consentId: savedConsent._id,
//                 studentId: student._id,
//                 parentId: mother._id,
//                 status: "pending"
//               }).save());
//             }

//             return responses.length ? Promise.all(responses) : null;
//           } catch (error) {
//             console.error(`Error processing student ${student._id}:`, error);
//             return null;
//           }
//         })
//       );

//       allConsentResponses.push(...consentResponses.flat().filter(Boolean));
//     }

//     res.status(201).json({ 
//       message: `Consent request${classIds.length > 1 ? "s" : ""} created successfully`,
//       consentIds: savedConsents.map((c) => c._id),
//       responseCount: allConsentResponses.length
//     });
//   } catch (error) {
//     console.error("Create consent error:", error);
//     res.status(500).json({ message: "Server error while creating consent" });
//   }
// };

// export const getParentConsents = async (req, res) => {
//   try {
//     if (req.user.role !== "parent") {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     const responses = await ConsentResponse.find({ parentId: req.user.userId })
//       .populate({
//         path: "consentId",
//         select: "title description sessionId classId file validity"
//       })
//       .populate({
//         path: "studentId",
//         select: "name classId admissionNumber",
//         match: { status: "active" }
//       })
//       .lean();

//     const validResponses = responses.filter(response => response.studentId !== null);

//     res.status(200).json(validResponses);
//   } catch (error) {
//     console.error("Get consents error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// export const respondToConsent = async (req, res) => {
//   try {
//     const { consentResponseId, status } = req.body;
//     console.log("Request body:", req.body);
//     console.log("Authenticated user:", req.user);

//     if (req.user.role !== "parent") {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     if (!consentResponseId || !["approved", "rejected"].includes(status)) {
//       return res.status(400).json({ message: "Invalid request parameters" });
//     }

//     const response = await ConsentResponse.findOne({
//       _id: consentResponseId,
//       parentId: req.user.userId
//     });

//     if (!response) {
//       console.log(`No response found for consentResponseId: ${consentResponseId}, parentId: ${req.user.userId}`);
//       const allResponses = await ConsentResponse.find({ _id: consentResponseId });
//       console.log("All responses with this ID:", allResponses);
//       return res.status(404).json({ message: "Consent response not found" });
//     }

//     if (response.status !== "pending") {
//       return res.status(400).json({ message: "Consent already responded" });
//     }

//     const existingResponse = await ConsentResponse.findOne({
//       consentId: response.consentId,
//       studentId: response.studentId,
//       status: { $ne: "pending" }
//     });

//     if (existingResponse) {
//       return res.status(400).json({ message: "Another parent has already responded for this student" });
//     }

//     const updateResult = await ConsentResponse.updateMany(
//       { 
//         consentId: response.consentId, 
//         studentId: response.studentId, 
//         status: "pending" 
//       },
//       { 
//         status: status,
//         responseDate: new Date(),
//         respondedBy: req.user.userId
//       }
//     );

//     res.status(200).json({ 
//       message: `Consent ${status} successfully`,
//       updatedCount: updateResult.modifiedCount
//     });
//   } catch (error) {
//     console.error("Respond consent error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getTeacherConsents = async (req, res) => {
//   try {
//     const { userId, role } = req.user;

//     if (role !== "teacher") {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     // Find classes assigned to the teacher
//     const classes = await Class.find({ teacherId: userId }).select("_id");
//     if (!classes.length) {
//       return res.status(404).json({ message: "No classes assigned to this teacher" });
//     }

//     const classIds = classes.map((cls) => cls._id);

//     // Fetch consents for the teacher's classes
//     const consents = await Consent.find({ classId: { $in: classIds } })
//       .populate("classId", "name")
//       .populate("sessionId", "name")
//       .sort({ createdAt: -1 });

//     if (!consents.length) {
//       return res.status(404).json({ message: "No consents found for your classes" });
//     }

//     res.status(200).json(consents);
//   } catch (error) {
//     console.error("Get teacher consents error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const getAdminConsents = async (req, res) => {
//   try {
//     const { role } = req.user;
//     const { classId } = req.query;

//     if (role !== "admin") {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     const query = classId ? { classId } : {};
//     const consents = await Consent.find(query)
//       .populate("classId", "name")
//       .populate("sessionId", "name")
//       .sort({ createdAt: -1 });

//     if (!consents.length) {
//       return res.status(404).json({ message: "No consents found" });
//     }

//     res.status(200).json(consents);
//   } catch (error) {
//     console.error("Get admin consents error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const getConsentResponses = async (req, res) => {
//   try {
//     const { consentId } = req.params;
//     const { role, userId } = req.user;

//     // Validate consentId
//     const consent = await Consent.findById(consentId);
//     if (!consent) {
//       return res.status(404).json({ message: "Consent not found" });
//     }

//     // Check permissions
//     if (role === "teacher") {
//       // Ensure the consent belongs to one of the teacher's classes
//       const classes = await Class.find({ teacherId: userId }).select("_id");
//       const classIds = classes.map((cls) => cls._id.toString());
//       if (!classIds.includes(consent.classId.toString())) {
//         return res.status(403).json({ message: "Unauthorized to view responses for this consent" });
//       }
//     } else if (role !== "admin") {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     // Fetch responses
//     const responses = await ConsentResponse.find({ consentId })
//       .populate("studentId", "name admissionNumber")
//       .populate("parentId", "name email")
//       .populate("respondedBy", "name")
//       .lean();

//     res.status(200).json(responses);
//   } catch (error) {
//     console.error("Get consent responses error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


import Consent from "../models/consent.js";
import ConsentResponse from "../models/consentResponse.js";
import Student from "../models/student.js";
import User from "../models/user.js";
import Class from "../models/class.js";
import Session from "../models/session.js"
export const createConsentRequest = async (req, res) => {
  try {
    const { title, description, sessionId, classId, file, validity, applyToAllClasses } = req.body;
    const { userId } = req.user;
    console.log(req.body)
    if (!title || !description || !sessionId || (!classId && !applyToAllClasses)) {
      return res.status(400).json({ message: "Title, description, session, and either class or applyToAllClasses are required" });
    }

    let classIds = [];
    if (applyToAllClasses) {
      const classes = await Class.find({}).select("_id");
      classIds = classes.map((cls) => cls._id);
    } else {
      classIds = [classId];
    }

    const savedConsents = [];
    const allConsentResponses = [];

    for (const clsId of classIds) {
      const consent = new Consent({
        title,
        description,
        sessionId,
        classId: clsId,
        file: file || null,
        validity: validity || null,
        createdBy: userId,
      });
      const savedConsent = await consent.save();
      savedConsents.push(savedConsent);

      const students = await Student.find({ 
        classId: clsId, 
        sessionId,
        status: "active"
      }).lean();

      if (!students.length) {
        console.warn(`No active students found for class ${clsId}`);
        continue;
      }

      const consentResponses = await Promise.all(
        students.map(async (student) => {
          try {
            const fatherEmail = student.fatherInfo?.email;
            const motherEmail = student.motherInfo?.email;

            const father = fatherEmail 
              ? await User.findOne({ email: fatherEmail, role: "parent", status: "active" })
              : null;

            const mother = motherEmail 
              ? await User.findOne({ email: motherEmail, role: "parent", status: "active" })
              : null;

            if (!father && fatherEmail) {
              const parentData = await Student.findOne({ fatherEmail });
              if (parentData) {
                const newFather = await User.findOneAndUpdate(
                  { email: parentData.fatherEmail },
                  {
                    role: "parent",
                    name: parentData.fatherName || "Father",
                    email: parentData.fatherEmail,
                    phone: parentData.fatherMobile,
                    status: "active",
                    password: "password"
                  },
                  { upsert: true, new: true }
                );
                if (newFather) return newFather;
              }
            }

            if (!mother && motherEmail) {
              const parentData = await Student.findOne({ fatherEmail: motherEmail });
              if (parentData) {
                const newMother = await User.findOneAndUpdate(
                  { email: motherEmail },
                  {
                    role: "parent",
                    name: parentData.motherName || "Mother",
                    email: motherEmail,
                    phone: parentData.motherNumber || parentData.fatherMobile,
                    status: "active",
                    password: "password"
                  },
                  { upsert: true, new: true }
                );
                if (newMother) return newMother;
              }
            }

            const responses = [];
            if (father) {
              responses.push(new ConsentResponse({
                consentId: savedConsent._id,
                studentId: student._id,
                parentId: father._id,
                status: "pending"
              }).save());
            }

            if (mother && motherEmail !== fatherEmail) {
              responses.push(new ConsentResponse({
                consentId: savedConsent._id,
                studentId: student._id,
                parentId: mother._id,
                status: "pending"
              }).save());
            }

            return responses.length ? Promise.all(responses) : null;
          } catch (error) {
            console.error(`Error processing student ${student._id}:`, error);
            return null;
          }
        })
      );

      allConsentResponses.push(...consentResponses.flat().filter(Boolean));
    }

    res.status(201).json({ 
      message: `Consent request${classIds.length > 1 ? "s" : ""} created successfully`,
      consentIds: savedConsents.map((c) => c._id),
      responseCount: allConsentResponses.length
    });
  } catch (error) {
    console.error("Create consent error:", error);
    res.status(500).json({ message: "Server error while creating consent" });
  }
};

export const editConsentRequest = async (req, res) => {
  try {
    const { consentId } = req.params;
    const { title, description, sessionId, classId, file, validity } = req.body;
    const { userId, role } = req.user;

    const consent = await Consent.findById(consentId);
    if (!consent) {
      return res.status(404).json({ message: "Consent not found" });
    }

    if (role !== "admin" && consent.createdBy && consent.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to edit this consent" });
    }

    if (!title || !description || !sessionId || !classId) {
      return res.status(400).json({ message: "Title, description, session, and class are required" });
    }

    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(400).json({ message: "Invalid class ID" });
    }

    const sessionExists = await Session.findById(sessionId);
    if (!sessionExists) {
      return res.status(404).json({ message: "Invalid session ID" });
    }

    consent.title = title;
    consent.description = description;
    consent.sessionId = sessionId;
    consent.classId = classId;
    consent.file = file || consent.file;
    consent.validity = validity || consent.validity;

    const updatedConsent = await consent.save();

    const populatedConsent = await Consent.findById(updatedConsent._id)
      .populate("classId", "name")
      .populate("sessionId", "name")
      .populate("createdBy", "name");

    res.status(200).json({
      message: "Consent updated successfully",
      consent: populatedConsent,
      });
    } catch (error) {
      console.error("Edit consent error:", error);
      res.status(500).json({ message: "Server error while editing consent" });
    };
  };

export const deleteConsentRequest = async (req, res) => {
  try {
    const { consentId } = req.params;
    const { userId, role } = req.user;

    const consent = await Consent.findById(consentId);
    if (!consent) {
      return res.status(404).json({ message: "Consent not found" });
    }

    if (role !== "admin" && consent.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to delete this consent" });
    }

    await ConsentResponse.deleteMany({ consentId });
    await Consent.findByIdAndDelete(consentId);

    res.status(200).json({ message: "Consent deleted successfully" });
  } catch (error) {
    console.error("Delete consent error:", error);
    res.status(500).json({ message: "Server error while deleting consent" });
  }
};

export const getParentConsents = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const responses = await ConsentResponse.find({ parentId: req.user.userId })
      .populate({
        path: "consentId",
        select: "title description sessionId classId file validity"
      })
      .populate({
        path: "studentId",
        select: "name classId admissionNumber",
        match: { status: "active" }
      })
      .lean();

    const validResponses = responses.filter(response => response.studentId !== null);

    res.status(200).json(validResponses);
  } catch (error) {
    console.error("Get consents error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const respondToConsent = async (req, res) => {
  try {
    const { consentResponseId, status } = req.body;
    console.log("Request body:", req.body);
    console.log("Authenticated user:", req.user);

    if (req.user.role !== "parent") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!consentResponseId || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    const response = await ConsentResponse.findOne({
      _id: consentResponseId,
      parentId: req.user.userId
    });

    if (!response) {
      console.log(`No response found for consentResponseId: ${consentResponseId}, parentId: ${req.user.userId}`);
      const allResponses = await ConsentResponse.find({ _id: consentResponseId });
      console.log("All responses with this ID:", allResponses);
      return res.status(404).json({ message: "Consent response not found" });
    }

    if (response.status !== "pending") {
      return res.status(400).json({ message: "Consent already responded" });
    }

    const existingResponse = await ConsentResponse.findOne({
      consentId: response.consentId,
      studentId: response.studentId,
      status: { $ne: "pending" }
    });

    if (existingResponse) {
      return res.status(400).json({ message: "Another parent has already responded for this student" });
    }

    const updateResult = await ConsentResponse.updateMany(
      { 
        consentId: consentId, 
        studentId: response.studentId, 
        status: "pending" 
      },
      { 
        status: status,
        responseDate: new Date(),
        respondedBy: req.user.userId
      }
    );

    res.status(200).json({ 
      message: `Consent ${status} successfully`,
      updatedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error("Respond consent error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getTeacherConsents = async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role !== "teacher") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const classes = await Class.find({ teacherId: userId }).select("_id");
    if (!classes.length) {
      return res.status(404).json({ message: "No classes assigned to this teacher" });
    }

    const classIds = classes.map((cls) => cls._id);

    const consents = await Consent.find({ classId: { $in: classIds } })
      .populate("classId", "name")
      .populate("sessionId", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    if (!consents.length) {
      return res.status(404).json({ message: "No consents found for your classes" });
    }

    res.status(200).json(consents);
  } catch (error) {
    console.error("Get teacher consents error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAdminConsents = async (req, res) => {
  try {
    const { role } = req.user;
    const { classId } = req.query;

    if (role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const query = classId ? { classId } : {};
    const consents = await Consent.find(query)
      .populate("classId", "name")
      .populate("sessionId", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    if (!consents.length) {
      return res.status(404).json({ message: "No consents found" });
    }

    res.status(200).json(consents);
  } catch (error) {
    console.error("Get admin consents error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getConsentResponses = async (req, res) => {
  try {
    const { consentId } = req.params;
    const { role, userId } = req.user;

    const consent = await Consent.findById(consentId);
    if (!consent) {
      return res.status(404).json({ message: "Consent not found" });
    }

    if (role === "teacher") {
      const classes = await Class.find({ teacherId: userId }).select("_id");
      const classIds = classes.map((cls) => cls._id.toString());
      if (!classIds.includes(consent.classId.toString())) {
        return res.status(403).json({ message: "Unauthorized to view responses for this consent" });
      }
    } else if (role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const responses = await ConsentResponse.find({ consentId })
      .populate("studentId", "name admissionNumber")
      .populate("parentId", "name email")
      .populate("respondedBy", "name")
      .lean();

    res.status(200).json(responses);
  } catch (error) {
    console.error("Get consent responses error:", error);
    res.status(500).json({ message: "Server error" });
  }
};