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
const SentMessages: React.FC = () => {
  const routes = all_routes;
  const actionDropdownRef = useRef<HTMLDivElement | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/messages/sent?userId=${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching sent messages:', error);
      toast.error('Failed to fetch sent messages');
    }
  };

  const handleMessageSelect = (messageId: string) => {
    setSelectedMessages((prev) => {
      const updated = prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId];
      setSelectAll(updated.length === messages.length);
      return updated;
    });
  };

  const handleSelectAllMessages = () => {
    setSelectedMessages(selectAll ? [] : messages.map((m) => m._id));
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) {
      toast.error('Please select at least one message to delete');
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/messages/delete`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          messageIds: selectedMessages,
        },
      });
      setMessages((prev) => prev.filter((m) => !selectedMessages.includes(m._id)));
      setSelectedMessages([]);
      setSelectAll(false);
      toast.success('Selected messages deleted successfully');
    } catch (error) {
      console.error('Error deleting messages:', error);
      toast.error('Failed to delete messages');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(event.target as Node)) {
        actionDropdownRef.current.classList.remove('show');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Sent Messages</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Sent Messages</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="mb-2">
              <Link to="#" className="btn btn-light me-2" onClick={fetchMessages}>Refresh</Link>
            </div>
            {selectedMessages.length > 0 && (
              <div className="dropdown mb-2" ref={actionDropdownRef}>
                <button className="btn btn-outline-light bg-white dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  Actions ({selectedMessages.length} selected)
                </button>
                <div className="dropdown-menu p-3">
                  <Link to="#" className="dropdown-item rounded-1" onClick={handleDeleteSelected}>
                    <i className="ti ti-trash-x me-2" /> Delete Selected
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h4 className="mb-0">Sent Messages</h4>
          </div>
          <div className="card-body p-0 py-3">
            {messages.length === 0 ? (
              <div className="p-3"><p>No messages found.</p></div>
            ) : (
              <div className="table-responsive">
                <table className="table table-borderless">
                  <thead>
                    <tr>
                      <th>
                        <div className="form-check">
                          <input type="checkbox" className="form-check-input" id="select-all-messages" checked={selectAll} onChange={handleSelectAllMessages} />
                          <label className="form-check-label" htmlFor="select-all-messages"></label>
                        </div>
                      </th>
                      <th>Subject</th>
                      <th>Users</th>
                      <th>Classes</th>
                      <th>Students</th>
                      <th>Sent On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((message) => (
                      <tr key={message._id}>
                        <td>
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`message-${message._id}`}
                              checked={selectedMessages.includes(message._id)}
                              onChange={() => handleMessageSelect(message._id)}
                            />
                            <label className="form-check-label" htmlFor={`message-${message._id}`}></label>
                          </div>
                        </td>
                        <td><Link to="#" data-bs-toggle="modal" data-bs-target={`#view_message_${message._id}`}>{message.subject}</Link></td>
                        <td>{message.recipients.users.map((u) => u.name).join(', ') || 'None'}</td>
                        <td>{message.recipients.classes.map((c) => c.name).join(', ') || 'None'}</td>
                        <td>{message.recipients.students.map((s) => s.name).join(', ') || 'None'}</td>
                        <td>{new Date(message.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {messages.map((message) => (
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
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Users</label>
                      <p>{message.recipients.users.map((u) => u.name).join(', ') || 'None'}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Classes</label>
                      <p>{message.recipients.classes.map((c) => c.name).join(', ') || 'None'}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Students</label>
                      <p>{message.recipients.students.map((s) => s.name).join(', ') || 'None'}</p>
                    </div>
                  </div>
                </div>
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
                      Sent by: {message.sender.name} ({message.sender.role})
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

export default SentMessages;