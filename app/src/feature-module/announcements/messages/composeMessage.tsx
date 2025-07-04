import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { all_routes } from '../../router/all_routes';
import { useAuth } from '../../../context/AuthContext';
const API_URL = process.env.REACT_APP_URL;
interface MessageFormData {
  recipients: {
    users: string[];
    students: string[];
    classes: string[];
  };
  subject: string;
  message: string;
  attachment: File | null;
}

interface User {
  _id: string;
  name: string;
  role: string;
}

interface Class {
  _id: string;
  name: string;
}

interface Student {
  _id: string;
  name: string;
}

const SendMessage: React.FC = () => {
  const { token } = useAuth();
  const routes = all_routes;
  const userDropdownRef = useRef<HTMLDivElement | null>(null);
  const classDropdownRef = useRef<HTMLDivElement | null>(null);
  const studentDropdownRef = useRef<HTMLDivElement | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [formData, setFormData] = useState<MessageFormData>({
    recipients: { users: [], students: [], classes: [] },
    subject: '',
    message: '',
    attachment: null,
  });
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectAllUsers, setSelectAllUsers] = useState(false);
  const [selectAllClasses, setSelectAllClasses] = useState(false);
  const [selectAllStudents, setSelectAllStudents] = useState(false);

  // Fetch initial data based on role
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (user.role === 'admin') {
          const classesRes = await axios.get(`${API_URL}/api/messages/classes`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setAvailableClasses(classesRes.data);
        } else if (user.role === 'teacher') {
          const [adminsRes, classesRes] = await Promise.all([
            axios.get(`${API_URL}/api/messages/users/admins`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            axios.get(`${API_URL}/api/messages/classes/teacher/${user._id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);
          setAvailableUsers(adminsRes.data);
          setAvailableClasses(classesRes.data);
        } else if (user.role === 'parent') {
          const studentRes = await axios.get(`${API_URL}/api/messages/students/parent/${user._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const classId = studentRes.data.classId;
          const [adminsRes, teachersRes] = await Promise.all([
            axios.get(`${API_URL}/api/messages/users/admins`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            axios.get(`${API_URL}/api/messages/classes/${classId}/teachers`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);
          setAvailableUsers([...adminsRes.data, ...teachersRes.data]);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to fetch data');
      }
    };
    fetchInitialData();
  }, [user.role, user._id]);

  // Fetch students based on selected classes
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (formData.recipients.classes.length === 0) {
          setAvailableStudents([]);
          setFormData((prev) => ({ ...prev, recipients: { ...prev.recipients, students: [] } }));
          setSelectAllStudents(false);
          return;
        }

        const response = await axios.post(`${API_URL}/api/messages/students`, {
          classIds: formData.recipients.classes,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAvailableStudents(response.data);
        // Reset selected students to only those still available
        setFormData((prev) => ({
          ...prev,
          recipients: {
            ...prev.recipients,
            students: prev.recipients.students.filter((studentId) =>
              response.data.some((s: Student) => s._id === studentId)
            ),
          },
        }));
        setSelectAllStudents(
          formData.recipients.students.length === response.data.length &&
          response.data.length > 0
        );
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to fetch students');
      }
    };
    if (user.role === 'admin' || user.role === 'teacher') {
      fetchStudents();
    }
  }, [formData.recipients.classes, user.role]);

  // Handle recipient selection
  const handleRecipientChange = (type: 'users' | 'students' | 'classes', id: string) => {
    setFormData((prev) => {
      const updatedRecipients = prev.recipients[type].includes(id)
        ? prev.recipients[type].filter((r) => r !== id)
        : [...prev.recipients[type], id];
      if (type === 'users') setSelectAllUsers(updatedRecipients.length === availableUsers.length);
      if (type === 'classes') setSelectAllClasses(updatedRecipients.length === availableClasses.length);
      if (type === 'students') setSelectAllStudents(updatedRecipients.length === availableStudents.length);
      return {
        ...prev,
        recipients: { ...prev.recipients, [type]: updatedRecipients },
      };
    });
  };

  // Handle "Select All" for each type
  const handleSelectAll = (type: 'users' | 'students' | 'classes') => {
    const allIds = type === 'users'
      ? availableUsers.map((u) => u._id)
      : type === 'classes'
      ? availableClasses.map((c) => c._id)
      : availableStudents.map((s) => s._id);
    const isAllSelected = type === 'users' ? selectAllUsers : type === 'classes' ? selectAllClasses : selectAllStudents;

    setFormData((prev) => ({
      ...prev,
      recipients: {
        ...prev.recipients,
        [type]: isAllSelected ? [] : allIds,
      },
    }));
    if (type === 'users') setSelectAllUsers(!selectAllUsers);
    if (type === 'classes') setSelectAllClasses(!selectAllClasses);
    if (type === 'students') setSelectAllStudents(!selectAllStudents);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, attachment: file }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        sender: user._id,
        recipients: formData.recipients,
        subject: formData.subject,
        message: formData.message,
        attachment: formData.attachment ? formData.attachment.name : null,
      };
      await axios.post(`${API_URL}/api/messages/send`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Message sent successfully');
      setFormData({
        recipients: { users: [], students: [], classes: [] },
        subject: '',
        message: '',
        attachment: null,
      });
      setSelectAllUsers(false);
      setSelectAllClasses(false);
      setSelectAllStudents(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      [userDropdownRef, classDropdownRef, studentDropdownRef].forEach((ref) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          ref.current.classList.remove('show');
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedUserNames = availableUsers.filter((u) => formData.recipients.users.includes(u._id)).map((u) => u.name).join(', ') || 'None';
  const selectedClassNames = availableClasses.filter((c) => formData.recipients.classes.includes(c._id)).map((c) => c.name).join(', ') || 'None';
  const selectedStudentNames = availableStudents.filter((s) => formData.recipients.students.includes(s._id)).map((s) => s.name).join(', ') || 'None';

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">New Message</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Send Message</li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h4 className="mb-0">Compose Message</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {(user.role === 'teacher' || user.role === 'parent') && (
                <div className="mb-3">
                  <label className="form-label">Users</label>
                  <div className="dropdown" ref={userDropdownRef}>
                    <button className="btn btn-outline-light bg-white dropdown-toggle w-100 text-start" type="button" data-bs-toggle="dropdown">
                      {formData.recipients.users.length > 0 ? `${formData.recipients.users.length} User(s) Selected` : 'Select Users'}
                    </button>
                    <div className="dropdown-menu p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <div className="form-check">
                        <input type="checkbox" className="form-check-input" id="select-all-users" checked={selectAllUsers} onChange={() => handleSelectAll('users')} />
                        <label className="form-check-label" htmlFor="select-all-users">All Users</label>
                      </div>
                      <hr className="my-2" />
                      {availableUsers.map((u) => (
                        <div key={u._id} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`user-${u._id}`}
                            checked={formData.recipients.users.includes(u._id)}
                            onChange={() => handleRecipientChange('users', u._id)}
                          />
                          <label className="form-check-label" htmlFor={`user-${u._id}`}>{u.name} ({u.role})</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <small className="text-muted">Selected: {selectedUserNames}</small>
                </div>
              )}
              {(user.role === 'admin' || user.role === 'teacher') && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Classes</label>
                    <div className="dropdown" ref={classDropdownRef}>
                      <button className="btn btn-outline-light bg-white dropdown-toggle w-100 text-start" type="button" data-bs-toggle="dropdown">
                        {formData.recipients.classes.length > 0 ? `${formData.recipients.classes.length} Class(es) Selected` : 'Select Classes'}
                      </button>
                      <div className="dropdown-menu p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <div className="form-check">
                          <input type="checkbox" className="form-check-input" id="select-all-classes" checked={selectAllClasses} onChange={() => handleSelectAll('classes')} />
                          <label className="form-check-label" htmlFor="select-all-classes">All Classes</label>
                        </div>
                        <hr className="my-2" />
                        {availableClasses.map((cls) => (
                          <div key={cls._id} className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`class-${cls._id}`}
                              checked={formData.recipients.classes.includes(cls._id)}
                              onChange={() => handleRecipientChange('classes', cls._id)}
                            />
                            <label className="form-check-label" htmlFor={`class-${cls._id}`}>{cls.name}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <small className="text-muted">Selected: {selectedClassNames}</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Students</label>
                    <div className="dropdown" ref={studentDropdownRef}>
                      <button
                        className="btn btn-outline-light bg-white dropdown-toggle w-100 text-start"
                        type="button"
                        data-bs-toggle="dropdown"
                        disabled={formData.recipients.classes.length === 0}
                      >
                        {formData.recipients.students.length > 0 ? `${formData.recipients.students.length} Student(s) Selected` : 'Select Students'}
                      </button>
                      <div className="dropdown-menu p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="select-all-students"
                            checked={selectAllStudents}
                            onChange={() => handleSelectAll('students')}
                            disabled={formData.recipients.classes.length === 0}
                          />
                          <label className="form-check-label" htmlFor="select-all-students">All Students</label>
                        </div>
                        <hr className="my-2" />
                        {availableStudents.length > 0 ? (
                          availableStudents.map((student) => (
                            <div key={student._id} className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`student-${student._id}`}
                                checked={formData.recipients.students.includes(student._id)}
                                onChange={() => handleRecipientChange('students', student._id)}
                              />
                              <label className="form-check-label" htmlFor={`student-${student._id}`}>{student.name}</label>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted mb-0">Select a class to view students</p>
                        )}
                      </div>
                    </div>
                    <small className="text-muted">Selected: {selectedStudentNames}</small>
                  </div>
                </>
              )}
              <div className="mb-3">
                <label className="form-label">Subject</label>
                <input type="text" className="form-control" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="Subject" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Attachment (Optional)</label>
                <div className="bg-light p-3 pb-2 rounded">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="btn btn-primary drag-upload-btn mb-2 me-2">
                      <i className="ti ti-file-upload me-1" /> Browse... Please choose file
                      <input type="file" className="form-control image_sign" onChange={handleFileChange} accept=".pdf" />
                    </div>
                    {formData.attachment && <p className="text-primary">{formData.attachment.name}</p>}
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Message</label>
                <textarea className="form-control" rows={5} name="message" value={formData.message} onChange={handleInputChange} placeholder="Type your message here..." required />
              </div>
              <div className="d-flex align-items-center justify-content-end">
                <button type="submit" className="btn btn-primary">Send</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMessage;