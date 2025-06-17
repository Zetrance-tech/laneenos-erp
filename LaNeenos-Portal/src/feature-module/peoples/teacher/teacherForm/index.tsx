import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import axios from "axios";
import { all_routes } from "../../../router/all_routes";
import { Contract, Shift, gender } from "../../../../core/common/selectoption/selectoption";
import CommonSelect from "../../../../core/common/commonSelect";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
interface Option {
  value: string;
  label: string;
}

const roleOptions: Option[] = [
  { value: "teacher", label: "Teacher" },
  { value: "maid", label: "Maid" },
  { value: "accountant", label: "Accountant" },
  { value: "librarian", label: "Librarian" },
  { value: "admin", label: "Admin" },
];

const API_URL = process.env.REACT_APP_URL;

interface TeacherFormData {
  id: string;
  role: "teacher" | "maid" | "accountant" | "librarian" | "admin";
  name: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address: string;
  joiningDate: string;
  experienceYears: number;
  payroll: {
    epfNo: string;
    basicSalary: number;
  };
  contractType: "permanent" | "temporary" | "part-time" | "contract";
  workShift: "morning" | "afternoon" | "full-day" | "flexible";
  workLocation: string;
  dateOfLeaving: string | null;
  emergencyContact: string;
  documents: Array<{ name: string; file: File | null }>;
}

const TeacherForm: React.FC = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const initialFormData: TeacherFormData = {
    id: "",
    role: "teacher",
    name: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "male",
    address: "",
    joiningDate: "",
    experienceYears: 0,
    payroll: { epfNo: "", basicSalary: 0 },
    contractType: "permanent",
    workShift: "morning",
    workLocation: "",
    dateOfLeaving: null,
    emergencyContact: "",
    documents: [{ name: "", file: null }],
  };

  const [formData, setFormData] = useState<TeacherFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedTeacherId, setSubmittedTeacherId] = useState<string | null>(null);
  const [documentPreviews, setDocumentPreviews] = useState<Array<string | null>>([null]);
  const [nextStaffId, setNextStaffId] = useState<string>("");
  const [hasFetchedId, setHasFetchedId] = useState<boolean>(false);
  const {token} = useAuth();

  const fetchNextStaffId = async () => {
    console.log("fetchNextStaffId started");
    try {
      const res = await axios.get(`${API_URL}/api/teacher/next-id`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched next staff ID:", res.data.id);
      setNextStaffId(res.data.id);
      setFormData((prev) => ({ ...prev, id: res.data.id }));
      setHasFetchedId(true);
    } catch (error) {
      console.error("Error fetching next staff ID:", error);
      toast.error("Failed to fetch staff ID");
      setError("Failed to fetch staff ID");
    }
  };

  useEffect(() => {
    if (isEditMode && id) {
      const fetchTeacher = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${API_URL}/api/teacher/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const teacherData = response.data;
          setFormData({
            id: teacherData.id,
            role: teacherData.role || "teacher",
            name: teacherData.name || "",
            email: teacherData.email || "",
            phoneNumber: teacherData.phoneNumber || "",
            dateOfBirth: teacherData.dateOfBirth
              ? dayjs(teacherData.dateOfBirth).format("DD-MM-YYYY")
              : "",
            gender: teacherData.gender || "male",
            address: teacherData.address || "",
            joiningDate: teacherData.joiningDate
              ? dayjs(teacherData.joiningDate).format("DD-MM-YYYY")
              : "",
            experienceYears: teacherData.experienceYears || 0,
            payroll: {
              epfNo: teacherData.payroll?.epfNo || "",
              basicSalary: teacherData.payroll?.basicSalary || 0,
            },
            contractType: teacherData.contractType || "permanent",
            workShift: teacherData.workShift || "morning",
            workLocation: teacherData.workLocation || "",
            dateOfLeaving: teacherData.dateOfLeaving
              ? dayjs(teacherData.dateOfLeaving).format("DD-MM-YYYY")
              : null,
            emergencyContact: teacherData.emergencyContact || "",
            documents: teacherData.documents?.map((doc: any) => ({ name: doc.name, file: null })) || [{ name: "", file: null }],
          });
          setDocumentPreviews(teacherData.documents?.map(() => null) || [null]);
          setSubmittedTeacherId(id);
          setNextStaffId(teacherData.id);
        } catch (err) {
          setError("Failed to fetch teacher data");
          console.error("Error fetching teacher:", err);
          toast.error("Error fetching teacher");
        } finally {
          setLoading(false);
        }
      };
      fetchTeacher();
    } else if (!hasFetchedId) {
      fetchNextStaffId();
    }
  }, [id, isEditMode, hasFetchedId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (section: keyof TeacherFormData, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as object), [field]: value },
    }));
  };

  const handleDocumentChange = (index: number, field: "name" | "file", value: string | File | null) => {
    setFormData((prev) => {
      const newDocuments = [...prev.documents];
      newDocuments[index] = { ...newDocuments[index], [field]: value };
      return { ...prev, documents: newDocuments };
    });

    if (field === "file") {
      const file = value as File | null;
      setDocumentPreviews((prev) => {
        const newPreviews = [...prev];
        if (newPreviews[index]) {
          URL.revokeObjectURL(newPreviews[index]!);
        }
        newPreviews[index] = file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
        return newPreviews;
      });
    }
  };

  const addDocumentField = () => {
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, { name: "", file: null }],
    }));
    setDocumentPreviews((prev) => [...prev, null]);
  };

  const removeDocumentField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
    setDocumentPreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      if (prev[index]) {
        URL.revokeObjectURL(prev[index]!);
      }
      return newPreviews;
    });
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!formData.id) errors.push("Staff ID is required");
    if (!formData.role) errors.push("Role is required");
    if (!formData.name) errors.push("Full Name is required");
    if (!formData.email) errors.push("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) errors.push("Please enter a valid email");
    if (!formData.phoneNumber) errors.push("Phone Number is required");
    if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ""))) errors.push("Phone Number must be exactly 10 digits");
    if (!formData.dateOfBirth) errors.push("Date of Birth is required");
    if (!formData.joiningDate) errors.push("Joining Date is required");
    if (!formData.address) errors.push("Address is required");
    formData.documents.forEach((doc, index) => {
      if (doc.name && !doc.file) errors.push(`Document file for "${doc.name}" is required`);
      if (doc.file && !doc.name) errors.push(`Document name for file "${doc.file?.name}" is required`);
    });

    if (errors.length > 0) {
      setError(errors.join(", "));
      toast.error(errors.join(", "));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit started");
    if (!validateForm()) return;

    const documentsForBackend = formData.documents
      .filter((doc) => doc.name && doc.file)
      .map((doc) => ({
        name: doc.name,
        url: doc.file ? `placeholder/${doc.file.name}` : null,
      }));

    const payload = {
      id: formData.id,
      role: formData.role,
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      dateOfBirth: formData.dateOfBirth
        ? dayjs(formData.dateOfBirth, "DD-MM-YYYY").toISOString()
        : "",
      gender: formData.gender,
      address: formData.address,
      joiningDate: formData.joiningDate
        ? dayjs(formData.joiningDate, "DD-MM-YYYY").toISOString()
        : "",
      experienceYears: Number(formData.experienceYears),
      payroll: {
        epfNo: formData.payroll.epfNo,
        basicSalary: Number(formData.payroll.basicSalary),
      },
      contractType: formData.contractType,
      workShift: formData.workShift,
      workLocation: formData.workLocation,
      dateOfLeaving: formData.dateOfLeaving
        ? dayjs(formData.dateOfLeaving, "DD-MM-YYYY").toISOString()
        : null,
      emergencyContact: formData.emergencyContact,
      documents: documentsForBackend,
    };

    try {
      setLoading(true);
      setError(null);

      if (isEditMode) {
        const response = await axios.put(`${API_URL}/api/teacher/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Updated teacher:", response.data);
        toast.success("Updated teacher Successfully");
        setSubmittedTeacherId(id);
      } else {
        const response = await axios.post(`${API_URL}/api/teacher/create`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Created teacher:", response.data);
        toast.success("Added teacher Successfully");
        setSubmittedTeacherId(response.data.teacher.id);

        setFormData({
          id: "",
          role: "teacher",
          name: "",
          email: "",
          phoneNumber: "",
          dateOfBirth: "",
          gender: "male",
          address: "",
          joiningDate: "",
          experienceYears: 0,
          payroll: { epfNo: "", basicSalary: 0 },
          contractType: "permanent",
          workShift: "morning",
          workLocation: "",
          dateOfLeaving: null,
          emergencyContact: "",
          documents: [{ name: "", file: null }],
        });
        setDocumentPreviews([null]);
        setNextStaffId("");
        setHasFetchedId(false);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || `Failed to ${isEditMode ? "update" : "add"} teacher`);
      console.error("Error:", error);
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? "update" : "add"} teacher`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      documentPreviews.forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [documentPreviews]);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="page-wrapper">
        <div className="content content-two">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="mb-1">{isEditMode ? "Edit Staff" : "Add Staff"}</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to={routes.teacherList}>Teacher</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {isEditMode ? "Edit Teacher" : "Add Staff"}
                  </li>
                </ol>
              </nav>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <p>{isEditMode ? "Loading teacher data..." : "Saving..."}</p>}

          {!loading && (
            <div className="row">
              <div className="col-md-12">
                <form onSubmit={handleSubmit}>
                  <div className="card">
                    <div className="card-header bg-light">
                      <h4 className="text-dark">Personal Information</h4>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row row-cols-xxl-5 row-cols-md-6">
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Role *</label>
                            <CommonSelect
                              className="select"
                              options={roleOptions}
                              defaultValue={roleOptions.find((r) => r.value === formData.role)}
                              onChange={(option) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  role: (option?.value as "teacher" | "maid" | "accountant" | "librarian" | "admin") || "teacher",
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Staff ID *</label>
                            <input
                              type="text"
                              className="form-control"
                              name="id"
                              value={isEditMode ? formData.id : (nextStaffId || "Fetching ID...")}
                              readOnly
                              disabled
                              required
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Full Name *</label>
                            <input
                              type="text"
                              className="form-control"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Email *</label>
                            <input
                              type="email"
                              className="form-control"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Phone Number *</label>
                            <input
                              type="text"
                              className="form-control"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleInputChange}
                              required
                              placeholder="e.g., 1234567890"
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Date of Birth *</label>
                            <DatePicker
                              className="form-control datetimepicker"
                              format="DD-MM-YYYY"
                              value={formData.dateOfBirth ? dayjs(formData.dateOfBirth, "DD-MM-YYYY") : null}
                              onChange={(date) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  dateOfBirth: date ? date.format("DD-MM-YYYY") : "",
                                }))
                              }
                              placeholder="Select Date"
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Gender *</label>
                            <CommonSelect
                              className="select"
                              options={gender}
                              defaultValue={gender.find((g) => g.value === formData.gender)}
                              onChange={(option) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  gender: (option?.value as "male" | "female" | "other") || "male",
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Address *</label>
                            <input
                              type="text"
                              className="form-control"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Emergency Contact Phone</label>
                            <input
                              type="text"
                              className="form-control"
                              name="emergencyContact"
                              value={formData.emergencyContact}
                              onChange={handleInputChange}
                              placeholder="e.g., 1234567890"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header bg-light">
                      <h4 className="text-dark">Professional Details</h4>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row row-cols-xxl-5 row-cols-md-6">
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Joining Date *</label>
                            <DatePicker
                              className="form-control datetimepicker"
                              format="DD-MM-YYYY"
                              value={formData.joiningDate ? dayjs(formData.joiningDate, "DD-MM-YYYY") : null}
                              onChange={(date) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  joiningDate: date ? date.format("DD-MM-YYYY") : "",
                                }))
                              }
                              placeholder="Select Date"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Experience (Years)</label>
                            <input
                              type="number"
                              className="form-control"
                              name="experienceYears"
                              value={formData.experienceYears}
                              onChange={handleInputChange}
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                      <h4 className="text-dark">Documents</h4>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={addDocumentField}
                        title="Add Document"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row row-cols-xxl-5 row-cols-md-6">
                        {formData.documents.map((doc, index) => (
                          <div key={index} className="col-xxl col-xl-6 col-md-6 mb-3">
                            <div className="d-flex align-items-start">
                              <div className="flex-grow-1">
                                <div className="mb-2">
                                  <label className="form-label">Document Name</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={doc.name}
                                    onChange={(e) => handleDocumentChange(index, "name", e.target.value)}
                                    placeholder="e.g., Aadhar Card"
                                  />
                                </div>
                                <div className="mb-2">
                                  <label className="form-label">Document File</label>
                                  <input
                                    type="file"
                                    className="form-control"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleDocumentChange(index, "file", e.target.files?.[0] || null)}
                                  />
                                </div>
                                {doc.file && (
                                  <div className="mt-2">
                                    <small className="text-muted">Selected: {doc.file.name}</small>
                                    {documentPreviews[index] ? (
                                      <img
                                        src={documentPreviews[index]!}
                                        alt={`${doc.name} Preview`}
                                        style={{ maxWidth: "100px", height: "auto", display: "block", marginTop: "5px" }}
                                      />
                                    ) : (
                                      <small className="d-block text-muted mt-1">
                                        {doc.file.type.startsWith("application/pdf")
                                          ? "PDF selected (no preview available)"
                                          : "Preview not available"}
                                      </small>
                                    )}
                                  </div>
                                )}
                              </div>
                              {formData.documents.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger ms-2"
                                  onClick={() => removeDocumentField(index)}
                                  title="Remove Document"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header bg-light">
                      <h4 className="text-dark">Payroll</h4>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row row-cols-xxl-5 row-cols-md-6">
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">EPF No</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.payroll.epfNo}
                              onChange={(e) => handleNestedChange("payroll", "epfNo", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Basic Salary</label>
                            <input
                              type="number"
                              className="form-control"
                              value={formData.payroll.basicSalary}
                              onChange={(e) => handleNestedChange("payroll", "basicSalary", Number(e.target.value))}
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Contract Type</label>
                            <CommonSelect
                              className="select"
                              options={Contract}
                              defaultValue={Contract.find((c) => c.value === formData.contractType)}
                              onChange={(option) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  contractType: (option?.value as "permanent" | "temporary" | "part-time" | "contract") || "permanent",
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Work Shift</label>
                            <CommonSelect
                              className="select"
                              options={Shift}
                              defaultValue={Shift.find((s) => s.value === formData.workShift)}
                              onChange={(option) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  workShift: (option?.value as "morning" | "afternoon" | "full-day" | "flexible") || "morning",
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Work Location</label>
                            <input
                              type="text"
                              className="form-control"
                              name="workLocation"
                              value={formData.workLocation}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="col-xxl col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Date of Leaving</label>
                            <DatePicker
                              className="form-control datetimepicker"
                              format="DD-MM-YYYY"
                              value={formData.dateOfLeaving ? dayjs(formData.dateOfLeaving, "DD-MM-YYYY") : null}
                              onChange={(date) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  dateOfLeaving: date ? date.format("DD-MM-YYYY") : null,
                                }))
                              }
                              placeholder="Select Date"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-end mb-3">
                    <button
                      type="button"
                      className="btn btn-light me-3"
                      onClick={() => navigate(routes.teacherList)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? "Saving..." : isEditMode ? "Update Teacher" : "Add Staff"}
                    </button>
                  </div>

                  {(isEditMode || submittedTeacherId) && (
                    <div className="card">
                      <div className="card-header bg-light">
                        <h4 className="text-dark">Actions</h4>
                      </div>
                      <div className="card-body">
                        <div className="d-flex justify-content-start gap-3">
                          <Link
                            to={routes.teacherDetails.replace(":id", submittedTeacherId || id || "")}
                            className="btn btn-outline-primary"
                          >
                            <i className="ti ti-eye me-2" />
                            View Details
                          </Link>
                          <Link
                            to={routes.editTeacher.replace(":id", submittedTeacherId || id || "")}
                            className="btn btn-outline-primary"
                          >
                            <i className="ti ti-edit-circle me-2" />
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TeacherForm;