import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { all_routes } from '../../router/all_routes';
import { useAuth } from '../../../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { Select, Space, Input, Table, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface MyTokenPayload {
  userId: string;
  role: string;
  branchId: string;
  iat: number;
  exp: number;
}

let decoded: MyTokenPayload | null = null;

interface Sender {
  name?: string; // Made optional to handle null/undefined cases
  role?: string;
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
  sender: Sender | null; // Allow sender to be null
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
  const [searchText, setSearchText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  try {
    decoded = token ? jwtDecode<MyTokenPayload>(token) : null;
  } catch (error) {
    console.error('Error decoding token:', error);
    toast.error('Invalid token. Please log in again.');
  }

  // Fetch messages and available filter options on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const messagesRes = await axios.get(`${API_URL}/api/messages/inbox?userId=${decoded?.userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMessages(messagesRes.data);
        setFilteredMessages(messagesRes.data);

        if (decoded?.role === 'teacher') {
          const classesRes = await axios.get(`${API_URL}/api/messages/classes/teacher/${decoded?.userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setAvailableClasses(classesRes.data);

          const classIds = classesRes.data.map((cls: any) => cls._id);
          const studentsRes = await axios.post(
            `${API_URL}/api/messages/students`,
            { classIds },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setAvailableStudents(studentsRes.data);
        } else if (decoded?.role === 'parent') {
          const adminsRes = await axios.get(`${API_URL}/api/messages/users/admins`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setAvailableUsers(adminsRes.data);
        } else if (decoded?.role === 'student') {
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
      } catch (error: any) {
        console.error('Error fetching data:', error.response?.data, error.response?.status);
        toast.error(error.response?.data?.error || 'Failed to fetch data');
      }
    };
    fetchData();
  }, [decoded?.userId, decoded?.role, user.email, token]);

  // Frontend-only filtering
  useEffect(() => {
    let filtered = [...messages];

    // Apply filters only for non-admin roles
    if (decoded?.role !== 'admin') {
      if (selectedUsers.length > 0) {
        filtered = filtered.filter((msg) =>
          msg.recipients.users.some((u) => selectedUsers.includes(u._id))
        );
      }
      if (selectedClasses.length > 0) {
        filtered = filtered.filter((msg) =>
          msg.recipients.classes.some((c) => selectedClasses.includes(c._id))
        );
      }
      if (selectedStudents.length > 0) {
        filtered = filtered.filter((msg) =>
          msg.recipients.students.some((s) => selectedStudents.includes(s._id))
        );
      }
    }

    // Apply global search filter
    if (searchText) {
      filtered = filtered.filter(
        (msg) =>
          msg.subject.toLowerCase().includes(searchText.toLowerCase()) ||
          (msg.sender?.name?.toLowerCase()?.includes(searchText.toLowerCase()) ?? false)
      );
    }

    setFilteredMessages(filtered);
  }, [selectedUsers, selectedClasses, selectedStudents, messages, decoded?.role, searchText]);

  // Handle selection changes for antd Select
  const handleSelectionChange = (type: 'users' | 'students' | 'classes', values: string[]) => {
    const setter = type === 'users' ? setSelectedUsers : type === 'classes' ? setSelectedClasses : setSelectedStudents;
    const allSetter = type === 'users' ? setSelectAllUsers : type === 'classes' ? setSelectAllClasses : setSelectAllStudents;
    const available = type === 'users' ? availableUsers : type === 'classes' ? availableClasses : availableStudents;

    setter(values);
    allSetter(values.length === available.length);
  };

  // Handle select all functionality
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

  const selectedUserNames = availableUsers.filter((u) => selectedUsers.includes(u._id)).map((u) => u.name).join(', ') || 'None';
  const selectedClassNames = availableClasses.filter((c) => selectedClasses.includes(c._id)).map((c) => c.name).join(', ') || 'None';
  const selectedStudentNames = availableStudents.filter((s) => selectedStudents.includes(s._id)).map((s) => s.name).join(', ') || 'None';

  // Table columns
  const columns = [
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string, record: Message) => (
        <a href="#" onClick={() => setSelectedMessage(record)}>
          {text}
        </a>
      ),
    },
    {
      title: 'From',
      key: 'sender',
      render: (_: any, record: Message) => `${record.sender?.name || 'Unknown'} (${record.sender?.role || 'N/A'})`,
    },
    {
      title: 'Sent On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
  ];

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
              <Link to="#" className="btn btn-light me-2" onClick={() => window.location.reload()}>
                Refresh
              </Link>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
            <h4 className="mb-3">Received Messages</h4>
            <Space wrap>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search by subject or sender"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200, marginBottom: 12 }}
              />
              {decoded?.role !== 'admin' && (
                <>
                  {decoded?.role === 'parent' && (
                    <div className="mb-3 me-2">
                      <Select
                        mode="multiple"
                        style={{ width: 200 }}
                        placeholder="Filter by User"
                        value={selectedUsers}
                        onChange={(values) => handleSelectionChange('users', values)}
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        dropdownRender={(menu) => (
                          <>
                            <div style={{ padding: '8px' }}>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={selectAllUsers}
                                  onChange={() => handleSelectAll('users')}
                                  style={{ marginRight: '8px' }}
                                />
                                All Users
                              </label>
                            </div>
                            <hr style={{ margin: '4px 0' }} />
                            {menu}
                          </>
                        )}
                      >
                        {availableUsers.map((u) => (
                          <Select.Option key={u._id} value={u._id}>
                            {u.name}
                          </Select.Option>
                        ))}
                      </Select>
                      <small className="text-muted d-block mt-1">Selected: {selectedUserNames}</small>
                    </div>
                  )}
                  {(decoded?.role === 'teacher' || decoded?.role === 'student') && (
                    <>
                      <div className="mb-3 me-2">
                        <Select
                          mode="multiple"
                          style={{ width: 200 }}
                          placeholder="Filter by Class"
                          value={selectedClasses}
                          onChange={(values) => handleSelectionChange('classes', values)}
                          allowClear
                          showSearch
                          optionFilterProp="children"
                          dropdownRender={(menu) => (
                            <>
                              <div style={{ padding: '8px' }}>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={selectAllClasses}
                                    onChange={() => handleSelectAll('classes')}
                                    style={{ marginRight: '8px' }}
                                  />
                                  All Classes
                                </label>
                              </div>
                              <hr style={{ margin: '4px 0' }} />
                              {menu}
                            </>
                          )}
                        >
                          {availableClasses.map((cls) => (
                            <Select.Option key={cls._id} value={cls._id}>
                              {cls.name}
                            </Select.Option>
                          ))}
                        </Select>
                        <small className="text-muted d-block mt-1">Selected: {selectedClassNames}</small>
                      </div>
                      <div className="mb-3 me-2">
                        <Select
                          mode="multiple"
                          style={{ width: 200 }}
                          placeholder="Filter by Student"
                          value={selectedStudents}
                          onChange={(values) => handleSelectionChange('students', values)}
                          allowClear
                          showSearch
                          optionFilterProp="children"
                          dropdownRender={(menu) => (
                            <>
                              <div style={{ padding: '8px' }}>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={selectAllStudents}
                                    onChange={() => handleSelectAll('students')}
                                    style={{ marginRight: '8px' }}
                                  />
                                  All Students
                                </label>
                              </div>
                              <hr style={{ margin: '4px 0' }} />
                              {menu}
                            </>
                          )}
                        >
                          {availableStudents.map((student) => (
                            <Select.Option key={student._id} value={student._id}>
                              {student.name}
                            </Select.Option>
                          ))}
                        </Select>
                        <small className="text-muted d-block mt-1">Selected: {selectedStudentNames}</small>
                      </div>
                    </>
                  )}
                </>
              )}
            </Space>
          </div>
          <div className="card-body py-3">
            <Table
              columns={columns}
              dataSource={filteredMessages}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'No messages found' }}
            />
          </div>
        </div>
      </div>

      <Modal
        title={selectedMessage?.subject || 'Message Details'}
        open={!!selectedMessage}
        onCancel={() => setSelectedMessage(null)}
        footer={null}
      >
        {selectedMessage && (
          <div>
            <div className="mb-3">
              <p>{selectedMessage.message}</p>
            </div>
            <div className="mb-3">
              <div className="bg-light p-3 pb-2 rounded">
                <label className="form-label">Attachment</label>
                <p className="text-primary">{selectedMessage.attachment || 'No attachment'}</p>
              </div>
            </div>
            <div className="border-top pt-3">
              <div className="d-flex align-items-center flex-wrap">
                <div className="d-flex align-items-center me-4 mb-3">
                  <span className="avatar avatar-sm bg-light me-1">
                    <i className="ti ti-user text-default fs-14" />
                  </span>
                  From: {selectedMessage.sender?.name || 'Unknown'} ({selectedMessage.sender?.role || 'N/A'})
                </div>
                <div className="d-flex align-items-center me-4 mb-3">
                  <span className="avatar avatar-sm bg-light me-1">
                    <i className="ti ti-calendar text-default fs-14" />
                  </span>
                  Sent on: {new Date(selectedMessage.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceiveMessages;