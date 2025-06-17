import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { all_routes } from '../../router/all_routes';
import { useAuth } from '../../../context/AuthContext';
interface Sender {
  name: string;
  role: string;
}

interface User {
  _id: string;
  name: string;
}

interface Class {
  _id: string;
  name: string;
}

interface Student {
  _id: string;
  name: string;
}

interface Message {
  _id: string;
  sender: Sender;
  recipients: {
    users: User[];
    classes: Class[];
    students: Student[];
  };
  subject: string;
  message: string;
  attachment: string | null;
  createdAt: string;
}
const API_URL = process.env.REACT_APP_URL;

const ReceiveMessages: React.FC = () => {
  const routes = all_routes;
  const userDropdownRef = useRef<HTMLDivElement | null>(null);
  const classDropdownRef = useRef<HTMLDivElement | null>(null);
  const studentDropdownRef = useRef<HTMLDivElement | null>(null);
  const { token } = useAuth();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAllUsers, setSelectAllUsers] = useState(false);
  const [selectAllClasses, setSelectAllClasses] = useState(false);
  const [selectAllStudents, setSelectAllStudents] = useState(false);

  // Fetch messages and available filters on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const messagesRes = await axios.get(`${API_URL}/api/messages/inbox?userId=${user._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMessages(messagesRes.data);
        setFilteredMessages(messagesRes.data);
  
        // Fetch filter options based on role
        if (user.role === 'teacher') {
          // First, fetch the teacher's classes
          const classesRes = await axios.get(`${API_URL}/api/messages/classes/teacher/${user._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setAvailableClasses(classesRes.data);
  
          // Then, fetch students for those classes using POST
          const classIds = classesRes.data.map((cls:any) => cls._id);
          const studentsRes = await axios.post(
            `${API_URL}/api/messages/students`,
            { classIds }, // Send classIds in the body
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setAvailableStudents(studentsRes.data);
        } else if (user.role === 'parent') {
          const adminsRes = await axios.get(`${API_URL}/api/messages/users/admins`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setAvailableUsers(adminsRes.data);
        } else if (user.role === 'student') {
          const studentRes = await axios.get(`${API_URL}/api/messages/students/by-email?email=${user.email}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const student = studentRes.data;
          if (!student) throw new Error('Student not found');
          const classesRes = await axios.get(`${API_URL}/api/messages/classes/${student.classId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setAvailableClasses([classesRes.data]);
          setAvailableStudents([student]);
        }
      } catch (error:any) {
        console.error('Error fetching data:', error.response?.data, error.response?.status);
        toast.error(error.response?.data?.error || 'Failed to fetch data');
      }
    };
    fetchData();
  }, [user._id, user.role, user.email]);

  // Filter messages (only for non-admin roles)
  useEffect(() => {
    if (user.role === 'admin') {
      setFilteredMessages(messages); // No filtering needed for admin
      return;
    }
  
    let filtered = messages;
    if (selectedUsers.length > 0) {
      filtered = filtered.filter((msg) => msg.recipients.users.some((u) => selectedUsers.includes(u._id)));
    }
    if (selectedClasses.length > 0) {
      filtered = filtered.filter((msg) => msg.recipients.classes.some((c) => selectedClasses.includes(c._id)));
    }
    if (selectedStudents.length > 0) {
      filtered = filtered.filter((msg) => msg.recipients.students.some((s) => selectedStudents.includes(s._id)));
    }
    setFilteredMessages(filtered);
  }, [selectedUsers, selectedClasses, selectedStudents, messages, user.role]);

  // Handle selection
  const handleSelectionChange = (type: 'users' | 'students' | 'classes', id: string) => {
    const setter = type === 'users' ? setSelectedUsers : type === 'classes' ? setSelectedClasses : setSelectedStudents;
    const allSetter = type === 'users' ? setSelectAllUsers : type === 'classes' ? setSelectAllClasses : setSelectAllStudents;
    const available = type === 'users' ? availableUsers : type === 'classes' ? availableClasses : availableStudents;

    setter((prev) => {
      const updated = prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id];
      allSetter(updated.length === available.length);
      return updated;
    });
  };

  const handleSelectAll = (type: 'users' | 'students' | 'classes') => {
    const allIds = type === 'users'
      ? availableUsers.map((u) => u._id)
      : type === 'classes'
      ? availableClasses.map((c) => c._id)
      : availableStudents.map((s) => s._id);
    const setter = type === 'users' ? setSelectedUsers : type === 'classes' ? setSelectedClasses : setSelectedStudents;
    const allSetter = type === 'users' ? setSelectAllUsers : type === 'classes' ? setSelectAllClasses : setSelectAllStudents;
    const isAllSelected = type === 'users' ? selectAllUsers : type === 'classes' ? selectAllClasses : selectAllStudents;

    setter(isAllSelected ? [] : allIds);
    allSetter(!isAllSelected);
  };

  // Close dropdowns
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

  const selectedUserNames = availableUsers.filter((u) => selectedUsers.includes(u._id)).map((u) => u.name).join(', ') || 'None';
  const selectedClassNames = availableClasses.filter((c) => selectedClasses.includes(c._id)).map((c) => c.name).join(', ') || 'None';
  const selectedStudentNames = availableStudents.filter((s) => selectedStudents.includes(s._id)).map((s) => s.name).join(', ') || 'None';

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Inbox</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Inbox</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="mb-2">
              <Link to="#" className="btn btn-light me-2" onClick={() => window.location.reload()}>Refresh</Link>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Received Messages</h4>
            {user.role !== 'admin' && (
              <div className="d-flex align-items-center flex-wrap">
                {user.role === 'parent' && (
                  <div className="mb-3 me-2">
                    <div className="dropdown" ref={userDropdownRef}>
                      <button className="btn btn-outline-light bg-white dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i className="ti ti-filter me-2" /> Filter by User
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
                              checked={selectedUsers.includes(u._id)}
                              onChange={() => handleSelectionChange('users', u._id)}
                            />
                            <label className="form-check-label" htmlFor={`user-${u._id}`}>{u.name}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <small className="text-muted d-block mt-1">Selected: {selectedUserNames}</small>
                  </div>
                )}
                {(user.role === 'teacher' || user.role === 'student') && (
                  <>
                    <div className="mb-3 me-2">
                      <div className="dropdown" ref={classDropdownRef}>
                        <button className="btn btn-outline-light bg-white dropdown-toggle" type="button" data-bs-toggle="dropdown">
                          <i className="ti ti-filter me-2" /> Filter by Class
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
                                checked={selectedClasses.includes(cls._id)}
                                onChange={() => handleSelectionChange('classes', cls._id)}
                              />
                              <label className="form-check-label" htmlFor={`class-${cls._id}`}>{cls.name}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <small className="text-muted d-block mt-1">Selected: {selectedClassNames}</small>
                    </div>
                    <div className="mb-3 me-2">
                      <div className="dropdown" ref={studentDropdownRef}>
                        <button className="btn btn-outline-light bg-white dropdown-toggle" type="button" data-bs-toggle="dropdown">
                          <i className="ti ti-filter me-2" /> Filter by Student
                        </button>
                        <div className="dropdown-menu p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <div className="form-check">
                            <input type="checkbox" className="form-check-input" id="select-all-students" checked={selectAllStudents} onChange={() => handleSelectAll('students')} />
                            <label className="form-check-label" htmlFor="select-all-students">All Students</label>
                          </div>
                          <hr className="my-2" />
                          {availableStudents.map((student) => (
                            <div key={student._id} className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`student-${student._id}`}
                                checked={selectedStudents.includes(student._id)}
                                onChange={() => handleSelectionChange('students', student._id)}
                              />
                              <label className="form-check-label" htmlFor={`student-${student._id}`}>{student.name}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <small className="text-muted d-block mt-1">Selected: {selectedStudentNames}</small>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="card-body p-0 py-3">
            {filteredMessages.length === 0 ? (
              <div className="p-3"><p>No messages found.</p></div>
            ) : (
              filteredMessages.map((message) => (
                <div key={message._id} className="card board-hover mb-3 mx-3">
                  <div className="card-body d-md-flex align-items-center justify-content-between pb-1">
                    <div className="d-flex align-items-center mb-3">
                      <span className="bg-soft-primary text-primary avatar avatar-md me-2 br-5 flex-shrink-0">
                        <i className="ti ti-mail fs-16" />
                      </span>
                      <div>
                        <h6 className="mb-1 fw-semibold">
                          <Link to="#" data-bs-toggle="modal" data-bs-target={`#view_message_${message._id}`}>
                            {message.subject}
                          </Link>
                        </h6>
                        <p><i className="ti ti-user me-1" /> From: {message.sender.name} ({message.sender.role})</p>
                        <p><i className="ti ti-calendar me-1" /> Sent on: {new Date(message.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {filteredMessages.map((message) => (
        <div className="modal fade" id={`view_message_${message._id}`} key={message._id}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">{message.subject}</h4>
                <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                  <i className="ti ti-x" />
                </button>
              </div>
              <div className="modal-body pb-0">
                <div className="mb-3"><p>{message.message}</p></div>
                <div className="mb-3">
                  <div className="bg-light p-3 pb-2 rounded">
                    <label className="form-label">Attachment</label>
                    <p className="text-primary">{message.attachment || 'No attachment'}</p>
                  </div>
                </div>
                <div className="border-top pt-3">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="d-flex align-items-center me-4 mb-3">
                      <span className="avatar avatar-sm bg-light me-1"><i className="ti ti-user text-default fs-14" /></span>
                      From: {message.sender.name} ({message.sender.role})
                    </div>
                    <div className="d-flex align-items-center me-4 mb-3">
                      <span className="avatar avatar-sm bg-light me-1"><i className="ti ti-calendar text-default fs-14" /></span>
                      Sent on: {new Date(message.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReceiveMessages;