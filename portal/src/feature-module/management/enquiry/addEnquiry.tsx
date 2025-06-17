import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { all_routes } from "../../router/all_routes";
import {
  cast,
  gender,
  religion,
  bloodGroup,
} from "../../../core/common/selectoption/selectoption";
import CommonSelect from "../../../core/common/commonSelect";
import axios, { AxiosError } from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
interface Option {
  value: string;
  label: string;
  sessionId?: string;
}

interface EnquiryFormData {
  status: "enquiry generated" | "in process" | "admission taken";
  sessionId: string;
  classId?: string;
  name: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  bloodGroup: string;
  religion: string;
  category: string;
  fatherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
  };
  motherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
  };
  guardianInfo: {
    name: string;
    relation: string;
    phoneNumber: string;
    email: string;
    occupation: string;
  };
  currentAddress: string;
  permanentAddress: string;
  remark: string;
}

const API_URL = process.env.REACT_APP_URL;

const statusOptions: Option[] = [
  { value: "enquiry generated", label: "Enquiry Generated" },
  { value: "in process", label: "In Process" },
  { value: "admission taken", label: "Admission Taken" },
];

const AddEnquiry = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const routes = all_routes;
  const { token, user } = useAuth();
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isView, setIsView] = useState<boolean>(false);
  const [sessions, setSessions] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Option[]>([]);

  const [formData, setFormData] = useState<EnquiryFormData>({
    status: "enquiry generated",
    sessionId: "",
    classId: undefined,
    name: "",
    dateOfBirth: "",
    gender: "male",
    bloodGroup: "",
    religion: "",
    category: "",
    fatherInfo: { name: "", email: "", phoneNumber: "", occupation: "" },
    motherInfo: { name: "", email: "", phoneNumber: "", occupation: "" },
    guardianInfo: { name: "", relation: "", phoneNumber: "", email: "", occupation: "" },
    currentAddress: "",
    permanentAddress: "",
    remark: "",
  });

  const calculateAge = (dob: string): string => {
    if (!dob) return "";
    const birthDate = dayjs(dob, "DD-MM-YYYY");
    if (!birthDate.isValid()) return "";
    const today = dayjs();
    const years = today.diff(birthDate, "year");
    const adjustedBirthDate = birthDate.add(years, "year");
    const months = today.diff(adjustedBirthDate, "month");
    return `${years} years ${months} months`;
  };

  // Fetch sessions, classes, and enquiry data
  useEffect(() => {
    // Fetch sessions
    axios
      .get(`${API_URL}/api/session/get`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSessions(res.data.map((s: any) => ({ value: s._id, label: s.name })));
      })
      .catch((err) => {
        console.error("Error fetching sessions:", err);
        toast.error("Failed to fetch sessions");
      });

    // Fetch classes
    axios
      .get(`${API_URL}/api/class`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setClasses(
          res.data.map((c: any) => ({
            value: c._id,
            label: c.name,
            sessionId: c.sessionId,
          }))
        );
      })
      .catch((err) => {
        console.error("Error fetching classes:", err);
        toast.error("Failed to fetch classes");
      });

    // Fetch enquiry data for editing or viewing
    if (id) {
      const isViewMode = window.location.pathname.includes("view");
      setIsEdit(!isViewMode);
      setIsView(isViewMode);
      axios
        .get(`${API_URL}/api/enquiry/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const enquiry = res.data;
          setFormData({
            status: enquiry.status,
            sessionId: enquiry.sessionId || "",
            classId: enquiry.classId || undefined,
            name: enquiry.name,
            dateOfBirth: enquiry.dateOfBirth ? dayjs(enquiry.dateOfBirth).format("DD-MM-YYYY") : "",
            gender: enquiry.gender,
            bloodGroup: enquiry.bloodGroup || "",
            religion: enquiry.religion || "",
            category: enquiry.category || "",
            fatherInfo: enquiry.fatherInfo || formData.fatherInfo,
            motherInfo: enquiry.motherInfo || formData.motherInfo,
            guardianInfo: enquiry.guardianInfo || formData.guardianInfo,
            currentAddress: enquiry.currentAddress || "",
            permanentAddress: enquiry.permanentAddress || "",
            remark: enquiry.remark || "",
          });
        })
        .catch((err) => {
          console.error("Error fetching enquiry:", err);
          toast.error("Failed to fetch enquiry");
        });
    }
  }, [id]);

  // Filter classes based on session
  useEffect(() => {
    if (formData.sessionId) {
      const filtered = classes.filter(
        (c: any) => c.sessionId === formData.sessionId || c.sessionId?._id === formData.sessionId
      );
      setFilteredClasses([{ value: "", label: "None" }, ...filtered]);
      if (formData.classId && !filtered.some((c) => c.value === formData.classId)) {
        setFormData((prev) => ({ ...prev, classId: undefined }));
      }
    } else {
      setFilteredClasses([{ value: "", label: "None" }]);
      setFormData((prev) => ({ ...prev, classId: undefined }));
    }
  }, [formData.sessionId, classes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (section: keyof EnquiryFormData, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const errors: string[] = [];
    if (!formData.sessionId) errors.push("Session is required");
    if (!formData.name) errors.push("Name is required");
    if (!formData.dateOfBirth) errors.push("Date of Birth is required");
    if (!formData.gender) errors.push("Gender is required");

    if (errors.length > 0) {
      toast.error(errors.join(", "));
      return;
    }

    // Validate date format
    const dateOfBirthISO = formData.dateOfBirth
      ? dayjs(formData.dateOfBirth, "DD-MM-YYYY").format("YYYY-MM-DD")
      : "";

    if (!dayjs(dateOfBirthISO).isValid()) {
      toast.error("Invalid Date of Birth format");
      return;
    }

    const updatedFormData = {
      status: formData.status.toLowerCase(),
      sessionId: formData.sessionId,
      classId: formData.classId,
      name: formData.name,
      dateOfBirth: dateOfBirthISO,
      gender: formData.gender.toLowerCase(),
      bloodGroup: formData.bloodGroup,
      religion: formData.religion,
      category: formData.category,
      fatherInfo: formData.fatherInfo,
      motherInfo: formData.motherInfo,
      guardianInfo: formData.guardianInfo,
      currentAddress: formData.currentAddress,
      permanentAddress: formData.permanentAddress,
      remark: formData.remark,
    };

    try {
      const url = isEdit
        ? `${API_URL}/api/enquiry/${id}`
        : `${API_URL}/api/enquiry/create`;
      const method = isEdit ? "put" : "post";

      const response = await axios({
        method,
        url,
        data: updatedFormData,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      toast.success(`${isEdit ? "Enquiry updated" : "Enquiry added"} successfully!`);

      if (!isEdit) {
        setFormData({
          status: "enquiry generated",
          sessionId: "",
          classId: undefined,
          name: "",
          dateOfBirth: "",
          gender: "male",
          bloodGroup: "",
          religion: "",
          category: "",
          fatherInfo: { name: "", email: "", phoneNumber: "", occupation: "" },
          motherInfo: { name: "", email: "", phoneNumber: "", occupation: "" },
          guardianInfo: { name: "", relation: "", phoneNumber: "", email: "", occupation: "" },
          currentAddress: "",
          permanentAddress: "",
          remark: "",
        });
      }

      navigate(routes.enquiryList);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Submit error:", axiosError.response?.data || axiosError.message);
      toast.error(
        "Failed to submit enquiry: " +
          (axiosError.response?.data?.message || axiosError.message || "Unknown error")
      );
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this enquiry?")) return;

    try {
      await axios.delete(`${API_URL}/api/enquiry/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Enquiry deleted successfully!");
      navigate(routes.enquiryList);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Delete error:", axiosError.response?.data || axiosError.message);
      toast.error(
        "Failed to delete enquiry: " +
          (axiosError.response?.data?.message || axiosError.message || "Unknown error")
      );
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="page-wrapper">
        <div className="content content-two">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="mb-1">{isView ? "View Enquiry" : isEdit ? "Edit Enquiry" : "Add Enquiry"}</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to={routes.enquiryList}>Enquiries</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {isView ? "View Enquiry" : isEdit ? "Edit Enquiry" : "Add Enquiry"}
                  </li>
                </ol>
              </nav>
            </div>
            {isEdit && (
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete Enquiry
              </button>
            )}
          </div>

          <div className="row">
            <div className="col-md-12">
              <form onSubmit={handleSubmit}>
                <div className="card">
                  <div className="card-header bg-light">
                    <h4 className="text-dark">Account Information</h4>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row row-cols-xxl-5 row-cols-md-6">
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Session <span className="text-danger">*</span>
                          </label>
                          <CommonSelect
                            className="select"
                            options={sessions}
                            defaultValue={
                              formData.sessionId
                                ? sessions.find((s) => s.value === formData.sessionId)
                                : undefined
                            }
                            onChange={(option: Option | null) =>
                              setFormData((prev) => ({
                                ...prev,
                                sessionId: option?.value || "",
                              }))
                            }
                            // disabled={isView}
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Class</label>
                          <CommonSelect
                            className="select"
                            options={filteredClasses}
                            defaultValue={
                              filteredClasses.find((c) => c.value === formData.classId) || {
                                value: "",
                                label: "None",
                              }
                            }
                            onChange={(option: Option | null) =>
                              setFormData((prev) => ({
                                ...prev,
                                classId: option?.value || undefined,
                              }))
                            }
                            // disabled={isView}
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <CommonSelect
                            className="select"
                            options={statusOptions}
                            defaultValue={statusOptions.find((item) => item.value === formData.status)}
                            onChange={(option: Option | null) =>
                              setFormData((prev) => ({
                                ...prev,
                                status: (option?.value as "enquiry generated" | "in process" | "admission taken") || "enquiry generated",
                              }))
                            }
                            // disabled={isView}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header bg-light">
                    <h4 className="text-dark">Personal Information</h4>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row row-cols-xxl-5 row-cols-md-6">
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            disabled={isView}
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Date of Birth <span className="text-danger">*</span>
                          </label>
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
                            disabled={isView}
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Age</label>
                          <input
                            type="text"
                            className="form-control"
                            value={calculateAge(formData.dateOfBirth) || ""}
                            readOnly
                            placeholder="Age"
                            disabled
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Gender <span className="text-danger">*</span>
                          </label>
                          <CommonSelect
                            className="select"
                            options={gender}
                            defaultValue={gender.find((gen) => gen.value === formData.gender)}
                            onChange={(option: Option | null) =>
                              setFormData((prev) => ({
                                ...prev,
                                gender: (option?.value as "male" | "female" | "other") || "male",
                              }))
                            }
                            // disabled={isView}
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Blood Group</label>
                          <CommonSelect
                            className="select"
                            options={bloodGroup}
                            defaultValue={
                              formData.bloodGroup
                                ? bloodGroup.find((bg) => bg.value === formData.bloodGroup)
                                : undefined
                            }
                            onChange={(option: Option | null) =>
                              setFormData((prev) => ({
                                ...prev,
                                bloodGroup: option?.value || "",
                              }))
                            }
                            // disabled={isView}
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Religion</label>
                          <CommonSelect
                            className="select"
                            options={religion}
                            defaultValue={
                              formData.religion
                                ? religion.find((rel) => rel.value === formData.religion)
                                : undefined
                            }
                            onChange={(option: Option | null) =>
                              setFormData((prev) => ({
                                ...prev,
                                religion: option?.value || "",
                              }))
                            }
                            // disabled={isView}
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Category</label>
                          <CommonSelect
                            className="select"
                            options={cast}
                            defaultValue={
                              formData.category
                                ? cast.find((c) => c.value === formData.category)
                                : undefined
                            }
                            onChange={(option: Option | null) =>
                              setFormData((prev) => ({
                                ...prev,
                                category: option?.value || "",
                              }))
                            }
                            // disabled={isView}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header bg-light">
                    <h4 className="text-dark">Parents & Guardian Information</h4>
                  </div>
                  <div className="card-body pb-0">
                    <div className="border-bottom mb-3">
                      <h5 className="mb-3">Father’s Info</h5>
                      <div className="row">
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Father Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.fatherInfo.name}
                              onChange={(e) => handleNestedChange("fatherInfo", "name", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input
                              type="email"
                              className="form-control"
                              value={formData.fatherInfo.email}
                              onChange={(e) => handleNestedChange("fatherInfo", "email", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Phone Number</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.fatherInfo.phoneNumber}
                              onChange={(e) => handleNestedChange("fatherInfo", "phoneNumber", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Occupation</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.fatherInfo.occupation}
                              onChange={(e) => handleNestedChange("fatherInfo", "occupation", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border-bottom mb-3">
                      <h5 className="mb-3">Mother’s Info</h5>
                      <div className="row">
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Mother Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.motherInfo.name}
                              onChange={(e) => handleNestedChange("motherInfo", "name", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input
                              type="email"
                              className="form-control"
                              value={formData.motherInfo.email}
                              onChange={(e) => handleNestedChange("motherInfo", "email", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Phone Number</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.motherInfo.phoneNumber}
                              onChange={(e) => handleNestedChange("motherInfo", "phoneNumber", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Occupation</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.motherInfo.occupation}
                              onChange={(e) => handleNestedChange("motherInfo", "occupation", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="mb-3">Guardian Details</h5>
                      <div className="row">
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Guardian Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.guardianInfo.name}
                              onChange={(e) => handleNestedChange("guardianInfo", "name", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Relation</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.guardianInfo.relation}
                              onChange={(e) => handleNestedChange("guardianInfo", "relation", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Phone Number</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.guardianInfo.phoneNumber}
                              onChange={(e) => handleNestedChange("guardianInfo", "phoneNumber", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input
                              type="email"
                              className="form-control"
                              value={formData.guardianInfo.email}
                              onChange={(e) => handleNestedChange("guardianInfo", "email", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Occupation</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.guardianInfo.occupation}
                              onChange={(e) => handleNestedChange("guardianInfo", "occupation", e.target.value)}
                              disabled={isView}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header bg-light">
                    <h4 className="text-dark">Address</h4>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Current Address</label>
                          <input
                            type="text"
                            className="form-control"
                            name="currentAddress"
                            value={formData.currentAddress}
                            onChange={handleInputChange}
                            disabled={isView}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Permanent Address</label>
                          <input
                            type="text"
                            className="form-control"
                            name="permanentAddress"
                            value={formData.permanentAddress}
                            onChange={handleInputChange}
                            disabled={isView}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header bg-light">
                    <h4 className="text-dark">Remark</h4>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Remark</label>
                          <textarea
                            className="form-control"
                            name="remark"
                            value={formData.remark}
                            onChange={handleInputChange}
                            rows={4}
                            disabled={isView}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {!isView && (
                  <div className="text-end">
                    <button type="button" className="btn btn-light me-3" onClick={() => navigate(routes.enquiryList)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {isEdit ? "Update Enquiry" : "Add Enquiry"}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddEnquiry;