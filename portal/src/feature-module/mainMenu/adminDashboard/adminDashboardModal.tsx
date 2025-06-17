import React, { useState, ChangeEvent, FormEvent } from 'react';
import { all_routes } from '../../router/all_routes';
import { Link } from 'react-router-dom';
import Select, { SingleValue } from 'react-select';
import axios from 'axios';
import apiService from '../../../api/main';
// Define interfaces
interface FormData {
  eventFor: 'All' | 'Students' | 'Staffs';
  eventTitle: string;
  eventCategory: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  attachment: File | null;
}
const API_URL = process.env.REACT_APP_URL;

interface SelectOption {
  value: string;
  label: string;
}

const AdminDashboardModal: React.FC = () => {
  const routes = all_routes;
  const [activeContent, setActiveContent] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    eventFor: 'All',
    eventTitle: '',
    eventCategory: '',
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    attachment: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Select options
  const eventoption: SelectOption[] = [
    { value: "Select", label: "Select" },
    { value: "Celebration", label: "Celebration" },
    { value: "Training", label: "Training" },
    { value: "Meeting", label: "Meeting" },
    { value: "Holidays", label: "Holidays" },
  ];

  const handleContentChange = (event: ChangeEvent<HTMLInputElement>) => {
    setActiveContent(event.target.value);
    setFormData({ 
      ...formData, 
      eventFor: event.target.id === 'all' ? 'All' : 
                event.target.id === 'all-student' ? 'Students' : 'Staffs' 
    });
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 4 * 1024 * 1024 && file.type === 'application/pdf') {
      setFormData({ ...formData, attachment: file });
      setError(null);
    } else {
      setError('File must be PDF ivand less than 4MB');
    }
  };

  const handleSelectChange = (selected: SingleValue<SelectOption>) => {
    if (selected) {
      setFormData({ ...formData, eventCategory: selected.value });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted');
    console.log('Form data before formatting:', formData);
  
    setLoading(true);
    setError(null);
  
    try {
      // Format dates and times
      const formattedStartDate = formData.startDate 
        ? new Date(`${formData.startDate}T${formData.startTime}:00.000Z`).toISOString()
        : null;
  
      const formattedEndDate = formData.endDate 
        ? new Date(`${formData.endDate}T${formData.endTime}:00.000Z`).toISOString()
        : null;
  
      const formattedData = {
        ...formData,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        attachment: undefined, // Explicitly set attachment to undefined since we're not handling files
      };
  
      console.log('Formatted data before sending:', formattedData);
  
      // Send data as JSON
      const response = await axios.post(`${API_URL}/api/events/add`, formattedData, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      console.log('Response from backend:', response.data);
  
      if (response.status === 201) {
        setFormData({
          eventFor: 'All',
          eventTitle: '',
          eventCategory: '',
          startDate: null,
          endDate: null,
          startTime: null,
          endTime: null,
          attachment: null,
        });
        const modal = document.getElementById('add_event');
        if (modal) {
          modal.classList.remove('show');
          console.log('Modal closed');
        }
      }
    } catch (err: any) {
      console.error('Error during submission:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Error creating event');
    } finally {
      setLoading(false);
      console.log('Submission attempt completed');
    }
  };

  return (
    <>
      <div className="modal fade" id="add_event">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">New Event</h4>
              <button 
                type="button" 
                className="btn-close custom-btn-close" 
                data-bs-dismiss="modal"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="row">
                  <div className="col-md-12">
                    <div>
                      <label className="form-label">Event For</label>
                      <div className="d-flex align-items-center flex-wrap">
                        <div className="form-check me-3 mb-3">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="event"
                            id="all"
                            value=""
                            checked={activeContent === ''}
                            onChange={handleContentChange}
                          />
                          <label className="form-check-label" htmlFor="all">All</label>
                        </div>
                        <div className="form-check me-3 mb-3">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="event"
                            id="all-student"
                            value="all-student"
                            onChange={handleContentChange}
                          />
                          <label className="form-check-label" htmlFor="all-student">Students</label>
                        </div>
                        <div className="form-check me-3 mb-3">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="event"
                            id="all-staffs"
                            value="all-staffs"
                            onChange={handleContentChange}
                          />
                          <label className="form-check-label" htmlFor="all-staffs">Staffs</label>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Event Title</label>
                      <input
                        type="text"
                        className="form-control"
                        name="eventTitle"
                        value={formData.eventTitle}
                        onChange={handleInputChange}
                        placeholder="Enter Title"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Event Category</label>
                      <Select
                        classNamePrefix="react-select"
                        className="select"
                        options={eventoption}
                        onChange={handleSelectChange}
                        defaultValue={eventoption[0]}
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Start Date</label>
                          <input
                            type="date"
                            className="form-control"
                            name="startDate"
                            value={formData.startDate || ''}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">End Date</label>
                          <input
                            type="date"
                            className="form-control"
                            name="endDate"
                            value={formData.endDate || ''}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Start Time</label>
                          <input
                            type="time"
                            className="form-control"
                            name="startTime"
                            value={formData.startTime || ''}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">End Time</label>
                          <input
                            type="time"
                            className="form-control"
                            name="endTime"
                            value={formData.endTime || ''}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="bg-light p-3 pb-2 rounded">
                        <div className="mb-3">
                          <label className="form-label">Attachment</label>
                          <p>Upload size of 4MB, Accepted Format PDF</p>
                        </div>
                        <div className="d-flex align-items-center flex-wrap">
                          <div className="btn btn-primary drag-upload-btn mb-2 me-2">
                            <i className="ti ti-file-upload me-1" />Upload
                            <input
                              type="file"
                              className="form-control image_sign"
                              onChange={handleFileChange}
                              accept=".pdf"
                            />
                          </div>
                          {formData.attachment && <p className="mb-2">{formData.attachment.name}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Link to="#" className="btn btn-light me-2" data-bs-dismiss="modal">
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardModal;