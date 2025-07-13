import FeesGroup from '../models/feesGroup.js';

export const createFeesGroup = async (req, res) => {
  try {
    const { name, periodicity, status } = req.body;
    const branchId = req.user.branchId;
    console.log(req.body)
    const newfeesGroup = new FeesGroup({
      name,
      periodicity,
      status,
      branchId
    });

    const savedFeesGroup = await newfeesGroup.save();
    res.status(201).json(savedFeesGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllFeesGroups = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const newfeesGroups = await FeesGroup.find({ branchId });
    res.json(newfeesGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeesGroupById = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const newfeesGroup = await FeesGroup.findOne({ _id: req.params.id, branchId });
    if (!newfeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
    res.json(newfeesGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFeesGroup = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const { name, periodicity, status } = req.body;
      const newfeesGroup = await FeesGroup.findOneAndUpdate(
        { _id: req.params.id, branchId },
        { name, periodicity, status, updatedAt: Date.now() },
        { new: true }
      );
    if (!newfeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
    res.json(newfeesGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteFeesGroup = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const newfeesGroup = await FeesGroup.findOneAndDelete({ _id: req.params.id, branchId });
    if (!newfeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
    res.json({ message: 'Fees Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};