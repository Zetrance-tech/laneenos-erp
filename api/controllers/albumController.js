import mongoose from "mongoose";
import Album from "../models/album.js";
import Session from "../models/session.js";
import Class from "../models/class.js";
import { albumUpload } from "../middleware/multer.js"; // Use albumUpload instead of upload
import fs from 'fs';
import path from 'path';

// Define the root uploads directory (one level up from api)
import { uploadsRoot } from "../uploadsRoot.js";
export const createAlbum = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { sessionId, classId, name, description } = req.body;

    if (!branchId || !userId) {
      return res.status(400).json({ message: "Branch ID or User ID is missing" });
    }

    if (!sessionId || !classId || !name || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Verify session exists
    const sessionExists = await Session.findOne({ _id: sessionId, branchId });
    if (!sessionExists) {
      return res.status(404).json({ message: "Session not found in this branch" });
    }

    // Verify class exists and user has access
    const classQuery = { _id: classId, branchId };
    if (req.user.role === "teacher") {
      classQuery.teacherId = { $in: [userId] };
    }
    const classExists = await Class.findOne(classQuery);
    if (!classExists) {
      return res.status(404).json({ message: "Class not found or you don't have access" });
    }

    // Handle image uploads
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    // Map images to store relative paths
    const images = req.files.map(file => ({
      filename: file.filename,
      path: path.join('albums', file.filename).replace(/\\/g, '/'), // Store relative path
      mimetype: file.mimetype,
      size: file.size,
    }));

    const newAlbum = new Album({
      branchId,
      sessionId,
      classId,
      name,
      description,
      images, // Array of images
      createdBy: userId,
    });

    const savedAlbum = await newAlbum.save();
    res.status(201).json(savedAlbum);
  } catch (error) {
    console.error("Error creating album:", error.message);
    // Clean up uploaded files on error
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
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { sessionId, classId, name, description } = req.body;

    const query = { _id: req.params.id, branchId };
    if (req.user.role === "teacher") {
      // Teachers only update albums for their classes
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      query.classId = { $in: userClasses.map(c => c._id) };
    }

    // Verify session exists if provided
    if (sessionId) {
      const sessionExists = await Session.findOne({ _id: sessionId, branchId });
      if (!sessionExists) {
        return res.status(404).json({ message: "Session not found in this branch" });
      }
    }

    // Verify class exists and user has access if provided
    if (classId) {
      const classQuery = { _id: classId, branchId };
      if (req.user.role === "teacher") {
        classQuery.teacherId = { $in: [userId] };
      }
      const classExists = await Class.findOne(classQuery);
      if (!classExists) {
        return res.status(404).json({ message: "Class not found or you don't have access" });
      }
    }

    // Find the existing album
    const existingAlbum = await Album.findOne(query);
    if (!existingAlbum) {
      // Clean up uploaded files if album not found
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
      return res.status(404).json({ message: "Album not found or you don't have access" });
    }

    // Handle new images if uploaded
    let newImages = existingAlbum.images || [];
    if (req.files && req.files.length > 0) {
      // Delete old images from storage
      if (newImages.length > 0) {
        newImages.forEach(image => {
          const filePath = path.join(uploadsRoot, image.path);
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) console.error('Error deleting old image:', err);
            });
          }
        });
      }

      // Add new images with relative paths
      newImages = req.files.map(file => ({
        filename: file.filename,
        path: path.join('albums', file.filename).replace(/\\/g, '/'), // Store relative path
        mimetype: file.mimetype,
        size: file.size,
      }));
    }

    const updateData = { name, description };
    if (sessionId) updateData.sessionId = sessionId;
    if (classId) updateData.classId = classId;
    if (req.files && req.files.length > 0) updateData.images = newImages;

    const updatedAlbum = await Album.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedAlbum) {
      // Clean up uploaded files if update fails
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
      return res.status(404).json({ message: "Album not found or you don't have access" });
    }

    res.status(200).json(updatedAlbum);
  } catch (error) {
    console.error("Error updating album:", error.message);
    // Clean up uploaded files on error
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

export const deleteAlbum = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { id } = req.params;

    const query = { _id: id, branchId };
    if (req.user.role === "teacher") {
      // Teachers only delete albums for their classes
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      query.classId = { $in: userClasses.map(c => c._id) };
    }

    const deletedAlbum = await Album.findOneAndDelete(query);
    if (!deletedAlbum) {
      return res.status(404).json({ message: "Album not found or you don't have access" });
    }

    // Delete associated image files from storage
    if (deletedAlbum.images && deletedAlbum.images.length > 0) {
      deletedAlbum.images.forEach(image => {
        const filePath = path.join(uploadsRoot, image.path);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting image:', err);
            else console.log('Successfully deleted image:', filePath);
          });
        } else {
          console.log('Image file not found:', filePath);
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

    // Handle teacher role filtering FIRST
    if (req.user.role === "teacher") {
      // Get classes where this teacher is assigned
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      const teacherClassIds = userClasses.map(c => c._id);

      // If no classes assigned to teacher, return empty result
      if (teacherClassIds.length === 0) {
        return res.status(200).json([]);
      }

      // Restrict to teacher's classes
      query.classId = { $in: teacherClassIds };

      // If specific classId is requested, make sure it's in teacher's classes
      if (classId) {
        const isValidClass = teacherClassIds.some(id => id.toString() === classId);
        if (!isValidClass) {
          return res.status(403).json({ message: "Access denied to this class" });
        }
        query.classId = classId; // Override with specific class
      }
    } else {
      // For non-teachers, apply normal filtering
      if (classId) query.classId = classId;
    }

    // Apply session filter for all roles
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
      // Teachers only see albums for their classes
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      query.classId = { $in: userClasses.map(c => c._id) };
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
    if (classId) query.classId = classId;

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