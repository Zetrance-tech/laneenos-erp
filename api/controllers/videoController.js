import mongoose from "mongoose";
import Video from "../models/video.js";
import Session from "../models/session.js";
import Class from "../models/class.js";
import { videoUpload } from "../middleware/multer.js";
import fs from 'fs';
import path from 'path';
import { uploadsRoot } from "../uploadsRoot.js";

const fsPromises = fs.promises;

export const createVideo = async (req, res) => {
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

    if (!req.file) {
      return res.status(400).json({ message: "A video file is required" });
    }

    const video = {
      filename: req.file.filename,
      path: path.join('videos', req.file.filename).replace(/\\/g, '/'),
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    const newVideo = new Video({
      branchId,
      sessionId,
      classId,
      name,
      description,
      video,
      createdBy: userId,
    });

    const savedVideo = await newVideo.save();
    res.status(201).json(savedVideo);
  } catch (error) {
    console.error("Error creating video:", error.message);
    if (req.file) {
      const filePath = path.join(uploadsRoot, 'videos', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
    }
    res.status(400).json({ message: error.message });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const { sessionId, classId, name, description, deleteVideo } = req.body;
    const videoId = req.params.id;

    // Validate required fields
    if (!sessionId || !classId || !name || !description || !videoId) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Find the existing video
    const existingVideo = await Video.findById(videoId);
    if (!existingVideo) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Initialize video object
    let video = existingVideo.video;

    // Handle video deletion
    if (deleteVideo === 'true' && video && video.filename) {
      const oldFilePath = path.join(uploadsRoot, 'videos', video.filename);
      try {
        await fsPromises.access(oldFilePath);
        await fsPromises.unlink(oldFilePath);
        video = null; // Clear the video field
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error('Error deleting old video:', error);
        }
      }
    }

    // Handle new video upload
    if (req.file) {
      // Delete old video file if it exists and hasn't been deleted already
      if (video && video.filename && deleteVideo !== 'true') {
        const oldFilePath = path.join(uploadsRoot, 'videos', video.filename);
        try {
          await fsPromises.access(oldFilePath);
          await fsPromises.unlink(oldFilePath);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.error('Error deleting old video:', error);
          }
        }
      }

      // Add new video
      video = {
        filename: req.file.filename,
        path: path.join('videos', req.file.filename).replace(/\\/g, '/'),
        mimetype: req.file.mimetype,
        size: req.file.size
      };
    }

    // Prepare update data
    const updateData = {
      sessionId,
      classId,
      name,
      description,
      video,
      updatedAt: new Date()
    };

    // Update the video in the database
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedVideo) {
      return res.status(404).json({ message: 'Video not found after update' });
    }

    return res.status(200).json(updatedVideo);
  } catch (error) {
    console.error('updateVideo: Error:', error);
    if (req.file) {
      const filePath = path.join(uploadsRoot, 'videos', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
    }
    return res.status(500).json({ message: 'Server error while updating video' });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { id } = req.params;

    const query = { _id: id, branchId };
    if (req.user.role === "teacher") {
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      query.classId = { $in: userClasses.map(c => c._id) };
    }

    const deletedVideo = await Video.findOneAndDelete(query);
    if (!deletedVideo) {
      return res.status(404).json({ message: "Video not found or you don't have access" });
    }

    if (deletedVideo.video && deletedVideo.video.filename) {
      const filePath = path.join(uploadsRoot, deletedVideo.video.path);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting video:', err);
          else console.log('Successfully deleted video:', filePath);
        });
      } else {
        console.log('Video file not found:', filePath);
      }
    }

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAllVideos = async (req, res) => {
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

    const videos = await Video.find(query)
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id")
      .populate("createdBy", "name email");

    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const userId = req.user.userId;
    const { id } = req.params;

    const query = { _id: id, branchId };
    if (req.user.role === "teacher") {
      const userClasses = await Class.find({ teacherId: { $in: [userId] }, branchId });
      query.classId = { $in: userClasses.map(c => c._id) };
    }

    const video = await Video.findOne(query)
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id")
      .populate("createdBy", "name email");

    if (!video) {
      return res.status(404).json({ message: "Video not found or you don't have access" });
    }

    res.status(200).json(video);
  } catch (error) {
    console.error("Error fetching video:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getAllVideosForSuperadmin = async (req, res) => {
  try {
    const { branchId, sessionId, classId } = req.query;
    const query = {};

    if (branchId) query.branchId = branchId;
    if (sessionId) query.sessionId = sessionId;
    if (classId) query.classId = classId;

    const videos = await Video.find(query)
      .populate("sessionId", "name sessionId")
      .populate("classId", "name id")
      .populate("createdBy", "name email");

    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos for superadmin:", error.message);
    res.status(500).json({ message: error.message });
  }
};