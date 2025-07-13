import Enquiry from '../models/enquiry.js';
import mongoose from 'mongoose';
// Create enquiry
export const createEnquiry = async (req, res) => {
  try {
    console.log(req.user)
    const enquiryData = req.body;
    console.log(enquiryData)
    const branchId = req.user.branchId;
    console.log("_____________________________",branchId)
    const enquiry = new Enquiry({...enquiryData, branchId});
    console.log(enquiry)
    await enquiry.save();
    res.status(201).json(enquiry);
  } catch (error) {
    res.status(500).json({ message: "Error creating enquiry", error });
  }
};

// Get enquiry by ID
export const getEnquiry = async (req, res) => {
  try {
    const branchId = new mongoose.Types.ObjectId(req.user.branchId);
    const enquiry = await Enquiry.findOne({
      _id: req.params.id,
      branchId
    });
    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    res.status(200).json(enquiry);
  } catch (error) {
    res.status(500).json({ message: "Error fetching enquiry", error });
  }
};

// Update enquiry
export const updateEnquiry = async (req, res) => {
  try {
    const branchId = new mongoose.Types.ObjectId(req.user.branchId);
    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: req.params.id, branchId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    res.status(200).json(enquiry);
  } catch (error) {
    res.status(500).json({ message: "Error updating enquiry", error });
  }
};

// Delete enquiry
export const deleteEnquiry = async (req, res) => {
  try {
    const branchId = new mongoose.Types.ObjectId(req.user.branchId);
    const enquiry = await Enquiry.findOneAndDelete({
      _id: req.params.id,
      branchId
    });
    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    res.status(200).json({ message: "Enquiry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting enquiry", error });
  }
};

export const getAllEnquiries = async (req, res) => {
  try {
    const branchId = new mongoose.Types.ObjectId(req.user.branchId);
    const enquiries = await Enquiry.find({ branchId })
      .populate('sessionId', 'name')
      .populate('classId', 'name');
    res.status(200).json(enquiries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching enquiries", error });
  }
};