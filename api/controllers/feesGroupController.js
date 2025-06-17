// // controllers/feesGroupController.js
// import feesGroup from '../models/feesGroup.js';

// export const createFeesGroup = async (req, res) => {
//   try {
//     const { id, name, periodicity, status } = req.body;
    
//     const newfeesGroup = new feesGroup({
//       id,
//       name,
//       periodicity,
//       status
//     });

//     const savedFeesGroup = await newfeesGroup.save();
//     res.status(201).json(savedFeesGroup);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// export const getAllFeesGroups = async (req, res) => {
//   try {
//     const newfeesGroups = await feesGroup.find();
//     res.json(newfeesGroups);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getFeesGroupById = async (req, res) => {
//   try {
//     const newfeesGroup = await feesGroup.findById(req.params.id);
//     if (!newfeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
//     res.json(newfeesGroup);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const updateFeesGroup = async (req, res) => {
//   try {
//     const { name, periodicity, status } = req.body;
//     const newfeesGroup = await feesGroup.findByIdAndUpdate(
//       req.params.id,
//       { name, periodicity, status, updatedAt: Date.now() },
//       { new: true }
//     );
//     if (!newfeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
//     res.json(newfeesGroup);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// export const deleteFeesGroup = async (req, res) => {
//   try {
//     const newfeesGroup = await feesGroup.findByIdAndDelete(req.params.id);
//     if (!newfeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
//     res.json({ message: 'Fees Group deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

import FeesGroup from '../models/feesGroup.js';

export const createFeesGroup = async (req, res) => {
  try {
    const { name, periodicity, status } = req.body;
    console.log(req.body)
    const newfeesGroup = new FeesGroup({
      name,
      periodicity,
      status
    });

    const savedFeesGroup = await newfeesGroup.save();
    console.log("abc",savedFeesGroup)
    res.status(201).json(savedFeesGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllFeesGroups = async (req, res) => {
  try {
    const newfeesGroups = await FeesGroup.find();
    res.json(newfeesGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeesGroupById = async (req, res) => {
  try {
    const newfeesGroup = await FeesGroup.findById(req.params.id);
    if (!newfeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
    res.json(newfeesGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFeesGroup = async (req, res) => {
  try {
    const { name, periodicity, status } = req.body;
    const newfeesGroup = await FeesGroup.findByIdAndUpdate(
      req.params.id,
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
    const newfeesGroup = await FeesGroup.findByIdAndDelete(req.params.id);
    if (!newfeesGroup) return res.status(404).json({ message: 'Fees Group not found' });
    res.json({ message: 'Fees Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};