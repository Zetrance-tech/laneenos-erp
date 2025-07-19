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
    const { sessionId, classId, name, description } = req.body;

    if (!branchId || !userId) {
      return res.status(400).json({ message: "Branch ID or User ID is missing" });
    }

    if (!sessionId || !classId || !name || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const sessionExists = await Session.findOne({ _id: sessionId, branchId });
    if (!sessionExists) {
      return res.status(404).json({ message: "Session not found in this branch" });
    }

    const classQuery = { _id: classId, branchId };
    if (req.user.role === "teacher") {
      classQuery.teacherId = { $in: [userId] };
    }
    const classExists = await Class.findOne(classQuery);
    if (!classExists) {
      return res.status(404).json({ message: "Class not found or you don't have access" });
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
      classId,
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
    const { sessionId, classId, name, description, imagesToDelete } = req.body;
    const albumId = req.params.id;

    // Validate required fields
    if (!sessionId || !classId || !name || !description || !albumId) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Find the existing album
    const existingAlbum = await Album.findById(albumId);
    if (!existingAlbum) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Initialize images array with existing images
    let images = existingAlbum.images || [];

    // Parse imagesToDelete
    let imagesToDeleteArray = [];
    try {
      imagesToDeleteArray = imagesToDelete ? JSON.parse(imagesToDelete) : [];
    } catch (error) {
      console.error('updateAlbum: Error parsing imagesToDelete:', error);
      return res.status(400).json({ message: 'Invalid imagesToDelete format' });
    }

    // Delete specified images from the file system and database
    if (Array.isArray(imagesToDeleteArray) && imagesToDeleteArray.length > 0) {
      for (const filename of imagesToDeleteArray) {
        
        // Check if the image exists in the album
        const imageIndex = images.findIndex(img => img.filename === filename);
        if (imageIndex === -1) {
          continue; // Skip if image not found in album
        }

        // Construct the file path
        const filePath = path.join(uploadsRoot, 'albums', filename);

        try {
          // Check if file exists before attempting deletion
          await fsPromises.access(filePath);
          await fsPromises.unlink(filePath);
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log('updateAlbum: File not found:', filePath);
          } else {
          }
          // Continue with other deletions even if one fails
        }

        // Remove the image from the images array
        images.splice(imageIndex, 1);
      }
    }


    // Handle new image uploads
    if (req.files && Array.isArray(req.files)) {
      const newImages = req.files.map(file => ({
        filename: file.filename,
        path: `albums/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size
      }));
      images = [...images, ...newImages];
    }


    // Prepare update data
    const updateData = {
      sessionId,
      classId,
      name,
      description,
      images,
      updatedAt: new Date()
    };


    // Update the album in the database
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
      query.classId = { $in: userClasses.map(c => c._id) };
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

    if (req.user.role === "teacher") {
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      const teacherClassIds = userClasses.map(c => c._id);

      if (teacherClassIds.length === 0) {
        return res.status(200).json([]);
      }

      query.classId = { $in: teacherClassIds };
      if (classId) {
        const isValidClass = teacherClassIds.some(id => id.toString() === classId);
        if (!isValidClass) {
          return res.status(403).json({ message: "Access denied to this class" });
        }
        query.classId = classId;
      }
    } else {
      if (classId) query.classId = classId;
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