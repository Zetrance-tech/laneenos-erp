import mongoose from 'mongoose';

const NoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  noticeDate: {
    type: Date,
    required: true,
  },
  publishOn: {
    type: Date,
    required: true,
  },
  attachment: {
    type: String, 
    required: false, 
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  messageTo: [{
    type: String,
    enum: [
      'Student',
      'Parent',
      'Admin',
      'Teacher',
      'Accountant',
      'Librarian',
      'Receptionist',
      'Super Admin'
    ],
    required: true,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notice = mongoose.model('Notice', NoticeSchema);
export default Notice;