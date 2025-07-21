import Story from '../models/stories.js';
import Session from '../models/session.js';
import Class from '../models/class.js';
import { storyUpload } from '../middleware/multer.js';
import fs from 'fs';
import path from 'path';
import { uploadsRoot } from '../uploadsRoot.js';

const fsPromises = fs.promises;

export const createStory = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { sessionId, classId, name, description } = req.body;

    if (!branchId || !userId) {
      return res.status(400).json({ message: 'Branch ID or User ID is missing' });
    }

    if (!sessionId || !classId || !name || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const sessionExists = await Session.findOne({ _id: sessionId, branchId });
    if (!sessionExists) {
      return res.status(404).json({ message: 'Session not found in this branch' });
    }

    const classQuery = { _id: classId, branchId };
    if (req.user.role === 'teacher') {
      classQuery.teacherId = { $in: [userId] };
    }
    const classExists = await Class.findOne(classQuery);
    if (!classExists) {
      return res.status(404).json({ message: 'Class not found or you don\'t have access' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one PDF is required' });
    }

    const pdfs = req.files.map(file => ({
      filename: file.filename,
      path: path.join('stories', file.filename).replace(/\\/g, '/'),
      mimetype: file.mimetype,
      size: file.size,
    }));

    const newStory = new Story({
      branchId,
      sessionId,
      classId,
      name,
      description,
      pdfs,
      createdBy: userId,
    });

    const savedStory = await newStory.save();
    const populatedStory = await Story.findById(savedStory._id)
      .populate('sessionId', 'name sessionId')
      .populate('classId', 'name id')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedStory);
  } catch (error) {
    console.error('Error creating story:', error.message);
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(uploadsRoot, 'stories', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
          });
        }
      });
    }
    res.status(400).json({ message: error.message });
  }
};

export const updateStory = async (req, res) => {
  try {
    const { sessionId, classId, name, description, pdfsToDelete } = req.body;
    const storyId = req.params.id;

    if (!sessionId || !classId || !name || !description || !storyId) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const existingStory = await Story.findById(storyId);
    if (!existingStory) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const sessionExists = await Session.findOne({ _id: sessionId, branchId: req.user.branchId });
    if (!sessionExists) {
      return res.status(404).json({ message: 'Session not found in this branch' });
    }

    const classQuery = { _id: classId, branchId: req.user.branchId };
    if (req.user.role === 'teacher') {
      classQuery.teacherId = { $in: [req.user.userId] };
    }
    const classExists = await Class.findOne(classQuery);
    if (!classExists) {
      return res.status(404).json({ message: 'Class not found or you don\'t have access' });
    }

    let pdfs = existingStory.pdfs || [];

    let pdfsToDeleteArray = [];
    try {
      pdfsToDeleteArray = pdfsToDelete ? JSON.parse(pdfsToDelete) : [];
    } catch (error) {
      console.error('updateStory: Error parsing pdfsToDelete:', error);
      return res.status(400).json({ message: 'Invalid pdfsToDelete format' });
    }

    if (Array.isArray(pdfsToDeleteArray) && pdfsToDeleteArray.length > 0) {
      for (const filename of pdfsToDeleteArray) {
        const pdfIndex = pdfs.findIndex(pdf => pdf.filename === filename);
        if (pdfIndex === -1) {
          continue;
        }

        const filePath = path.join(uploadsRoot, 'stories', filename);
        try {
          await fsPromises.access(filePath);
          await fsPromises.unlink(filePath);
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log('updateStory: File not found:', filePath);
          } else {
            console.error('updateStory: Error deleting file:', error);
          }
        }

        pdfs.splice(pdfIndex, 1);
      }
    }

    if (req.files && Array.isArray(req.files)) {
      const newPdfs = req.files.map(file => ({
        filename: file.filename,
        path: `stories/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
      }));
      pdfs = [...pdfs, ...newPdfs];
    }

    const updateData = {
      sessionId,
      classId,
      name,
      description,
      pdfs,
      updatedAt: new Date(),
    };

    const updatedStory = await Story.findByIdAndUpdate(
      storyId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedStory) {
      return res.status(404).json({ message: 'Story not found after update' });
    }

    const populatedStory = await Story.findById(updatedStory._id)
      .populate('sessionId', 'name sessionId')
      .populate('classId', 'name id')
      .populate('createdBy', 'name email');

    res.status(200).json(populatedStory);
  } catch (error) {
    console.error('updateStory: Error:', error);
    res.status(500).json({ message: 'Server error while updating story' });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { id } = req.params;

    const query = { _id: id, branchId };
    if (req.user.role === 'teacher') {
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      query.classId = { $in: userClasses.map(c => c._id) };
    }

    const deletedStory = await Story.findOneAndDelete(query);
    if (!deletedStory) {
      return res.status(404).json({ message: 'Story not found or you don\'t have access' });
    }

    if (deletedStory.pdfs && deletedStory.pdfs.length > 0) {
      deletedStory.pdfs.forEach(pdf => {
        const filePath = path.join(uploadsRoot, pdf.path);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting PDF:', err);
            else console.log('Successfully deleted PDF:', filePath);
          });
        } else {
          console.log('PDF file not found:', filePath);
        }
      });
    }

    res.status(200).json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAllStories = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { sessionId, classId } = req.query;

    const query = { branchId };

    if (req.user.role === 'teacher') {
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      const teacherClassIds = userClasses.map(c => c._id);

      if (teacherClassIds.length === 0) {
        return res.status(200).json([]);
      }

      query.classId = { $in: teacherClassIds };
      if (classId) {
        const isValidClass = teacherClassIds.some(id => id.toString() === classId);
        if (!isValidClass) {
          return res.status(403).json({ message: 'Access denied to this class' });
        }
        query.classId = classId;
      }
    } else {
      if (classId) query.classId = classId;
    }

    if (sessionId) query.sessionId = sessionId;

    const stories = await Story.find(query)
      .populate('sessionId', 'name sessionId')
      .populate('classId', 'name id')
      .populate('createdBy', 'name email');

    res.status(200).json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getStoryById = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { id } = req.params;

    const query = { _id: id, branchId };
    if (req.user.role === 'teacher') {
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      query.classId = { $in: userClasses.map(c => c._id) };
    }

    const story = await Story.findOne(query)
      .populate('sessionId', 'name sessionId')
      .populate('classId', 'name id')
      .populate('createdBy', 'name email');

    if (!story) {
      return res.status(404).json({ message: 'Story not found or you don\'t have access' });
    }

    res.status(200).json(story);
  } catch (error) {
    console.error('Error fetching story:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAllStoriesForSuperadmin = async (req, res) => {
  try {
    const { branchId, sessionId, classId } = req.query;
    const query = {};

    if (branchId) query.branchId = branchId;
    if (sessionId) query.sessionId = sessionId;
    if (classId) query.classId = classId;

    const stories = await Story.find(query)
      .populate('sessionId', 'name sessionId')
      .populate('classId', 'name id')
      .populate('createdBy', 'name email');

    res.status(200).json(stories);
  } catch (error) {
    console.error('Error fetching stories for superadmin:', error.message);
    res.status(500).json({ message: error.message });
  }
};