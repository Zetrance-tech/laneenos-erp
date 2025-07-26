import mongoose from "mongoose";
import Album from "../models/album.js";
import Session from "../models/session.js";
import Class from "../models/class.js";
import { albumUpload } from "../middleware/multer.js";
import fs from 'fs';
import path from 'path';
import { uploadsRoot } from "../uploadsRoot.js";

const fsPromises = fs.promises;

export const createAlbum = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { sessionId, classId: classIds, name, description } = req.body;

    if (!branchId || !userId) {
      return res.status(400).json({ message: "Branch ID or User ID is missing" });
    }

    if (!Array.isArray(classIds) || classIds.length === 0 || !sessionId || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const sessionExists = await Session.findOne({ _id: sessionId, branchId });
    if (!sessionExists) {
      return res.status(404).json({ message: "Session not found in this branch" });
    }

    const classQuery = { _id: { $in: classIds }, branchId };
    if (req.user.role === "teacher") {
      classQuery.teacherId = { $in: [userId] };
    }

    const classes = await Class.find(classQuery);
    if (classes.length !== classIds.length) {
      return res.status(403).json({ message: "You don't have access to one or more selected classes" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const images = req.files.map(file => ({
      filename: file.filename,
      path: path.join('albums', file.filename).replace(/\\/g, '/'),
      mimetype: file.mimetype,
      size: file.size,
    }));

    const newAlbum = new Album({
      branchId,
      sessionId,
      classId: classIds,
      name,
      description,
      images,
      createdBy: userId,
    });

    const savedAlbum = await newAlbum.save();
    res.status(201).json(savedAlbum);
  } catch (error) {
    console.error("Error creating album:", error.message);
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(uploadsRoot, 'albums', file.filename);
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

export const updateAlbum = async (req, res) => {
  try {
    const { sessionId, classId: classIds, name, description, imagesToDelete } = req.body;
    const albumId = req.params.id;

    if (!sessionId || !Array.isArray(classIds) || classIds.length === 0 || !name || !albumId) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const classQuery = { _id: { $in: classIds }, branchId: req.user.branchId };
    if (req.user.role === "teacher") {
      classQuery.teacherId = { $in: [req.user.userId] };
    }
    const classes = await Class.find(classQuery);
    if (classes.length !== classIds.length) {
      return res.status(403).json({ message: "You don't have access to one or more selected classes" });
    }

    const existingAlbum = await Album.findById(albumId);
    if (!existingAlbum) {
      return res.status(404).json({ message: 'Album not found' });
    }

    let images = existingAlbum.images || [];

    let imagesToDeleteArray = [];
    try {
      imagesToDeleteArray = imagesToDelete ? JSON.parse(imagesToDelete) : [];
    } catch (error) {
      console.error('updateAlbum: Error parsing imagesToDelete:', error);
      return res.status(400).json({ message: 'Invalid imagesToDelete format' });
    }

    if (Array.isArray(imagesToDeleteArray) && imagesToDeleteArray.length > 0) {
      for (const filename of imagesToDeleteArray) {
        const imageIndex = images.findIndex(img => img.filename === filename);
        if (imageIndex === -1) continue;

        const filePath = path.join(uploadsRoot, 'albums', filename);

        try {
          await fsPromises.access(filePath);
          await fsPromises.unlink(filePath);
        } catch (error) {
          if (error.code !== 'ENOENT') console.error(error);
        }

        images.splice(imageIndex, 1);
      }
    }

    if (req.files && Array.isArray(req.files)) {
      const newImages = req.files.map(file => ({
        filename: file.filename,
        path: `albums/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size
      }));
      images = [...images, ...newImages];
    }

    const updateData = {
      sessionId,
      classId: classIds,
      name,
      description,
      images,
      updatedAt: new Date()
    };

    const updatedAlbum = await Album.findByIdAndUpdate(
      albumId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedAlbum) {
      return res.status(404).json({ message: 'Album not found after update' });
    }

    return res.status(200).json(updatedAlbum);
  } catch (error) {
    console.error('updateAlbum: Error:', error);
    return res.status(500).json({ message: 'Server error while updating album' });
  }
};

export const deleteAlbum = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { id } = req.params;

    const query = { _id: id, branchId };
    if (req.user.role === "teacher") {
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      query.classId = { $elemMatch: { $in: userClasses.map(c => c._id) } };
    }

    const deletedAlbum = await Album.findOneAndDelete(query);
    if (!deletedAlbum) {
      return res.status(404).json({ message: "Album not found or you don't have access" });
    }

    if (deletedAlbum.images && deletedAlbum.images.length > 0) {
      deletedAlbum.images.forEach(image => {
        const filePath = path.join(uploadsRoot, image.path);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting image:', err);
            else console.log('Successfully deleted image:', filePath);
          });
        }
      });
    }

    res.status(200).json({ message: "Album deleted successfully" });
  } catch (error) {
    console.error("Error deleting album:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAllAlbums = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { sessionId, classId } = req.query;

    const query = { branchId };

    if (req.user.role === "teacher") {
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      const teacherClassIds = userClasses.map(c => c._id);

      if (teacherClassIds.length === 0) return res.status(200).json([]);

      query.classId = { $elemMatch: { $in: teacherClassIds } };

      if (classId) {
        const isValidClass = teacherClassIds.some(id => id.toString() === classId);
        if (!isValidClass) {
          return res.status(403).json({ message: "Access denied to this class" });
        }
        query.classId = { $elemMatch: { $eq: classId } };
      }
    } else {
      if (classId) query.classId = { $elemMatch: { $eq: classId } };
    }

    if (sessionId) query.sessionId = sessionId;

    const albums = await Album.find(query)
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id")
      .populate("createdBy", "name email");

    res.status(200).json(albums);
  } catch (error) {
    console.error("Error fetching albums:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAlbumById = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { id } = req.params;

    const query = { _id: id, branchId };
    if (req.user.role === "teacher") {
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      query.classId = { $elemMatch: { $in: userClasses.map(c => c._id) } };
    }

    const album = await Album.findOne(query)
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id")
      .populate("createdBy", "name email");

    if (!album) {
      return res.status(404).json({ message: "Album not found or you don't have access" });
    }

    res.status(200).json(album);
  } catch (error) {
    console.error("Error fetching album:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAllAlbumsForSuperadmin = async (req, res) => {
  try {
    const { branchId, sessionId, classId } = req.query;
    const query = {};

    if (branchId) query.branchId = branchId;
    if (sessionId) query.sessionId = sessionId;
    if (classId) query.classId = { $elemMatch: { $eq: classId } };

    const albums = await Album.find(query)
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id")
      .populate("createdBy", "name email");

    res.status(200).json(albums);
  } catch (error) {
    console.error("Error fetching albums for superadmin:", error.message);
    res.status(500).json({ message: error.message });
  }
};
