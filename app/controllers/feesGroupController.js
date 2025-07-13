import feesGroup from '../models/feesGroup.js';

export const createFeesGroup = async (req, res) => {
  try {
    const { branchId } = req.user;
    const { id, name, description, status } = req.body;

    const newFeesGroup = new feesGroup({
      id,
      name,
      description,
      status,
      branchId,
    });

    const savedFeesGroup = await newFeesGroup.save();
    res.status(201).json(savedFeesGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllFeesGroups = async (req, res) => {
  try {
    const { branchId } = req.user;
    const feesGroups = await feesGroup.find({ branchId });
    res.json(feesGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeesGroupById = async (req, res) => {
  try {
    const { branchId } = req.user;
    const feesGroupData = await feesGroup.findOne({ _id: req.params.id, branchId });
    if (!feesGroupData) return res.status(404).json({ message: 'Fees Group not found' });
    res.json(feesGroupData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFeesGroup = async (req, res) => {
  try {
    const { branchId } = req.user;
    const { name, description, status } = req.body;
    const updatedFeesGroup = await feesGroup.findOneAndUpdate(
      { _id: req.params.id, branchId },
      { name, description, status, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedFeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
    res.json(updatedFeesGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteFeesGroup = async (req, res) => {
  try {
    const { branchId } = req.user;
    const deletedFeesGroup = await feesGroup.findOneAndDelete({ _id: req.params.id, branchId });
    if (!deletedFeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
    res.json({ message: 'Fees Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
