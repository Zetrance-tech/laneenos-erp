import Session from "../models/session.js";
import Counter from "../models/counter.js";

export const getNextSequence = async (name) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence;
};

export const generateId = async (entityType) => {
  const sequence = await getNextSequence(`${entityType}_id`);
  switch (entityType) {
    case "class":
      return `LN-144-C${String(sequence).padStart(3, "0")}`; // LN-144-C001
    case "session":
      return `LN-144-S${String(sequence).padStart(3, "0")}`; // LN-144-S001
    case "student":
      return `LNS-144-${sequence}`; // LNS-144-1
    case "teacher":
      return `LNE-144-${sequence}`; // LNE-144-1
    default:
      throw new Error("Invalid entity type");
  }
};

export const getNextSessionId = async (req, res) => {
  try {
    const counter = await Counter.findOne({ _id: "session_id" });
    const sequence = counter ? counter.sequence + 1 : 1;
    const id = `LN-144-S${String(sequence).padStart(3, "0")}`;
    res.status(200).json({ id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create a new session
export const createSession = async (req, res) => {
  try {
    const sessionId = await generateId("session");
    const { name, startDate, endDate, status } = req.body;

    const newSession = new Session({
      name,
      startDate,
      endDate,
      sessionId,
      status,
    });

    const savedSession = await newSession.save();
    res.status(201).json(savedSession);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all sessions
export const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find();
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single session by ID
export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a session by ID
export const updateSession = async (req, res) => {
  try {
    const { name, startDate, endDate, sessionId, status } = req.body;

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
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

// Delete a session by ID
export const deleteSession = async (req, res) => {
  try {
    const deletedSession = await Session.findByIdAndDelete(req.params.id);
    if (!deletedSession) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};