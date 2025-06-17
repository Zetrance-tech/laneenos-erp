// import React, { useEffect, useState } from "react";
// import { Link, useParams } from "react-router-dom";
// import { DatePicker } from "antd";
// import dayjs from "dayjs";
// import { all_routes } from "../../../router/all_routes";
// import {
//   bloodGroup,
//   cast,
//   gender,
//   PickupPoint,
//   religion,
//   route,
//   status,
//   VehicleNumber,
// } from "../../../../core/common/selectoption/selectoption";
// import { TagsInput } from "react-tag-input-component";
// import CommonSelect from "../../../../core/common/commonSelect";
// import axios, { AxiosError } from "axios";
// import toast, { Toaster } from "react-hot-toast";

// interface Option {
//   value: string;
//   label: string;
//   sessionId?: string;
// }

// interface FormData {
//   admissionNumber: string;
//   admissionDate: string;
//   status: "active" | "inactive";
//   sessionId: string;
//   classId?: string;
//   profileImage?: undefined;
//   name: string;
//   dateOfBirth: string;
//   age?: string;
//   gender: "male" | "female" | "other";
//   bloodGroup: string;
//   religion: string;
//   category: string;
//   fatherInfo: {
//     name: string;
//     email: string;
//     phoneNumber: string;
//     occupation: string;
//     image?: undefined;
//   };
//   motherInfo: {
//     name: string;
//     email: string;
//     phoneNumber: string;
//     occupation: string;
//     image?: undefined;
//   };
//   guardianInfo: {
//     name: string;
//     relation: string;
//     phoneNumber: string;
//     email: string;
//     occupation: string;
//     image?: undefined;
//   };
//   currentAddress: string;
//   permanentAddress: string;
//   transportInfo: {
//     route: string;
//     vehicleNumber: string;
//     pickupPoint: string;
//   };
//   documents: {
//     aadharCard?: undefined;
//     medicalCondition?: undefined;
//     transferCertificate?: undefined;
//     birthCertificate?:undefined;
//   };
//   medicalHistory: {
//     condition: "good" | "bad" | "other";
//     allergies: string[];
//     medications: string[];
//   };
// }

// const API_URL = process.env.REACT_APP_URL;

// const AddStudent = () => {
//   const { regNo } = useParams();
//   const routes = all_routes;

//   // Utility function to generate admission number
//   const generateAdmissionNumber = (): string => {
//     const timePart = Date.now().toString().slice(-3); // Last 3 digits of timestamp
//     const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, "0"); // 2-digit random (00–99)
//     return `LNS-144-${timePart}${randomPart}`;
//   };

//   const [isEdit, setIsEdit] = useState<boolean>(false);
//   const [medications, setMedications] = useState<string[]>([]);
//   const [allergies, setAllergies] = useState<string[]>([]);
//   const [sessions, setSessions] = useState<Option[]>([]);
//   const [classes, setClasses] = useState<Option[]>([]);
//   const [filteredClasses, setFilteredClasses] = useState<Option[]>([]);
//   const [birthCertificate, setBirthCertificate] = useState<File | null>(null);
//   const [aadharCard, setAadharCard] = useState<File | null>(null);
//   const [birthCertificatePreview, setBirthCertificatePreview] = useState<string | null>(null);
//   const [aadharCardPreview, setAadharCardPreview] = useState<string | null>(null);

//   const [formData, setFormData] = useState<FormData>({
//     admissionNumber: generateAdmissionNumber(), // Initialize with generated ID
//     admissionDate: "",
//     status: "active",
//     sessionId: "",
//     classId: undefined,
//     profileImage: undefined,
//     name: "",
//     dateOfBirth: "",
//     age: "",
//     gender: "male",
//     bloodGroup: "",
//     religion: "",
//     category: "",
//     fatherInfo: { name: "", email: "", phoneNumber: "", occupation: "", image: undefined },
//     motherInfo: { name: "", email: "", phoneNumber: "", occupation: "", image: undefined },
//     guardianInfo: {
//       name: "",
//       relation: "",
//       phoneNumber: "",
//       email: "",
//       occupation: "",
//       image: undefined,
//     },
//     currentAddress: "",
//     permanentAddress: "",
//     transportInfo: { route: "", vehicleNumber: "", pickupPoint: "" },
//     documents: { aadharCard: undefined, medicalCondition: undefined, transferCertificate: undefined, birthCertificate:undefined },
//     medicalHistory: { condition: "good", allergies: [], medications: [] },
//   });

//   const calculateAge = (dob: string): string => {
//     if (!dob) return "";
//     const birthDate = dayjs(dob, "DD-MM-YYYY");
//     if (!birthDate.isValid()) return "";
//     const today = dayjs();
//     const years = today.diff(birthDate, "year");
//     const adjustedBirthDate = birthDate.add(years, "year");
//     const months = today.diff(adjustedBirthDate, "month");
//     return `${years} years ${months} months`;
//   };

//   useEffect(() => {
//     const age = calculateAge(formData.dateOfBirth);
//     setFormData((prev) => ({ ...prev, age }));
//   }, [formData.dateOfBirth]);

//   useEffect(() => {
//     axios
//       .get(`${API_URL}/api/session/get`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       })
//       .then((res) => {
//         console.log("Sessions fetched:", res.data);
//         setSessions(res.data.map((s: any) => ({ value: s._id, label: s.name })));
//       })
//       .catch((err) => console.error("Error fetching sessions:", err));

//     axios
//       .get(`${API_URL}/api/class`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       })
//       .then((res) => {
//         console.log("Classes fetched:", res.data);
//         setClasses(
//           res.data.map((c: any) => ({
//             value: c._id,
//             label: c.name,
//             sessionId: c.sessionId,
//           }))
//         );
//       })
//       .catch((err) => console.error("Error fetching classes:", err));

//     if (regNo) {
//       setIsEdit(true);
//       axios
//         .get(`${API_URL}/api/student/${regNo}`, {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         })
//         .then((res) => {
//           const student = res.data;
//           console.log("Student data fetched:", student);
//           setFormData({
//             ...formData,
//             admissionNumber: student.admissionNumber,
//             admissionDate: student.admissionDate ? dayjs(student.admissionDate).format("DD-MM-YYYY") : "",
//             status: student.status,
//             sessionId: student.sessionId || "",
//             classId: student.classId || undefined,
//             name: student.name,
//             dateOfBirth: student.dateOfBirth ? dayjs(student.dateOfBirth).format("DD-MM-YYYY") : "",
//             age: student.dateOfBirth ? calculateAge(dayjs(student.dateOfBirth).format("DD-MM-YYYY")) : "",
//             gender: student.gender,
//             bloodGroup: student.bloodGroup || "",
//             religion: student.religion || "",
//             category: student.category || "",
//             fatherInfo: student.fatherInfo || formData.fatherInfo,
//             motherInfo: student.motherInfo || formData.motherInfo,
//             guardianInfo: student.guardianInfo || formData.guardianInfo,
//             currentAddress: student.currentAddress || "",
//             permanentAddress: student.permanentAddress || "",
//             transportInfo: student.transportInfo || formData.transportInfo,
//             medicalHistory: student.medicalHistory || formData.medicalHistory,
//           });
//           setMedications(student.medicalHistory?.medications || []);
//           setAllergies(student.medicalHistory?.allergies || []);
//         })
//         .catch((err) => console.error("Error fetching student:", err));
//     }
//   }, [regNo]);

//   useEffect(() => {
//     if (formData.sessionId) {
//       const filtered = classes.filter((c: any) => c.sessionId._id === formData.sessionId);
//       console.log("Filtered classes:", filtered);
//       setFilteredClasses([{ value: "", label: "None" }, ...filtered]);
//       if (formData.classId && !filtered.some((c) => c.value === formData.classId)) {
//         setFormData((prev) => ({ ...prev, classId: undefined }));
//       }
//     } else {
//       setFilteredClasses([{ value: "", label: "None" }]);
//       setFormData((prev) => ({ ...prev, classId: undefined }));
//     }
//   }, [formData.sessionId, classes]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleNestedChange = (section: keyof FormData, field: string, value: any) => {
//     setFormData((prev) => ({
//       ...prev,
//       [section]: {
//         ...(prev[section] as object),
//         [field]: value,
//       },
//     }));
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "birthCertificate" | "aadharCard") => {
//     const file = e.target.files?.[0] || null;
//     if (type === "birthCertificate") {
//       setBirthCertificate(file);
//       if (birthCertificatePreview) {
//         URL.revokeObjectURL(birthCertificatePreview);
//       }
//       setBirthCertificatePreview(file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
//     } else {
//       setAadharCard(file);
//       if (aadharCardPreview) {
//         URL.revokeObjectURL(aadharCardPreview);
//       }
//       setAadharCardPreview(file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!formData.sessionId) {
//       console.error("Please Select a session.");
//       toast.error("Please select a session");
//       return;
//     }

//     if (!formData.name || !formData.admissionNumber || !formData.admissionDate) {
//       toast.error("Please fill in all required fields.");
//       return;
//     }

//     const admissionDateISO = formData.admissionDate
//       ? dayjs(formData.admissionDate, "DD-MM-YYYY").format("YYYY-MM-DD")
//       : "";
//     const dateOfBirthISO = formData.dateOfBirth
//       ? dayjs(formData.dateOfBirth, "DD-MM-YYYY").format("YYYY-MM-DD")
//       : "";

//     const updatedFormData = {
//       ...formData,
//       admissionDate: admissionDateISO,
//       dateOfBirth: dateOfBirthISO,
//       status: formData.status.toLowerCase() as "active" | "inactive",
//       gender: formData.gender.toLowerCase() as "male" | "female" | "other",
//       medicalHistory: {
//         ...formData.medicalHistory,
//         allergies,
//         medications,
//       },
//     };

//     try {
//       const token = localStorage.getItem("token");
//       const url = isEdit
//         ? `${API_URL}/api/student/${regNo}`
//         : `${API_URL}/api/student/create`;
//       const method = isEdit ? "put" : "post";

//       const response = await axios({
//         method,
//         url,
//         data: updatedFormData,
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: token ? `Bearer ${token}` : "",
//         },
//       });
//       toast.success(`${isEdit ? "Student updated" : "Student added"} successfully!`);

//       if (!isEdit) {
//         setFormData({
//           admissionNumber: generateAdmissionNumber(), // Regenerate
//           admissionDate: "",
//           status: "active",
//           sessionId: "",
//           classId: undefined,
//           profileImage: undefined,
//           name: "",
//           dateOfBirth: "",
//           gender: "male",
//           bloodGroup: "",
//           religion: "",
//           category: "",
//           fatherInfo: { name: "", email: "", phoneNumber: "", occupation: "", image: undefined },
//           motherInfo: { name: "", email: "", phoneNumber: "", occupation: "", image: undefined },
//           guardianInfo: {
//             name: "",
//             relation: "",
//             phoneNumber: "",
//             email: "",
//             occupation: "",
//             image: undefined,
//           },
//           currentAddress: "",
//           permanentAddress: "",
//           transportInfo: { route: "", vehicleNumber: "", pickupPoint: "" },
//           documents: { aadharCard: undefined, medicalCondition: undefined, transferCertificate: undefined , birthCertificate: undefined},
//           medicalHistory: { condition: "good", allergies: [], medications: [] },
//         });
//         setMedications([]);
//         setAllergies([]);
//         setBirthCertificate(null);
//         setAadharCard(null);
//         if (birthCertificatePreview) {
//           URL.revokeObjectURL(birthCertificatePreview);
//           setBirthCertificatePreview(null);
//         }
//         if (aadharCardPreview) {
//           URL.revokeObjectURL(aadharCardPreview);
//           setAadharCardPreview(null);
//         }
//       }

//       window.location.href = routes.studentList;
//     } catch (error) {
//       const axiosError = error as AxiosError<{ message?: string }>;
//       toast.error(
//         "Failed to submit student: " +
//           (axiosError.response?.data?.message || axiosError.message || "Unknown error")
//       );
//     }
//   };

//   return (
//     <>
//       <Toaster position="top-right" reverseOrder={false} />
//       <div className="page-wrapper">
//         <div className="content content-two">
//           <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
//             <div className="my-auto mb-2">
//               <h3 className="mb-1">{isEdit ? "Edit" : "Add"} Student</h3>
//               <nav>
//                 <ol className="breadcrumb mb-0">
//                   <li className="breadcrumb-item">
//                     <Link to={routes.adminDashboard}>Dashboard</Link>
//                   </li>
//                   <li className="breadcrumb-item">
//                     <Link to={routes.studentList}>Students</Link>
//                   </li>
//                   <li className="breadcrumb-item active" aria-current="page">
//                     {isEdit ? "Edit" : "Add"} Student
//                   </li>
//                 </ol>
//               </nav>
//             </div>
//           </div>

//           <div className="row">
//             <div className="col-md-12">
//               <form onSubmit={handleSubmit}>
//                 <div className="card">
//                   <div className="card-header bg-light">
//                     <h4 className="text-dark">Account Information</h4>
//                   </div>
//                   <div className="card-body pb-1">
//                     <div className="row row-cols-xxl-5 row-cols-md-6">
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">
//                             Session <span className="text-danger">*</span>
//                           </label>
//                           <CommonSelect
//                             className="select"
//                             options={sessions}
//                             defaultValue={
//                               formData.sessionId
//                                 ? sessions.find((s) => s.value === formData.sessionId)
//                                 : sessions[sessions.length - 1]
//                             }
//                             onChange={(option: Option | null) =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 sessionId: option?.value || "",
//                               }))
//                             }
//                           />
//                         </div>
//                       </div>
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Class</label>
//                           <CommonSelect
//                             className="select"
//                             options={filteredClasses}
//                             defaultValue={
//                               filteredClasses.find((c) => c.value === formData.classId) || {
//                                 value: "",
//                                 label: "None",
//                               }
//                             }
//                             onChange={(option: Option | null) =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 classId: option?.value || undefined,
//                               }))
//                             }
//                           />
//                         </div>
//                       </div>
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">
//                             Admission Number <span className="text-danger">*</span>
//                           </label>
//                           <input
//                             type="text"
//                             className="form-control"
//                             name="admissionNumber"
//                             value={formData.admissionNumber}
//                             onChange={handleInputChange}
//                             readOnly
//                             required
//                           />
//                         </div>
//                       </div>
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">
//                             Admission Date <span className="text-danger">*</span>
//                           </label>
//                           <DatePicker
//                             className="form-control datetimepicker"
//                             format="DD-MM-YYYY"
//                             value={formData.admissionDate ? dayjs(formData.admissionDate, "DD-MM-YYYY") : dayjs()}
//                             onChange={(date) =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 admissionDate: date ? date.format("DD-MM-YYYY") : "",
//                               }))
//                             }
//                             placeholder="Select Date"
//                           />
//                         </div>
//                       </div>
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Status</label>
//                           <CommonSelect
//                             className="select"
//                             options={status}
//                             defaultValue={status.find((item) => item.value === formData.status)}
//                             onChange={(option: Option | null) =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 status: (option?.value as "active" | "inactive") || "active",
//                               }))
//                             }
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="card">
//                   <div className="card-header bg-light">
//                     <h4 className="text-dark">Personal Information</h4>
//                   </div>
//                   <div className="card-body pb-1">
//                     <div className="row row-cols-xxl-5 row-cols-md-6">
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">
//                             Name <span className="text-danger">*</span>
//                           </label>
//                           <input
//                             type="text"
//                             className="form-control"
//                             name="name"
//                             value={formData.name}
//                             onChange={handleInputChange}
//                             required
//                           />
//                         </div>
//                       </div>
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">
//                             Date of Birth <span className="text-danger">*</span>
//                           </label>
//                           <DatePicker
//                             className="form-control datetimepicker"
//                             format="DD-MM-YYYY"
//                             value={formData.dateOfBirth ? dayjs(formData.dateOfBirth, "DD-MM-YYYY") : null}
//                             onChange={(date) =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 dateOfBirth: date ? date.format("DD-MM-YYYY") : "",
//                               }))
//                             }
//                             placeholder="Select Date"
//                           />
//                         </div>
//                       </div>
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Age</label>
//                           <input
//                             type="text"
//                             className="form-control"
//                             value={formData.age || ""}
//                             readOnly
//                             placeholder="Age"
//                           />
//                         </div>
//                       </div>
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">
//                             Gender <span className="text-danger">*</span>
//                           </label>
//                           <CommonSelect
//                             className="select"
//                             options={gender}
//                             defaultValue={gender.find((gen) => gen.value === formData.gender)}
//                             onChange={(option: Option | null) =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 gender: (option?.value as "male" | "female" | "other") || "male",
//                               }))
//                             }
//                           />
//                         </div>
//                       </div>
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Blood Group</label>
//                           <CommonSelect
//                             className="select"
//                             options={bloodGroup}
//                             defaultValue={
//                               formData.bloodGroup
//                                 ? bloodGroup.find((bg) => bg.value === formData.bloodGroup)
//                                 : undefined
//                             }
//                             onChange={(option: Option | null) =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 bloodGroup: option?.value || "",
//                               }))
//                             }
//                           />
//                         </div>
//                       </div>
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Religion</label>
//                           <CommonSelect
//                             className="select"
//                             options={religion}
//                             defaultValue={
//                               formData.religion
//                                 ? religion.find((rel) => rel.value === formData.religion)
//                                 : undefined
//                             }
//                             onChange={(option: Option | null) =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 religion: option?.value || "",
//                               }))
//                             }
//                           />
//                         </div>
//                       </div>
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Category</label>
//                           <CommonSelect
//                             className="select"
//                             options={cast}
//                             defaultValue={
//                               formData.category
//                                 ? cast.find((c) => c.value === formData.category)
//                                 : undefined
//                             }
//                             onChange={(option: Option | null) =>
//                               setFormData((prev) => ({
//                                 ...prev,
//                                 category: option?.value || "",
//                               }))
//                             }
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="card">
//                   <div className="card-header bg-light">
//                     <h4 className="text-dark">Documents</h4>
//                   </div>
//                   <div className="card-body pb-1">
//                     <div className="row row-cols-xxl-5 row-cols-md-6">
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Birth Certificate</label>
//                           <input
//                             type="file"
//                             className="form-control"
//                             accept=".pdf,.jpg,.jpeg,.png"
//                             onChange={(e) => handleFileChange(e, "birthCertificate")}
//                           />
//                           {birthCertificate && (
//                             <div className="mt-2">
//                               <small className="text-muted">Selected: {birthCertificate.name}</small>
//                               {birthCertificatePreview ? (
//                                 <img
//                                   src={birthCertificatePreview}
//                                   alt="Birth Certificate Preview"
//                                   style={{ maxWidth: "100px", height: "auto", display: "block", marginTop: "5px" }}
//                                 />
//                               ) : (
//                                 <small className="d-block text-muted mt-1">PDF selected (no preview available)</small>
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                       <div className="col-xxl col-xl-3 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Aadhar Card</label>
//                           <input
//                             type="file"
//                             className="form-control"
//                             accept=".pdf,.jpg,.jpeg,.png"
//                             onChange={(e) => handleFileChange(e, "aadharCard")}
//                           />
//                           {aadharCard && (
//                             <div className="mt-2">
//                               <small className="text-muted">Selected: {aadharCard.name}</small>
//                               {aadharCardPreview ? (
//                                 <img
//                                   src={aadharCardPreview}
//                                   alt="Aadhar Card Preview"
//                                   style={{ maxWidth: "100px", height: "auto", display: "block", marginTop: "5px" }}
//                                 />
//                               ) : (
//                                 <small className="d-block text-muted mt-1">PDF selected (no preview available)</small>
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="card">
//                   <div className="card-header bg-light">
//                     <h4 className="text-dark">Parents & Guardian Information</h4>
//                   </div>
//                   <div className="card-body pb-0">
//                     <div className="border-bottom mb-3">
//                       <h5 className="mb-3">Father’s Info</h5>
//                       <div className="row">
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Father Name</label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               value={formData.fatherInfo.name}
//                               onChange={(e) => handleNestedChange("fatherInfo", "name", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Email</label>
//                             <input
//                               type="email"
//                               className="form-control"
//                               value={formData.fatherInfo.email}
//                               onChange={(e) => handleNestedChange("fatherInfo", "email", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Phone Number</label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               value={formData.fatherInfo.phoneNumber}
//                               onChange={(e) => handleNestedChange("fatherInfo", "phoneNumber", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Occupation</label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               value={formData.fatherInfo.occupation}
//                               onChange={(e) => handleNestedChange("fatherInfo", "occupation", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="border-bottom mb-3">
//                       <h5 className="mb-3">Mother’s Info</h5>
//                       <div className="row">
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Mother Name</label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               value={formData.motherInfo.name}
//                               onChange={(e) => handleNestedChange("motherInfo", "name", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Email</label>
//                             <input
//                               type="email"
//                               className="form-control"
//                               value={formData.motherInfo.email}
//                               onChange={(e) => handleNestedChange("motherInfo", "email", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Phone Number</label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               value={formData.motherInfo.phoneNumber}
//                               onChange={(e) => handleNestedChange("motherInfo", "phoneNumber", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Occupation</label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               value={formData.motherInfo.occupation}
//                               onChange={(e) => handleNestedChange("motherInfo", "occupation", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                     <div>
//                       <h5 className="mb-3">Guardian Details</h5>
//                       <div className="row">
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Guardian Name</label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               value={formData.guardianInfo.name}
//                               onChange={(e) => handleNestedChange("guardianInfo", "name", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Relation</label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               value={formData.guardianInfo.relation}
//                               onChange={(e) => handleNestedChange("guardianInfo", "relation", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Phone Number</label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               value={formData.guardianInfo.phoneNumber}
//                               onChange={(e) => handleNestedChange("guardianInfo", "phoneNumber", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Email</label>
//                             <input
//                               type="email"
//                               className="form-control"
//                               value={formData.guardianInfo.email}
//                               onChange={(e) => handleNestedChange("guardianInfo", "email", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                         <div className="col-lg-3 col-md-6">
//                           <div className="mb-3">
//                             <label className="form-label">Occupation</label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               value={formData.guardianInfo.occupation}
//                               onChange={(e) => handleNestedChange("guardianInfo", "occupation", e.target.value)}
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="card">
//                   <div className="card-header bg-light">
//                     <h4 className="text-dark">Address</h4>
//                   </div>
//                   <div className="card-body pb-1">
//                     <div className="row">
//                       <div className="col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Current Address</label>
//                           <input
//                             type="text"
//                             className="form-control"
//                             name="currentAddress"
//                             value={formData.currentAddress}
//                             onChange={handleInputChange}
//                           />
//                         </div>
//                       </div>
//                       <div className="col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Permanent Address</label>
//                           <input
//                             type="text"
//                             className="form-control"
//                             name="permanentAddress"
//                             value={formData.permanentAddress}
//                             onChange={handleInputChange}
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="card">
//                   <div className="card-header bg-light">
//                     <h4 className="text-dark">Transport Information</h4>
//                   </div>
//                   <div className="card-body pb-1">
//                     <div className="row">
//                       <div className="col-lg-4 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Route</label>
//                           <CommonSelect
//                             className="select"
//                             options={route}
//                             defaultValue={
//                               formData.transportInfo.route
//                                 ? route.find((r) => r.value === formData.transportInfo.route)
//                                 : undefined
//                             }
//                             onChange={(option: Option | null) =>
//                               handleNestedChange("transportInfo", "route", option?.value || "")
//                             }
//                           />
//                         </div>
//                       </div>
//                       <div className="col-lg-4 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Vehicle Number</label>
//                           <CommonSelect
//                             className="select"
//                             options={VehicleNumber}
//                             defaultValue={
//                               formData.transportInfo.vehicleNumber
//                                 ? VehicleNumber.find((vn) => vn.value === formData.transportInfo.vehicleNumber)
//                                 : undefined
//                             }
//                             onChange={(option: Option | null) =>
//                               handleNestedChange("transportInfo", "vehicleNumber", option?.value || "")
//                             }
//                           />
//                         </div>
//                       </div>
//                       <div className="col-lg-4 col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Pickup Point</label>
//                           <CommonSelect
//                             className="select"
//                             options={PickupPoint}
//                             defaultValue={
//                               formData.transportInfo.pickupPoint
//                                 ? PickupPoint.find((pp) => pp.value === formData.transportInfo.pickupPoint)
//                                 : undefined
//                             }
//                             onChange={(option: Option | null) =>
//                               handleNestedChange("transportInfo", "pickupPoint", option?.value || "")
//                             }
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="card">
//                   <div className="card-header bg-light">
//                     <h4 className="text-dark">Medical History</h4>
//                   </div>
//                   <div className="card-body pb-1">
//                     <div className="row">
//                       <div className="col-md-12">
//                         <div className="mb-2">
//                           <label className="form-label">Medical Condition</label>
//                           <div className="d-flex align-items-center flex-wrap">
//                             <div className="form-check me-3 mb-2">
//                               <input
//                                 className="form-check-input"
//                                 type="radio"
//                                 name="medicalCondition"
//                                 id="good"
//                                 checked={formData.medicalHistory.condition === "good"}
//                                 onChange={() => handleNestedChange("medicalHistory", "condition", "good")}
//                               />
//                               <label className="form-check-label" htmlFor="good">
//                                 Good
//                               </label>
//                             </div>
//                             <div className="form-check me-3 mb-2">
//                               <input
//                                 className="form-check-input"
//                                 type="radio"
//                                 name="medicalCondition"
//                                 id="bad"
//                                 checked={formData.medicalHistory.condition === "bad"}
//                                 onChange={() => handleNestedChange("medicalHistory", "condition", "bad")}
//                               />
//                               <label className="form-check-label" htmlFor="bad">
//                                 Bad
//                               </label>
//                             </div>
//                             <div className="form-check mb-2">
//                               <input
//                                 className="form-check-input"
//                                 type="radio"
//                                 name="medicalCondition"
//                                 id="other"
//                                 checked={formData.medicalHistory.condition === "other"}
//                                 onChange={() => handleNestedChange("medicalHistory", "condition", "other")}
//                               />
//                               <label className="form-check-label" htmlFor="other">
//                                 Other
//                               </label>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Allergies</label>
//                           <TagsInput value={allergies} onChange={setAllergies} />
//                         </div>
//                       </div>
//                       <div className="col-md-6">
//                         <div className="mb-3">
//                           <label className="form-label">Medications</label>
//                           <TagsInput value={medications} onChange={setMedications} />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="text-end">
//                   <button type="button" className="btn btn-light me-3">
//                     Cancel
//                   </button>
//                   <button type="submit" className="btn btn-primary">
//                     {isEdit ? "Update Student" : "Add Student"}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default AddStudent;

import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { all_routes } from "../../../router/all_routes";
import {
  bloodGroup,
  cast,
  gender,
  PickupPoint,
  religion,
  route,
  status,
  VehicleNumber,
} from "../../../../core/common/selectoption/selectoption";
import { TagsInput } from "react-tag-input-component";
import CommonSelect from "../../../../core/common/commonSelect";
import axios, { AxiosError } from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
interface Option {
  value: string;
  label: string;
  sessionId?: string;
}

interface FormData {
  admissionNumber: string;
  admissionDate: string;
  status: "active" | "inactive";
  sessionId: string;
  classId?: string;
  profileImage?: undefined;
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
    image?: undefined;
  };
  motherInfo: {
    name: string;
    email: string;
    phoneNumber: string;
    occupation: string;
    image?: undefined;
  };
  guardianInfo: {
    name: string;
    relation: string;
    phoneNumber: string;
    email: string;
    occupation: string;
    image?: undefined;
  };
  currentAddress: string;
  permanentAddress: string;
  transportInfo: {
    route: string;
    vehicleNumber: string;
    pickupPoint: string;
  };
  documents: Array<{ name: string; file: File | null }>;
  medicalHistory: {
    condition: "good" | "bad" | "other";
    allergies: string[];
    medications: string[];
  };
}

const API_URL = process.env.REACT_APP_URL;

const AddStudent = () => {
  const { regNo } = useParams();
  const routes = all_routes;
  const {token} = useAuth();
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [medications, setMedications] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Option[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<Array<string | null>>([]);
  const [nextAdmissionNumber, setNextAdmissionNumber] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    admissionNumber: "",
    admissionDate: dayjs().format("DD-MM-YYYY"),
    status: "active",
    sessionId: "",
    classId: undefined,
    profileImage: undefined,
    name: "",
    dateOfBirth: "",
    gender: "male",
    bloodGroup: "",
    religion: "",
    category: "",
    fatherInfo: { name: "", email: "", phoneNumber: "", occupation: "", image: undefined },
    motherInfo: { name: "", email: "", phoneNumber: "", occupation: "", image: undefined },
    guardianInfo: {
      name: "",
      relation: "",
      phoneNumber: "",
      email: "",
      occupation: "",
      image: undefined,
    },
    currentAddress: "",
    permanentAddress: "",
    transportInfo: { route: "", vehicleNumber: "", pickupPoint: "" },
    documents: [{ name: "", file: null }],
    medicalHistory: { condition: "good", allergies: [], medications: [] },
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

  // Fetch next student ID
  const fetchNextStudentId = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/student/next-id`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNextAdmissionNumber(res.data.id);
      setFormData((prev) => ({ ...prev, admissionNumber: res.data.id }));
      console.log("Fetched next admissionNumber:", res.data.id);
    } catch (error) {
      console.error("Error fetching next student ID:", error);
      toast.error("Failed to fetch admission number");
    }
  };

  useEffect(() => {
    // Fetch sessions
    axios
      .get(`${API_URL}/api/session/get`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Sessions fetched:", res.data);
        setSessions(res.data.map((s: any) => ({ value: s._id, label: s.name })));
      })
      .catch((err) => console.error("Error fetching sessions:", err));

    // Fetch classes
    axios
      .get(`${API_URL}/api/class`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Classes fetched:", res.data);
        setClasses(
          res.data.map((c: any) => ({
            value: c._id,
            label: c.name,
            sessionId: c.sessionId,
          }))
        );
      })
      .catch((err) => console.error("Error fetching classes:", err));

    // Fetch next student ID for adding
    if (!regNo) {
      fetchNextStudentId();
    }

    // Fetch student data for editing
    if (regNo) {
      setIsEdit(true);
      axios
        .get(`${API_URL}/api/student/${regNo}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const student = res.data;
          console.log("Student data fetched:", student);
          setFormData({
            ...formData,
            admissionNumber: student.admissionNumber,
            admissionDate: student.admissionDate ? dayjs(student.admissionDate).format("DD-MM-YYYY") : "",
            status: student.status,
            sessionId: student.sessionId || "",
            classId: student.classId || undefined,
            name: student.name,
            dateOfBirth: student.dateOfBirth ? dayjs(student.dateOfBirth).format("DD-MM-YYYY") : "",
            gender: student.gender,
            bloodGroup: student.bloodGroup || "",
            religion: student.religion || "",
            category: student.category || "",
            fatherInfo: student.fatherInfo || formData.fatherInfo,
            motherInfo: student.motherInfo || formData.motherInfo,
            guardianInfo: student.guardianInfo || formData.guardianInfo,
            currentAddress: student.currentAddress || "",
            permanentAddress: student.permanentAddress || "",
            transportInfo: student.transportInfo || formData.transportInfo,
            documents: student.documents?.map((doc: any) => ({ name: doc.name, file: null })) || [{ name: "", file: null }],
            medicalHistory: student.medicalHistory || formData.medicalHistory,
          });
          setMedications(student.medicalHistory?.medications || []);
          setAllergies(student.medicalHistory?.allergies || []);
          setDocumentPreviews(student.documents?.map(() => null) || [null]);
        })
        .catch((err) => console.error("Error fetching student:", err));
    }
  }, [regNo]);

  useEffect(() => {
    if (formData.sessionId) {
      const filtered = classes.filter((c: any) => c.sessionId === formData.sessionId || c.sessionId?._id === formData.sessionId);
      console.log("Filtered classes:", filtered);
      setFilteredClasses([{ value: "", label: "None" }, ...filtered]);
      if (formData.classId && !filtered.some((c) => c.value === formData.classId)) {
        setFormData((prev) => ({ ...prev, classId: undefined }));
      }
    } else {
      setFilteredClasses([{ value: "", label: "None" }]);
      setFormData((prev) => ({ ...prev, classId: undefined }));
    }
  }, [formData.sessionId, classes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (section: keyof FormData, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value,
      },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const errors: string[] = [];
    if (!formData.sessionId) errors.push("Session is required");
    if (!formData.name) errors.push("Name is required");
    if (!formData.admissionNumber) errors.push("Admission Number is required");
    if (!formData.admissionDate) errors.push("Admission Date is required");
    if (!formData.dateOfBirth) errors.push("Date of Birth is required");
    if (!formData.gender) errors.push("Gender is required");
    formData.documents.forEach((doc, index) => {
      if (doc.name && !doc.file) errors.push(`Document file for "${doc.name}" is required`);
      if (doc.file && !doc.name) errors.push(`Document name for file "${doc.file?.name}" is required`);
    });

    if (errors.length > 0) {
      toast.error(errors.join(", "));
      return;
    }

    // Validate date formats
    const admissionDateISO = formData.admissionDate
      ? dayjs(formData.admissionDate, "DD-MM-YYYY").format("YYYY-MM-DD")
      : "";
    const dateOfBirthISO = formData.dateOfBirth
      ? dayjs(formData.dateOfBirth, "DD-MM-YYYY").format("YYYY-MM-DD")
      : "";

    if (!dayjs(admissionDateISO).isValid()) {
      toast.error("Invalid Admission Date format");
      return;
    }
    if (!dayjs(dateOfBirthISO).isValid()) {
      toast.error("Invalid Date of Birth format");
      return;
    }

    // Prepare documents for backend
    const documentsForBackend = formData.documents
      .filter((doc) => doc.name && doc.file)
      .map((doc) => ({
        name: doc.name,
        url: doc.file ? `placeholder/${doc.file.name}` : null,
      }));

    const updatedFormData = {
      admissionDate: admissionDateISO,
      status: formData.status.toLowerCase() as "active" | "inactive",
      sessionId: formData.sessionId,
      classId: formData.classId,
      name: formData.name,
      dateOfBirth: dateOfBirthISO,
      gender: formData.gender.toLowerCase() as "male" | "female" | "other",
      bloodGroup: formData.bloodGroup,
      religion: formData.religion,
      category: formData.category,
      fatherInfo: formData.fatherInfo,
      motherInfo: formData.motherInfo,
      guardianInfo: formData.guardianInfo,
      currentAddress: formData.currentAddress,
      permanentAddress: formData.permanentAddress,
      transportInfo: formData.transportInfo,
      documents: documentsForBackend,
      medicalHistory: {
        condition: formData.medicalHistory.condition,
        allergies,
        medications,
      },
    };

    try {
      const url = isEdit
        ? `${API_URL}/api/student/${regNo}`
        : `${API_URL}/api/student/create`;
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

      console.log("Submit response:", response.data);
      toast.success(`${isEdit ? "Student updated" : "Student added"} successfully!`);

      if (!isEdit) {
        setFormData({
          admissionNumber: "",
          admissionDate: dayjs().format("DD-MM-YYYY"),
          status: "active",
          sessionId: "",
          classId: undefined,
          profileImage: undefined,
          name: "",
          dateOfBirth: "",
          gender: "male",
          bloodGroup: "",
          religion: "",
          category: "",
          fatherInfo: { name: "", email: "", phoneNumber: "", occupation: "", image: undefined },
          motherInfo: { name: "", email: "", phoneNumber: "", occupation: "", image: undefined },
          guardianInfo: {
            name: "",
            relation: "",
            phoneNumber: "",
            email: "",
            occupation: "",
            image: undefined,
          },
          currentAddress: "",
          permanentAddress: "",
          transportInfo: { route: "", vehicleNumber: "", pickupPoint: "" },
          documents: [{ name: "", file: null }],
          medicalHistory: { condition: "good", allergies: [], medications: [] },
        });
        setMedications([]);
        setAllergies([]);
        setDocumentPreviews([null]);
        setNextAdmissionNumber("");
        fetchNextStudentId(); // Fetch new ID for next add
      }

      window.location.href = routes.studentList;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Submit error:", axiosError.response?.data || axiosError.message);
      toast.error(
        "Failed to submit student: " +
          (axiosError.response?.data?.message || axiosError.message || "Unknown error")
      );
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
              <h3 className="mb-1">{isEdit ? "Edit" : "Add"} Student</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to={routes.studentList}>Students</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {isEdit ? "Edit" : "Add"} Student
                  </li>
                </ol>
              </nav>
            </div>
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
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Admission Number <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={isEdit ? formData.admissionNumber : (nextAdmissionNumber || "Fetching ID...")}
                            readOnly
                            disabled
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Admission Date <span className="text-danger">*</span>
                          </label>
                          <DatePicker
                            className="form-control datetimepicker"
                            format="DD-MM-YYYY"
                            value={formData.admissionDate ? dayjs(formData.admissionDate, "DD-MM-YYYY") : dayjs()}
                            onChange={(date) =>
                              setFormData((prev) => ({
                                ...prev,
                                admissionDate: date ? date.format("DD-MM-YYYY") : "",
                              }))
                            }
                            placeholder="Select Date"
                          />
                        </div>
                      </div>
                      <div className="col-xxl col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <CommonSelect
                            className="select"
                            options={status}
                            defaultValue={status.find((item) => item.value === formData.status)}
                            onChange={(option: Option | null) =>
                              setFormData((prev) => ({
                                ...prev,
                                status: (option?.value as "active" | "inactive") || "active",
                              }))
                            }
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
                                  placeholder="e.g., Birth Certificate"
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
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
  <div className="card-header bg-light">
    <h4 className="text-dark">Transport Information</h4>
  </div>
  <div className="card-body pb-1">
    <div className="row">
      <div className="col-lg-4 col-md-6">
        <div className="mb-3">
          <label className="form-label">Route</label>
          <input
            type="text"
            className="form-control"
            value={formData.transportInfo.route || ""}
            onChange={(e) =>
              handleNestedChange("transportInfo", "route", e.target.value)
            }
          />
        </div>
      </div>
      <div className="col-lg-4 col-md-6">
        <div className="mb-3">
          <label className="form-label">Vehicle Number</label>
          <input
            type="text"
            className="form-control"
            value={formData.transportInfo.vehicleNumber || ""}
            onChange={(e) =>
              handleNestedChange("transportInfo", "vehicleNumber", e.target.value)
            }
          />
        </div>
      </div>
      <div className="col-lg-4 col-md-6">
        <div className="mb-3">
          <label className="form-label">Pickup Point</label>
          <input
            type="text"
            className="form-control"
            value={formData.transportInfo.pickupPoint || ""}
            onChange={(e) =>
              handleNestedChange("transportInfo", "pickupPoint", e.target.value)
            }
          />
        </div>
      </div>
    </div>
  </div>
</div>

                <div className="card">
                  <div className="card-header bg-light">
                    <h4 className="text-dark">Medical History</h4>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-2">
                          <label className="form-label">Medical Condition</label>
                          <div className="d-flex align-items-center flex-wrap">
                            <div className="form-check me-3 mb-2">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="medicalCondition"
                                id="good"
                                checked={formData.medicalHistory.condition === "good"}
                                onChange={() => handleNestedChange("medicalHistory", "condition", "good")}
                              />
                              <label className="form-check-label" htmlFor="good">
                                Good
                              </label>
                            </div>
                            <div className="form-check me-3 mb-2">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="medicalCondition"
                                id="bad"
                                checked={formData.medicalHistory.condition === "bad"}
                                onChange={() => handleNestedChange("medicalHistory", "condition", "bad")}
                              />
                              <label className="form-check-label" htmlFor="bad">
                                Bad
                              </label>
                            </div>
                            <div className="form-check mb-2">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="medicalCondition"
                                id="other"
                                checked={formData.medicalHistory.condition === "other"}
                                onChange={() => handleNestedChange("medicalHistory", "condition", "other")}
                              />
                              <label className="form-check-label" htmlFor="other">
                                Other
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Allergies</label>
                          <TagsInput value={allergies} onChange={setAllergies} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Medications</label>
                          <TagsInput value={medications} onChange={setMedications} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-end">
                  <button type="button" className="btn btn-light me-3">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {isEdit ? "Update Student" : "Add Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddStudent;