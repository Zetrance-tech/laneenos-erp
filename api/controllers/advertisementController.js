// import mongoose from 'mongoose';
// import Advertisement from '../models/advertisement.js';
// import Session from '../models/session.js';
// import Class from '../models/class.js';
// import fs from 'fs';
// import path from 'path';
// import { uploadsRoot } from '../uploadsRoot.js';
// const fsPromises = fs.promises;

// export const createAdvertisement = async (req, res) => {
//   try {
//     const branchId = req.user.branchId;
//     const userId = req.user.userId;
//     const { sessionId, classId, name, description, status } = req.body;

//     if (!branchId || !userId) {
//       return res.status(400).json({ message: 'Branch ID or User ID is missing' });
//     }

//     if (!sessionId || !classId || !name || !description || !status) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     if (!['active', 'inactive'].includes(status)) {
//       return res.status(400).json({ message: 'Status must be either active or inactive' });
//     }

//     const sessionExists = await Session.findOne({ _id: sessionId, branchId });
//     if (!sessionExists) {
//       return res.status(404).json({ message: 'Session not found in this branch' });
//     }

//     const classQuery = { _id: classId, branchId };
//     if (req.user.role === 'teacher') {
//       classQuery.teacherId = { $in: [userId] };
//     }
//     const classExists = await Class.findOne(classQuery);
//     if (!classExists) {
//       return res.status(404).json({ message: 'Class not found or you don\'t have access' });
//     }

//     if (!req.file) {
//       return res.status(400).json({ message: 'An image is required' });
//     }

//     const image = {
//       filename: req.file.filename,
//       path: path.join('advertisements', req.file.filename).replace(/\\/g, '/'),
//       mimetype: req.file.mimetype,
//       size: req.file.size,
//     };

//     const newAdvertisement = new Advertisement({
//       branchId,
//       sessionId,
//       classId,
//       name,
//       description,
//       status,
//       image,
//       createdBy: userId,
//     });

//     const savedAdvertisement = await newAdvertisement.save();
//     res.status(201).json(savedAdvertisement);
//   } catch (error) {
//     console.error('Error creating advertisement:', error.message);
//     if (req.file) {
//       const filePath = path.join(uploadsRoot, 'advertisements', req.file.filename);
//       if (fs.existsSync(filePath)) {
//         fs.unlink(filePath, (err) => {
//           if (err) console.error('Error deleting uploaded file:', err);
//         });
//       }
//     }
//     res.status(400).json({ message: error.message });
//   }
// };

// export const updateAdvertisement = async (req, res) => {
//   try {
//     const { sessionId, classId, name, description, status } = req.body;
//     const advertisementId = req.params.id;

//     if (!sessionId || !classId || !name || !description || !status || !advertisementId) {
//       return res.status(400).json({ message: 'All required fields must be provided' });
//     }

//     if (!['active', 'inactive'].includes(status)) {
//       return res.status(400).json({ message: 'Status must be either active or inactive' });
//     }

//     const existingAdvertisement = await Advertisement.findById(advertisementId);
//     if (!existingAdvertisement) {
//       return res.status(404).json({ message: 'Advertisement not found' });
//     }

//     let image = existingAdvertisement.image;

//     if (req.file) {
//       // Delete old image if it exists
//       if (image && image.filename) {
//         const oldFilePath = path.join(uploadsRoot, 'advertisements', image.filename);
//         try {
//           await fsPromises.access(oldFilePath);
//           await fsPromises.unlink(oldFilePath);
//         } catch (error) {
//           if (error.code !== 'ENOENT') {
//             console.error('Error deleting old advertisement image:', error);
//           }
//         }
//       }

//       // Add new image
//       image = {
//         filename: req.file.filename,
//         path: path.join('advertisements', req.file.filename).replace(/\\/g, '/'),
//         mimetype: req.file.mimetype,
//         size: req.file.size,
//       };
//     }

//     const updateData = {
//       sessionId,
//       classId,
//       name,
//       description,
//       status,
//       image,
//       updatedAt: new Date(),
//     };

//     const updatedAdvertisement = await Advertisement.findByIdAndUpdate(
//       advertisementId,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     );

//     if (!updatedAdvertisement) {
//       return res.status(404).json({ message: 'Advertisement not found after update' });
//     }

//     res.status(200).json(updatedAdvertisement);
//   } catch (error) {
//     console.error('Error updating advertisement:', error);
//     res.status(500).json({ message: 'Server error while updating advertisement' });
//   }
// };

// export const deleteAdvertisement = async (req, res) => {
//   try {
//     const branchId = req.user.branchId;
//     const userId = req.user.userId;
//     const { id } = req.params;

//     const query = { _id: id, branchId };
//     if (req.user.role === 'teacher') {
//       const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
//       query.classId = { $in: userClasses.map(c => c._id) };
//     }

//     const deletedAdvertisement = await Advertisement.findOneAndDelete(query);
//     if (!deletedAdvertisement) {
//       return res.status(404).json({ message: 'Advertisement not found or you don\'t have access' });
//     }

//     if (deletedAdvertisement.image && deletedAdvertisement.image.filename) {
//       const filePath = path.join(uploadsRoot, 'advertisements', deletedAdvertisement.image.filename);
//       if (fs.existsSync(filePath)) {
//         fs.unlink(filePath, (err) => {
//           if (err) {
//             console.error('Error deleting image:', err);
//           } else {
//             console.log('Successfully deleted image:', filePath);
//           }
//         });
//       } else {
//         console.log('Image file not found:', filePath);
//       }
//     }

//     res.status(200).json({ message: 'Advertisement deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting advertisement:', error.message);
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getAllAdvertisements = async (req, res) => {
//   try {
//     const branchId = req.user.branchId;
//     const userId = req.user.userId;
//     const { sessionId, classId, status } = req.query;

//     const query = { branchId };

//     if (req.user.role === 'teacher') {
//       const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
//       const teacherClassIds = userClasses.map(c => c._id);

//       if (teacherClassIds.length === 0) {
//         return res.status(200).json([]);
//       }

//       query.classId = { $in: teacherClassIds };
//       if (classId) {
//         const isValidClass = teacherClassIds.some(id => id.toString() === classId);
//         if (!isValidClass) {
//           return res.status(403).json({ message: 'Access denied to this class' });
//         }
//         query.classId = classId;
//       }
//     } else {
//       if (classId) query.classId = classId;
//     }

//     if (sessionId) query.sessionId = sessionId;
//     if (status) query.status = status;

//     const advertisements = await Advertisement.find(query)
//       .populate('sessionId', 'name sessionId')
//       .populate('classId', 'name id')
//       .populate('createdBy', 'name email');

//     res.status(200).json(advertisements);
//   } catch (error) {
//     console.error('Error fetching advertisements:', error.message);
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getAdvertisementById = async (req, res) => {
//   try {
//     const branchId = req.user.branchId;
//     const userId = req.user.userId;
//     const { id } = req.params;

//     const query = { _id: id, branchId };
//     if (req.user.role === 'teacher') {
//       const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
//       query.classId = { $in: userClasses.map(c => c._id) };
//     }

//     const advertisement = await Advertisement.findOne(query)
//       .populate('sessionId', 'name sessionId')
//       .populate('classId', 'name id')
//       .populate('createdBy', 'name email');

//     if (!advertisement) {
//       return res.status(404).json({ message: 'Advertisement not found or you don\'t have access' });
//     }

//     res.status(200).json(advertisement);
//   } catch (error) {
//     console.error('Error fetching advertisement:', error.message);
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getAllAdvertisementsForSuperadmin = async (req, res) => {
//   try {
//     const { branchId, sessionId, classId, status } = req.query;
//     const query = {};

//     if (branchId) query.branchId = branchId;
//     if (sessionId) query.sessionId = sessionId;
//     if (classId) query.classId = classId;
//     if (status) query.status = status;

//     const advertisements = await Advertisement.find(query)
//       .populate('sessionId', 'name sessionId')
//       .populate('classId', 'name id')
//       .populate('createdBy', 'name email');

//     res.status(200).json(advertisements);
//   } catch (error) {
//     console.error('Error fetching advertisements for superadmin:', error.message);
//     res.status(500).json({ message: error.message });
//   }
// };

import mongoose from 'mongoose';
import Advertisement from '../models/advertisement.js';
import Session from '../models/session.js';
import Class from '../models/class.js';
import fs from 'fs';
import path from 'path';
import { uploadsRoot } from '../uploadsRoot.js';
const fsPromises = fs.promises;

export const createAdvertisement = async (req, res) => {
  try {
    const branchId = new mongoose.Types.ObjectId(req.user.branchId);
    const userId = req.user.userId;
    let { sessionId, classId, name, description, status } = req.body;

    if (!sessionId || !classId || !name || !description || !status) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!Array.isArray(classId)) classId = [classId];

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either active or inactive' });
    }

    const sessionExists = await Session.findOne({ _id: sessionId, branchId });
    if (!sessionExists) {
      return res.status(404).json({ message: 'Session not found in this branch' });
    }

    const classQuery = { _id: { $in: classId }, branchId };
    if (req.user.role === 'teacher') {
      classQuery.teacherId = { $in: [userId] };
    }

    const classes = await Class.find(classQuery);
    if (classes.length === 0) {
      return res.status(404).json({ message: 'No valid class(es) found or you don\'t have access' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'An image is required' });
    }

    const image = {
      filename: req.file.filename,
      path: path.join('advertisements', req.file.filename).replace(/\\/g, '/'),
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    const newAdvertisement = new Advertisement({
      branchId,
      sessionId,
      classId,
      name,
      description,
      status,
      image,
      createdBy: userId,
    });

    const savedAdvertisement = await newAdvertisement.save();
    res.status(201).json(savedAdvertisement);
  } catch (error) {
    console.error('Error creating advertisement:', error.message);
    if (req.file) {
      const filePath = path.join(uploadsRoot, 'advertisements', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, err => err && console.error('Error deleting uploaded file:', err));
      }
    }
    res.status(400).json({ message: error.message });
  }
};

export const updateAdvertisement = async (req, res) => {
  try {
    let { sessionId, classId, name, description, status } = req.body;
    const advertisementId = req.params.id;

    if (!sessionId || !classId || !name || !description || !status) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (!Array.isArray(classId)) classId = [classId];

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either active or inactive' });
    }

    const existingAdvertisement = await Advertisement.findById(advertisementId);
    if (!existingAdvertisement) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    let image = existingAdvertisement.image;

    if (req.file) {
      if (image?.filename) {
        const oldPath = path.join(uploadsRoot, 'advertisements', image.filename);
        try {
          await fsPromises.access(oldPath);
          await fsPromises.unlink(oldPath);
        } catch (err) {
          if (err.code !== 'ENOENT') console.error('Error deleting old image:', err);
        }
      }

      image = {
        filename: req.file.filename,
        path: path.join('advertisements', req.file.filename).replace(/\\/g, '/'),
        mimetype: req.file.mimetype,
        size: req.file.size,
      };
    }

    const updateData = {
      sessionId,
      classId,
      name,
      description,
      status,
      image,
      updatedAt: new Date(),
    };

    const updatedAdvertisement = await Advertisement.findByIdAndUpdate(
      advertisementId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedAdvertisement) {
      return res.status(404).json({ message: 'Advertisement not found after update' });
    }

    res.status(200).json(updatedAdvertisement);
  } catch (error) {
    console.error('Error updating advertisement:', error);
    res.status(500).json({ message: 'Server error while updating advertisement' });
  }
};

export const deleteAdvertisement = async (req, res) => {
  try {
    const branchId = new mongoose.Types.ObjectId(req.user.branchId);
    const userId = req.user.userId;
    const { id } = req.params;

    const query = { _id: id, branchId };
    if (req.user.role === 'teacher') {
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      query.classId = { $in: userClasses.map(c => c._id) };
    }

    const deletedAd = await Advertisement.findOneAndDelete(query);
    if (!deletedAd) {
      return res.status(404).json({ message: 'Advertisement not found or you don\'t have access' });
    }

    if (deletedAd.image?.filename) {
      const filePath = path.join(uploadsRoot, 'advertisements', deletedAd.image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, err => err && console.error('Error deleting image:', err));
      }
    }

    res.status(200).json({ message: 'Advertisement deleted successfully' });
  } catch (error) {
    console.error('Error deleting advertisement:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAllAdvertisements = async (req, res) => {
  try {
    const branchId = new mongoose.Types.ObjectId(req.user.branchId);
    const userId = req.user.userId;
    const { sessionId, classId, status } = req.query;

    const query = { branchId };

    if (sessionId) query.sessionId = sessionId;
    if (status) query.status = status;

    if (req.user.role === 'teacher') {
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      const teacherClassIds = userClasses.map(c => c._id);

      if (teacherClassIds.length === 0) return res.status(200).json([]);

      query.classId = { $in: teacherClassIds };

      if (classId) {
        const isValid = teacherClassIds.some(id => id.toString() === classId);
        if (!isValid) return res.status(403).json({ message: 'Access denied to this class' });
        query.classId = { $in: [classId] };
      }
    } else if (classId) {
      query.classId = { $in: [classId] };
    }

    const ads = await Advertisement.find(query)
      .populate('sessionId', 'name sessionId')
      .populate('classId', 'name id')
      .populate('createdBy', 'name email');

    res.status(200).json(ads);
  } catch (error) {
    console.error('Error fetching advertisements:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAdvertisementById = async (req, res) => {
  try {
    const branchId = new mongoose.Types.ObjectId(req.user.branchId);
    const userId = req.user.userId;
    const { id } = req.params;

    const query = { _id: id, branchId };
    if (req.user.role === 'teacher') {
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      query.classId = { $in: userClasses.map(c => c._id) };
    }

    const ad = await Advertisement.findOne(query)
      .populate('sessionId', 'name sessionId')
      .populate('classId', 'name id')
      .populate('createdBy', 'name email');

    if (!ad) {
      return res.status(404).json({ message: 'Advertisement not found or you don\'t have access' });
    }

    res.status(200).json(ad);
  } catch (error) {
    console.error('Error fetching advertisement:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAllAdvertisementsForSuperadmin = async (req, res) => {
  try {
    const { branchId, sessionId, classId, status } = req.query;
    const query = {};

    if (branchId) query.branchId = branchId;
    if (sessionId) query.sessionId = sessionId;
    if (classId) query.classId = { $in: [classId] };
    if (status) query.status = status;

    const ads = await Advertisement.find(query)
      .populate('sessionId', 'name sessionId')
      .populate('classId', 'name id')
      .populate('createdBy', 'name email');

    res.status(200).json(ads);
  } catch (error) {
    console.error('Error fetching advertisements for superadmin:', error.message);
    res.status(500).json({ message: error.message });
  }
};
