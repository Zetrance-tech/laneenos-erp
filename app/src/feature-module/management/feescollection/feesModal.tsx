import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
interface FeesGroup {
  _id: string;
  name: string;
  periodicity: "Monthly" | "Quarterly" | "Yearly" | "One Time";
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

const API_URL = process.env.REACT_APP_URL;

interface FeesModalProps {
  feesGroups: FeesGroup[];
  setFeesGroups: React.Dispatch<React.SetStateAction<FeesGroup[]>>;
  showAddModal: boolean;
  setShowAddModal: React.Dispatch<React.SetStateAction<boolean>>;
  editModalId: string | null;
  setEditModalId: React.Dispatch<React.SetStateAction<string | null>>;
  deleteModalId: string | null;
  setDeleteModalId: React.Dispatch<React.SetStateAction<string | null>>;
}

const FeesModal: React.FC<FeesModalProps> = ({
  feesGroups,
  setFeesGroups,
  showAddModal,
  setShowAddModal,
  editModalId,
  setEditModalId,
  deleteModalId,
  setDeleteModalId,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    periodicity: "Monthly" as "Monthly" | "Quarterly" | "Yearly" | "One Time",
    status: "Active" as "Active" | "Inactive",
  });
  const [editFormData, setEditFormData] = useState<Record<string, Partial<FeesGroup>>>({});
  const [showAddFeesGroupModal, setShowAddFeesGroupModal] = useState(false);
  const {token} = useAuth();
  
  const periodicityOptions = [
    { value: "Monthly", label: "Monthly" },
    { value: "Quarterly", label: "Quarterly" },
    { value: "Yearly", label: "Yearly" },
    { value: "One Time", label: "One Time" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    id: string
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [id]: { ...prev[id], [name]: value },
    }));
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.checked ? "Active" : "Inactive",
    }));
  };

  const handleEditToggleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string
  ) => {
    setEditFormData((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: e.target.checked ? "Active" : "Inactive" },
    }));
  };

  const handleAddFeesGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post<FeesGroup>(
        `${API_URL}/api/feesGroup`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFeesGroups((prev) => [...prev, response.data]);
      console.log(formData)
      setFormData({
        name: "",
        periodicity: "Monthly",
        status: "Active",
      });
      toast.success("Fees Group added successfully");
      setShowAddModal(false);
      setShowAddFeesGroupModal(false);
    } catch (error:any) {
  console.error("Error adding fees group:", error.response?.data || error.message);
  toast.error(`Error adding fees group: ${error.response?.data?.message || error.message}`);
}
  };

  const handleEditFeesGroup = async (
    e: React.FormEvent<HTMLFormElement>,
    id: string
  ) => {
    e.preventDefault();
    try {
      const response = await axios.put<FeesGroup>(
        `${API_URL}/api/feesGroup/${id}`,
        editFormData[id] || {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFeesGroups((prev) =>
        prev.map((group) => (group._id === id ? response.data : group))
      );
      toast.success("Fees Group updated successfully");
      setEditModalId(null);
    } catch (error) {
      console.error("Error updating fees group:", (error as Error).message);
      toast.error("Error updating fees group");
    }
  };

  const handleDeleteFeesGroup = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/feesGroup/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFeesGroups((prev) => prev.filter((group) => group._id !== id));
      toast.success("Fees Group deleted successfully");
      setDeleteModalId(null);
    } catch (error) {
      console.error("Error deleting fees group:", (error as Error).message);
      toast.error("Error deleting fees group");
    }
  };

  const isFeesGroupPage = window.location.pathname.includes("/fees-group");

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      {/* Add Fees Group Modal */}
      <Modal
        show={showAddModal && isFeesGroupPage}
        onHide={() => setShowAddModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Fees Group</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleAddFeesGroup}>
          <Modal.Body>
            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter Name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Periodicity</label>
                  <select
                    className="form-select"
                    name="periodicity"
                    value={formData.periodicity}
                    onChange={handleInputChange}
                    required
                  >
                    {periodicityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="status-title">
                    <h5>Status</h5>
                    <p>Change the Status by toggle</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={formData.status === "Active"}
                      onChange={handleToggleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="light"
              className="me-3 border border-gray-300 hover:bg-gray-100"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Fees Group
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Nested Add Fees Group Modal */}
      <Modal
        show={showAddFeesGroupModal}
        onHide={() => setShowAddFeesGroupModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Fees Group</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleAddFeesGroup}>
          <Modal.Body>
            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter Name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Periodicity</label>
                  <select
                    className="form-select"
                    name="periodicity"
                    value={formData.periodicity}
                    onChange={handleInputChange}
                    required
                  >
                    {periodicityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="status-title">
                    <h5>Status</h5>
                    <p>Change the Status by toggle</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={formData.status === "Active"}
                      onChange={handleToggleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="light"
              className="me-3 border border-gray-300 hover:bg-gray-100"
              onClick={() => setShowAddFeesGroupModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Fees Group
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Edit Fees Group Modals */}
      {feesGroups.map((group) => (
        <React.Fragment key={group._id}>
          <Modal
            show={editModalId === group._id && isFeesGroupPage}
            onHide={() => setEditModalId(null)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Edit Fees Group</Modal.Title>
            </Modal.Header>
            <form onSubmit={(e) => handleEditFeesGroup(e, group._id)}>
              <Modal.Body>
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Fees Group</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={
                          editFormData[group._id]?.name !== undefined
                            ? editFormData[group._id].name
                            : group.name
                        }
                        onChange={(e) => handleEditInputChange(e, group._id)}
                        placeholder="Enter Fees Group"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Periodicity</label>
                      <select
                        className="form-select"
                        name="periodicity"
                        value={
                          editFormData[group._id]?.periodicity !== undefined
                            ? editFormData[group._id].periodicity
                            : group.periodicity
                        }
                        onChange={(e) => handleEditInputChange(e, group._id)}
                        required
                      >
                        {periodicityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="status-title">
                        <h5>Status</h5>
                        <p>Change the Status by toggle</p>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={
                            editFormData[group._id]?.status !== undefined
                              ? editFormData[group._id].status === "Active"
                              : group.status === "Active"
                          }
                          onChange={(e) => handleEditToggleChange(e, group._id)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="light"
                  className="me-3 border border-gray-300 hover:bg-gray-100"
                  onClick={() => setEditModalId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </Button>
              </Modal.Footer>
            </form>
          </Modal>

          <Modal
            show={deleteModalId === group._id && isFeesGroupPage}
            onHide={() => setDeleteModalId(null)}
            centered
          >
            <Modal.Body className="text-center">
              <span className="delete-icon">
                <i className="ti ti-trash-x" />
              </span>
              <h4>Confirm Deletion</h4>
              <p>
                Are you sure you want to delete "{group.name}"? This action cannot
                be undone.
              </p>
              <div className="d-flex justify-content-center">
                <Button
                  variant="light"
                  className="me-3 border border-gray-300 hover:bg-gray-100"
                  onClick={() => setDeleteModalId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handleDeleteFeesGroup(group._id)}
                >
                  Yes, Delete
                </Button>
              </div>
            </Modal.Body>
          </Modal>
        </React.Fragment>
      ))}
    </>
  );
};

export default FeesModal;