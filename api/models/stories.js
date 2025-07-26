import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
classId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true,
      },
    ],
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  pdfs: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

const Story = mongoose.model('Story', storySchema);
export default Story;