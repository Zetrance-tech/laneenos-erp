import FeesGroup from '../models/feesGroup.js';
import FeesConcession from '../models/feesConcession.js';
import mongoose from 'mongoose';

export const addFeesConcession = async (req, res) => {
  try {
    const { category, discounts } = req.body;

    // Validate required fields
    if (!category || !Array.isArray(discounts) || discounts.length === 0) {
      return res.status(400).json({ message: 'All required fields (category, discounts) must be provided, and discounts must be a non-empty array' });
    }

    // Validate category
    const validCategories = [
      'EWS', 'Corporate Concession', 'First Sibling Concession', 'Staff Concession',
      'Management Concession', 'Armed Forces Concession', 'Second Sibling Concession',
      'Scholarship Concession', 'Readmission Concession', 'Girl Child Concession',
      'Early Enrollment Concession', 'Other'
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Fetch all fee groups to ensure all are included
    const allFeeGroups = await FeesGroup.find().select('_id');
    const allFeeGroupIds = allFeeGroups.map(fg => fg._id.toString());

    // Validate discounts array
    for (const discount of discounts) {
      if (!discount.feesGroup || discount.percentageDiscount === undefined) {
        return res.status(400).json({ message: 'Each discount must include feesGroup and percentageDiscount' });
      }
      if (!mongoose.Types.ObjectId.isValid(discount.feesGroup)) {
        return res.status(400).json({ message: `Invalid feesGroup ID: ${discount.feesGroup}` });
      }
      if (discount.percentageDiscount < 0 || discount.percentageDiscount > 100) {
        return res.status(400).json({ message: `Percentage discount for group ${discount.feesGroup} must be between 0 and 100` });
      }
      const feesGroupExists = await FeesGroup.findById(discount.feesGroup);
      if (!feesGroupExists) {
        return res.status(400).json({ message: `FeesGroup ID ${discount.feesGroup} does not exist` });
      }
    }

    // Ensure all fee groups are included in discounts
    const providedFeeGroupIds = discounts.map(d => d.feesGroup.toString());
    const missingFeeGroups = allFeeGroupIds.filter(id => !providedFeeGroupIds.includes(id));
    if (missingFeeGroups.length > 0) {
      return res.status(400).json({ message: `Discounts must be provided for all fee groups. Missing: ${missingFeeGroups.join(', ')}` });
    }

    // Create new concession
    const newConcession = new FeesConcession({
      category,
      discounts,
    });

    await newConcession.save();
    const populatedConcession = await FeesConcession.findById(newConcession._id)
      .populate('discounts.feesGroup', 'name');

    res.status(201).json({
      message: 'Fee concession added successfully',
      data: populatedConcession,
    });
  } catch (error) {
    console.error('Error adding fee concession:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateFeesConcession = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, discounts } = req.body;

    // Validate concession ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid concession ID' });
    }

    const concession = await FeesConcession.findById(id);
    if (!concession) {
      return res.status(404).json({ message: 'Fee concession not found' });
    }

    // Validate required fields
    if (!category || !Array.isArray(discounts) || discounts.length === 0) {
      return res.status(400).json({ message: 'Category and non-empty discounts array are required' });
    }

    // Validate category
    const validCategories = [
      'EWS', 'Corporate Concession', 'First Sibling Concession', 'Staff Concession',
      'Management Concession', 'Armed Forces Concession', 'Second Sibling Concession',
      'Scholarship Concession', 'Readmission Concession', 'Girl Child Concession',
      'Early Enrollment Concession', 'Other'
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Fetch all fee groups
    const allFeeGroups = await FeesGroup.find().select('_id');
    const allFeeGroupIds = allFeeGroups.map(fg => fg._id.toString());

    // Validate discounts array
    for (const discount of discounts) {
      if (!discount.feesGroup || discount.percentageDiscount === undefined) {
        return res.status(400).json({ message: 'Each discount must include feesGroup and percentageDiscount' });
      }
      if (!mongoose.Types.ObjectId.isValid(discount.feesGroup)) {
        return res.status(400).json({ message: `Invalid feesGroup ID: ${discount.feesGroup}` });
      }
      if (discount.percentageDiscount < 0 || discount.percentageDiscount > 100) {
        return res.status(400).json({ message: `Percentage discount for group ${discount.feesGroup} must be between 0 and 100` });
      }
      const feesGroupExists = await FeesGroup.findById(discount.feesGroup);
      if (!feesGroupExists) {
        return res.status(400).json({ message: `FeesGroup ID ${discount.feesGroup} does not exist` });
      }
    }

    // Ensure all fee groups are included in discounts
    const providedFeeGroupIds = discounts.map(d => d.feesGroup.toString());
    const missingFeeGroups = allFeeGroupIds.filter(id => !providedFeeGroupIds.includes(id));
    if (missingFeeGroups.length > 0) {
      return res.status(400).json({ message: `Discounts must be provided for all fee groups. Missing: ${missingFeeGroups.join(', ')}` });
    }

    // Update concession
    concession.category = category;
    concession.discounts = discounts;
    concession.updatedAt = new Date();

    await concession.save();

    const updatedConcession = await FeesConcession.findById(id)
      .populate('discounts.feesGroup', 'name');

    res.status(200).json({
      message: 'Fee concession updated successfully',
      data: updatedConcession,
    });
  } catch (error) {
    console.error('Error updating fee concession:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteFeesConcession = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid concession ID' });
    }

    const concession = await FeesConcession.findById(id);
    if (!concession) {
      return res.status(404).json({ message: 'Fee concession not found' });
    }

    await FeesConcession.findByIdAndDelete(id);

    res.status(200).json({ message: 'Fee concession deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee concession:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllFeesConcessions = async (req, res) => {
  try {
    const concessions = await FeesConcession.find()
      .populate('discounts.feesGroup', 'name')
      .lean();
    res.status(200).json(concessions);
  } catch (error) {
    console.error('Error fetching fee concessions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllFeeGroupsForConcession = async (req, res) => {
  try {
    const feeGroups = await FeesGroup.find().select('id name').lean();
    res.status(200).json(feeGroups);
  } catch (error) {
    console.error('Error fetching fee groups:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};