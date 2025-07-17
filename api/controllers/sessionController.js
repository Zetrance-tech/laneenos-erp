import mongoose from "mongoose";
import Session from "../models/session.js";
import Counter from "../models/counter.js";
import Branch from "../models/branch.js";
const getNextSequence = async (type, branchId) => {
  const counter = await Counter.findOneAndUpdate(
    { type: `${type}_id`, branchId },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return counter.sequence;
};

const generateId = async (entityType, branchId) => {
  const sequence = await getNextSequence(entityType, branchId);
  switch (entityType) {
    case "class":
      return `LN-C${String(sequence).padStart(3, "0")}`;
    case "session":
      return `LN-S${String(sequence).padStart(3, "0")}`;
    case "student":
      return `LNS-${sequence}`;
    case "teacher":
      return `LNE-${sequence}`;
    default:
      throw new Error("Invalid entity type");
  }
};

export const getNextSessionId = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const sequence = await getNextSequence("session", branchId);
    const id = `LN-S${String(sequence).padStart(3, "0")}`;
    res.status(200).json({ id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createSession = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const sessionId = await generateId("session", branchId);
    const { name, startDate, endDate, status } = req.body;

    const newSession = new Session({
      name,
      startDate,
      endDate,
      sessionId,
      status,
      branchId,
    });

    const savedSession = await newSession.save();
    res.status(201).json(savedSession);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllSessions = async (req, res) => {
  try {
    console.log("______________________________________________________________")
    const branchId = req.user.branchId;
    const sessions = await Session.find({ branchId });
    console.log(sessions)
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const session = await Session.findOne({ _id: req.params.id, branchId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSession = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const { name, startDate, endDate, sessionId, status } = req.body;

    const updatedSession = await Session.findOneAndUpdate(
      { _id: req.params.id, branchId },
      { name, startDate, endDate, sessionId, status },
      { new: true, runValidators: true }
    );

    if (!updatedSession) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json(updatedSession);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const deletedSession = await Session.findOneAndDelete({ _id: req.params.id, branchId });
    if (!deletedSession) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getAllSessionsForSuperadmin = async (req, res) => {
  try {
    const { branchId } = req.query;
    const query = {};
    
    if (branchId) query.branchId = branchId;
    
    const sessions = await Session.find(query);
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};