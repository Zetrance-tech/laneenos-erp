import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { all_routes } from '../../router/all_routes';
import { useAuth } from '../../../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

interface MyTokenPayload {
  userId: string;
  role: string;
  branchId: string;
  iat: number;
  exp: number;
}

const API_URL = process.env.REACT_APP_URL;

interface MessageFormData {
  recipients: {
    users: string[]; // For teachers and admins
    parents: string[]; // For parents
    classes: string[]; // Selected classes
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

interface Parent {
  _id: string;
  name: string;
}

const SendMessage: React.FC = () => {
  const { token } = useAuth();
  let decoded: MyTokenPayload | null = null;
  const routes = all_routes;
  const classDropdownRef = useRef<HTMLDivElement | null>(null);
  const teacherDropdownRef = useRef<HTMLDivElement | null>(null);
  const parentDropdownRef = useRef<HTMLDivElement | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [formData, setFormData] = useState<MessageFormData>({
    recipients: { users: [], parents: [], classes: [] },
    subject: '',
    message: '',
    attachment: null,
  });
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<User[]>([]);
  const [availableParents, setAvailableParents] = useState<Parent[]>([]);
  const [selectAllClasses, setSelectAllClasses] = useState(false);
  const [selectAllTeachers, setSelectAllTeachers] = useState(false);
  const [selectAllParents, setSelectAllParents] = useState(false);

  try {
    decoded = token ? jwtDecode<MyTokenPayload>(token) : null;
  } catch (error) {
    console.error('Error decoding token:', error);
    toast.error('Invalid token. Please log in again.');
  }

  // Fetch classes based on role
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        let classesRes;
        if (decoded?.role === 'admin') {
          classesRes = await axios.get(`${API_URL}/api/messages/classes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else if (decoded?.role === 'teacher') {
          classesRes = await axios.get(`${API_URL}/api/messages/classes/teacher/${decoded.userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else if (user.role === 'parent') {
          const studentRes = await axios.get(`${API_URL}/api/messages/students/parent/${decoded?.userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const classId = studentRes.data.classId;
          classesRes = await axios.get(`${API_URL}/api/messages/classes/${classId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          classesRes.data = [classesRes.data]; // Wrap single class in array for consistency
        }
        setAvailableClasses(classesRes?.data);
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to fetch classes');
      }
    };
    fetchClasses();
  }, [user.role, decoded?.userId, token]);

  // Fetch teachers and parents based on selected classes
  useEffect(() => {
    const fetchTeachersAndParents = async () => {
      try {
        if (formData.recipients.classes.length === 0) {
          setAvailableTeachers([]);
          setAvailableParents([]);
          setFormData((prev) => ({
            ...prev,
            recipients: { ...prev.recipients, users: [], parents: [] },
          }));
          setSelectAllTeachers(false);
          setSelectAllParents(false);
          return;
        }

        // Fetch teachers for selected classes
        const teachersRes = await axios.post(
          `${API_URL}/api/messages/classes/teachers`,
          { classIds: formData.recipients.classes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAvailableTeachers(teachersRes.data);

        // Fetch parents for selected classes
        const parentsRes = await axios.post(
          `${API_URL}/api/messages/students/parents`,
          { classIds: formData.recipients.classes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAvailableParents(parentsRes.data);

        // Reset selected teachers and parents to only those still available
        setFormData((prev) => ({
          ...prev,
          recipients: {
            ...prev.recipients,
            users: prev.recipients.users.filter((id) =>
              teachersRes.data.some((t: User) => t._id === id)
            ),
            parents: prev.recipients.parents.filter((id) =>
              parentsRes.data.some((p: Parent) => p._id === id)
            ),
          },
        }));
        setSelectAllTeachers(
          formData.recipients.users.length === teachersRes.data.length &&
          teachersRes.data.length > 0
        );
        setSelectAllParents(
          formData.recipients.parents.length === parentsRes.data.length &&
          parentsRes.data.length > 0
        );
      } catch (error) {
        console.error('Error fetching teachers or parents:', error);
        toast.error('Failed to fetch teachers or parents');
      }
    };
    fetchTeachersAndParents();
  }, [formData.recipients.classes, token]);

  // Handle recipient selection
  const handleRecipientChange = (type: 'users' | 'parents' | 'classes', id: string) => {
    setFormData((prev) => {
      const updatedRecipients = prev.recipients[type].includes(id)
        ? prev.recipients[type].filter((r) => r !== id)
        : [...prev.recipients[type], id];
      if (type === 'classes') {
        setSelectAllClasses(updatedRecipients.length === availableClasses.length);
      } else if (type === 'users') {
        setSelectAllTeachers(updatedRecipients.length === availableTeachers.length);
      } else if (type === 'parents') {
        setSelectAllParents(updatedRecipients.length === availableParents.length);
      }
      return {
        ...prev,
        recipients: { ...prev.recipients, [type]: updatedRecipients },
      };
    });
  };

  // Handle "Select All" for each type
  const handleSelectAll = (type: 'users' | 'parents' | 'classes') => {
    const allIds =
      type === 'classes'
        ? availableClasses.map((c) => c._id)
        : type === 'users'
        ? availableTeachers.map((t) => t._id)
        : availableParents.map((p) => p._id);
    const isAllSelected =
      type === 'classes'
        ? selectAllClasses
        : type === 'users'
        ? selectAllTeachers
        : selectAllParents;

    setFormData((prev) => ({
      ...prev,
      recipients: {
        ...prev.recipients,
        [type]: isAllSelected ? [] : allIds,
      },
    }));
    if (type === 'classes') setSelectAllClasses(!selectAllClasses);
    if (type === 'users') setSelectAllTeachers(!selectAllTeachers);
    if (type === 'parents') setSelectAllParents(!selectAllParents);
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
    if (formData.recipients.classes.length === 0 && formData.recipients.users.length === 0 && formData.recipients.parents.length === 0) {
      toast.error('Please select at least one recipient (class, teacher, or parent).');
      return;
    }
    try {
      const payload = {
        sender: decoded?.userId,
        recipients: {
          users: [...formData.recipients.users, ...formData.recipients.parents], // Combine teachers and parents into users
          students: [], // Not used in this case
          classes: formData.recipients.classes,
        },
        subject: formData.subject,
        message: formData.message,
        attachment: formData.attachment ? formData.attachment.name : null,
      };
      await axios.post(`${API_URL}/api/messages/send`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Message sent successfully');
      setFormData({
        recipients: { users: [], parents: [], classes: [] },
        subject: '',
        message: '',
        attachment: null,
      });
      setSelectAllClasses(false);
      setSelectAllTeachers(false);
      setSelectAllParents(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      [classDropdownRef, teacherDropdownRef, parentDropdownRef].forEach((ref) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          ref.current.classList.remove('show');
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedClassNames =
    availableClasses.filter((c) => formData.recipients.classes.includes(c._id)).map((c) => c.name).join(', ') || 'None';
  const selectedTeacherNames =
    availableTeachers.filter((t) => formData.recipients.users.includes(t._id)).map((t) => t.name).join(', ') || 'None';
  const selectedParentNames =
    availableParents.filter((p) => formData.recipients.parents.includes(p._id)).map((p) => p.name).join(', ') || 'None';

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
              <div className="mb-3">
                <label className="form-label">Classes</label>
                <div className="dropdown" ref={classDropdownRef}>
                  <button
                    className="btn btn-outline-light bg-white dropdown-toggle w-100 text-start"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    {formData.recipients.classes.length > 0 ? `${formData.recipients.classes.length} Class(es) Selected` : 'Select Classes'}
                  </button>
                  <div className="dropdown-menu p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="select-all-classes"
                        checked={selectAllClasses}
                        onChange={() => handleSelectAll('classes')}
                      />
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
                <label className="form-label">Teachers</label>
                <div className="dropdown" ref={teacherDropdownRef}>
                  <button
                    className="btn btn-outline-light bg-white dropdown-toggle w-100 text-start"
                    type="button"
                    data-bs-toggle="dropdown"
                    disabled={formData.recipients.classes.length === 0}
                  >
                    {formData.recipients.users.length > 0 ? `${formData.recipients.users.length} Teacher(s) Selected` : 'Select Teachers'}
                  </button>
                  <div className="dropdown-menu p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="select-all-teachers"
                        checked={selectAllTeachers}
                        onChange={() => handleSelectAll('users')}
                        disabled={formData.recipients.classes.length === 0}
                      />
                      <label className="form-check-label" htmlFor="select-all-teachers">All Teachers</label>
                    </div>
                    <hr className="my-2" />
                    {availableTeachers.length > 0 ? (
                      availableTeachers.map((teacher) => (
                        <div key={teacher._id} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`teacher-${teacher._id}`}
                            checked={formData.recipients.users.includes(teacher._id)}
                            onChange={() => handleRecipientChange('users', teacher._id)}
                          />
                          <label className="form-check-label" htmlFor={`teacher-${teacher._id}`}>{teacher.name}</label>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted mb-0">Select a class to view teachers</p>
                    )}
                  </div>
                </div>
                <small className="text-muted">Selected: {selectedTeacherNames}</small>
              </div>
              <div className="mb-3">
                <label className="form-label">Parents</label>
                <div className="dropdown" ref={parentDropdownRef}>
                  <button
                    className="btn btn-outline-light bg-white dropdown-toggle w-100 text-start"
                    type="button"
                    data-bs-toggle="dropdown"
                    disabled={formData.recipients.classes.length === 0}
                  >
                    {formData.recipients.parents.length > 0 ? `${formData.recipients.parents.length} Parent(s) Selected` : 'Select Parents'}
                  </button>
                  <div className="dropdown-menu p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="select-all-parents"
                        checked={selectAllParents}
                        onChange={() => handleSelectAll('parents')}
                        disabled={formData.recipients.classes.length === 0}
                      />
                      <label className="form-check-label" htmlFor="select-all-parents">All Parents</label>
                    </div>
                    <hr className="my-2" />
                    {availableParents.length > 0 ? (
                      availableParents.map((parent) => (
                        <div key={parent._id} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`parent-${parent._id}`}
                            checked={formData.recipients.parents.includes(parent._id)}
                            onChange={() => handleRecipientChange('parents', parent._id)}
                          />
                          <label className="form-check-label" htmlFor={`parent-${parent._id}`}>{parent.name}</label>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted mb-0">Select a class to view parents</p>
                    )}
                  </div>
                </div>
                <small className="text-muted">Selected: {selectedParentNames}</small>
              </div>
              <div className="mb-3">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-control"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Subject"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Attachment (Optional)</label>
                <div className="bg-light p-3 pb-2 rounded">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="btn btn-primary drag-upload-btn mb-2 me-2">
                      <i className="ti ti-file-upload me-1" /> Browse... Please choose file
                      <input
                        type="file"
                        className="form-control image_sign"
                        onChange={handleFileChange}
                        accept=".pdf"
                      />
                    </div>
                    {formData.attachment && <p className="text-primary">{formData.attachment.name}</p>}
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Message</label>
                <textarea
                  className="form-control"
                  rows={5}
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Type your message here..."
                  required
                />
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