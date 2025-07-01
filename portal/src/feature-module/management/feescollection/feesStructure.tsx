// import React, { useRef, useState, useEffect } from "react";
// import { all_routes } from "../../router/all_routes";
// import { Link } from "react-router-dom";
// import Table from "../../../core/common/dataTable/index";
// import TooltipOption from "../../../core/common/tooltipOption";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { Modal, Button } from "react-bootstrap";

// const config = {
//   headers: {
//     Authorization: `Bearer ${localStorage.getItem("token")}`,
//   },
// };

// interface Session {
//   _id: string;
//   name: string;
//   sessionId: string;
//   status: "active" | "inactive" | "completed";
// }

// interface Class {
//   _id: string;
//   id: string;
//   name: string;
//   sessionId: string;
//   teacherId?: { _id: string; name: string }[];
//   createdAt?: string;
//   updatedAt?: string;
//   __v?: number;
// }

// interface FeesGroup {
//   _id: string;
//   name: string;
//   periodicity: "Monthly" | "Quarterly" | "Yearly" | "One Time";
//   status: "Active" | "Inactive";
// }

// interface FeeDetail {
//   feesGroup: string | { _id: string; name: string };
//   amount: number;
// }

// interface FeeTemplate {
//   _id: string;
//   templateId: string;
//   name: string;
//   sessionId: string | { _id: string; name: string; sessionId: string };
//   classIds: Array<string | { _id: string; id: string; name: string }>;
//   fees: FeeDetail[];
//   status: "Active" | "Inactive";
//   createdAt: string;
//   updatedAt: string;
// }

// const API_URL = process.env.REACT_APP_URL;

// const FeeTemplateManager: React.FC = () => {
//   const routes = all_routes;
//   const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
//   const [sessions, setSessions] = useState<Session[]>([]);
//   const [selectedSession, setSelectedSession] = useState<string>("");
//   const [classes, setClasses] = useState<Class[]>([]);
//   const [selectedClass, setSelectedClass] = useState<string>("");
//   const [feesGroups, setFeesGroups] = useState<FeesGroup[]>([]);
//   const [templates, setTemplates] = useState<FeeTemplate[]>([]);
//   const [selectedTemplate, setSelectedTemplate] = useState<FeeTemplate | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
//   const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
//   const [showAssignModal, setShowAssignModal] = useState(false);
//   const [showViewModal, setShowViewModal] = useState(false);

//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         const [sessionsResponse, groupsResponse, templatesResponse] = await Promise.all([
//           axios.get<Session[]>(`${API_URL}/api/session/get`, config).catch(() => ({ data: [] })),
//           axios.get<FeesGroup[]>(`${API_URL}/api/feesGroup`, config).catch(() => ({ data: [] })),
//           axios.get<FeeTemplate[]>(`${API_URL}/api/feesTemplate`, config).catch(() => ({ data: [] })),
//         ]);

//         setSessions(sessionsResponse.data.map(session => ({
//           _id: session._id || "",
//           name: session.name || "Unknown Session",
//           sessionId: session.sessionId || "",
//           status: session.status || "inactive"
//         })));
//         setFeesGroups(groupsResponse.data.map(group => ({
//           _id: group._id || "",
//           name: group.name || "Unknown Group",
//           periodicity: group.periodicity || "Monthly",
//           status: group.status || "Inactive"
//         })));
//         setTemplates(templatesResponse.data.map(template => ({
//           _id: template._id || "",
//           templateId: template.templateId || "Unknown ID",
//           name: template.name || "Unknown Template",
//           sessionId: template.sessionId || "",
//           classIds: template.classIds || [],
//           fees: template.fees || [],
//           status: template.status || "Inactive",
//           createdAt: template.createdAt || "",
//           updatedAt: template.updatedAt || ""
//         })));
//         setLoading(false);
//       } catch (err) {
//         setError((err as Error).message || "Unknown error occurred");
//         setLoading(false);
//         toast.error("Failed to fetch initial data");
//       }
//     };
//     fetchInitialData();
//   }, []);

//   useEffect(() => {
//     if (selectedSession) {
//       fetchClassesForSession(selectedSession);
//     } else {
//       setClasses([]);
//       setSelectedClass("");
//       setSelectedTemplate(null);
//     }
//   }, [selectedSession]);

//   const fetchClassesForSession = async (sessionId: string) => {
//     try {
//       const response = await axios.get<Class[]>(`${API_URL}/api/class/session/${sessionId}`, config)
//         .catch(() => ({ data: [] }));
//       setClasses(response.data.map((cls) => ({
//         _id: cls._id || "",
//         id: cls.id || "",
//         name: cls.name || "Unknown Class",
//         sessionId: cls.sessionId || "",
//         teacherId: cls?.teacherId || [],
//         createdAt: cls.createdAt || "",
//         updatedAt: cls.updatedAt || "",
//         __v: cls?.__v || 0
//       })));
//     } catch (err) {
//       console.error("Error fetching classes:", err);
//       setClasses([]);
//       toast.error("Failed to fetch classes");
//     }
//   };

//   useEffect(() => {
//     if (selectedClass) {
//       const template = templates.find((t) => t.classIds.some((id) => (typeof id === "string" ? id : id?._id || "") === selectedClass));
//       setSelectedTemplate(template || null);
//     } else {
//       setSelectedTemplate(null);
//     }
//   }, [selectedClass, templates]);

//   const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedSession(e.target.value);
//     setSelectedClass("");
//     setSelectedTemplate(null);
//   };

//   const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedClass(e.target.value);
//   };

//   const handleTemplateSelect = (template: FeeTemplate) => {
//     setSelectedTemplate(template);
//     setShowViewModal(true);
//   };

//   const handleApplyClick = () => {
//     if (dropdownMenuRef.current) {
//       dropdownMenuRef.current.classList.remove("show");
//     }
//   };

//   const templateColumns = [
//     {
//       title: "Template ID",
//       dataIndex: "templateId",
//       render: (templateId: string) => <span>{templateId || "N/A"}</span>,
//     },
//     {
//       title: "Name",
//       dataIndex: "name",
//       render: (name: string) => <span>{name || "N/A"}</span>,
//     },
//     {
//       title: "Session",
//       dataIndex: "sessionId",
//       render: (sessionId: string | { _id: string; name: string; sessionId: string }) => (
//         <span>{typeof sessionId === "string" ? sessionId : sessionId?.name || "N/A"}</span>
//       ),
//     },
//     {
//       title: "Assigned Classes",
//       dataIndex: "classIds",
//       render: (classIds: Array<string | { _id: string; id: string; name: string }>) => (
//         <span>{classIds.length > 0 ? classIds.map((c) => (typeof c === "string" ? c : c?.name || "N/A")).join(", ") : "Not Assigned"}</span>
//       ),
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       render: (status: string) => <span>{status || "N/A"}</span>,
//     },
//     {
//       title: "Action",
//       render: (_: any, record: FeeTemplate) => (
//         <div>
//           <button
//             className="btn btn-sm btn-primary me-1"
//             onClick={() => handleTemplateSelect(record)}
//           >
//             View Details
//           </button>
//           <button
//             className="btn btn-sm btn-primary"
//             onClick={() => {
//               setSelectedTemplate(record);
//               setShowAssignModal(true);
//             }}
//           >
//             Assign to Classes
//           </button>
//         </div>
//       ),
//     },
//   ];

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>Error: {error}</div>;

//   return (
//     <>
//       <div className="page-wrapper">
//         <div className="content">
//           <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
//             <div className="my-auto mb-2">
//               <h3 className="page-title mb-1">Class Fee Structure</h3>
//               <nav>
//                 <ol className="breadcrumb mb-0">
//                   <li className="breadcrumb-item">
//                     <Link to={routes.adminDashboard}>Dashboard</Link>
//                   </li>
//                   <li className="breadcrumb-item">
//                     <Link to="#">Fees Collection</Link>
//                   </li>
//                   <li className="breadcrumb-item active" aria-current="page">
//                     Class Fee Structure
//                   </li>
//                 </ol>
//               </nav>
//             </div>
//             <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
//               <TooltipOption />
//             </div>
//           </div>
//           <div className="card">
//             <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
//               <h4 className="mb-3">Fee Templates</h4>
//               <div className="d-flex align-items-center flex-wrap">
//                 <div className="mb-3 me-2">
//                   <select
//                     className="form-select"
//                     value={selectedSession}
//                     onChange={handleSessionChange}
//                   >
//                     <option value="">Select Session</option>
//                     {sessions.map((session) => (
//                       <option key={session._id} value={session._id}>
//                         {session.name} ({session.sessionId})
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <button
//                   className="btn btn-primary mb-3 me-2"
//                   onClick={() => setShowAddTemplateModal(true)}
//                   disabled={!selectedSession}
//                 >
//                   Add Template
//                 </button>
//                 <button
//                   className="btn btn-primary mb-3 me-2"
//                   onClick={() => setShowEditTemplateModal(true)}
//                   disabled={!selectedSession}
//                 >
//                   Edit Template
//                 </button>
//               </div>
//             </div>
//             <div className="card-body p-0 py-3">
//               <Table
//                 dataSource={templates.filter((t) =>
//                   selectedSession
//                     ? (typeof t.sessionId === "string" ? t.sessionId : t.sessionId?._id || "") === selectedSession
//                     : true
//                 )}
//                 columns={templateColumns}
//                 Selection={false}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       <AddFeeTemplateModal
//         show={showAddTemplateModal}
//         onHide={() => setShowAddTemplateModal(false)}
//         templates={templates}
//         setTemplates={setTemplates}
//         feesGroups={feesGroups}
//         sessionId={selectedSession}
//         setSelectedTemplate={setSelectedTemplate}
//       />

//       <EditFeeTemplateModal
//         show={showEditTemplateModal}
//         onHide={() => setShowEditTemplateModal(false)}
//         templates={templates}
//         setTemplates={setTemplates}
//         feesGroups={feesGroups}
//         sessionId={selectedSession}
//         classes={classes}
//         setSelectedTemplate={setSelectedTemplate}
//       />

//       <AssignTemplateModal
//         show={showAssignModal}
//         onHide={() => setShowAssignModal(false)}
//         classes={classes}
//         selectedTemplate={selectedTemplate}
//         setTemplates={setTemplates}
//       />

//       <ViewFeeTemplateModal
//         show={showViewModal}
//         feesGroups={feesGroups}
//         onHide={() => setShowViewModal(false)}
//         selectedTemplate={selectedTemplate}
//       />
//     </>
//   );
// };

// // Add Fee Template Modal
// interface AddFeeTemplateModalProps {
//   show: boolean;
//   onHide: () => void;
//   templates: FeeTemplate[];
//   setTemplates: React.Dispatch<React.SetStateAction<FeeTemplate[]>>;
//   feesGroups: FeesGroup[];
//   sessionId: string;
//   setSelectedTemplate: React.Dispatch<React.SetStateAction<FeeTemplate | null>>;
// }

// const AddFeeTemplateModal: React.FC<AddFeeTemplateModalProps> = ({
//   show,
//   onHide,
//   templates,
//   setTemplates,
//   feesGroups,
//   sessionId,
//   setSelectedTemplate,
// }) => {
//   const [templateForm, setTemplateForm] = useState({
//     templateId: "",
//     name: "",
//     fees: [{ feesGroup: "", amount: 0 }] as FeeDetail[],
//     status: "Active" as "Active" | "Inactive",
//   });

//   useEffect(() => {
//     if (show) {
//       setTemplateForm({
//         templateId: "",
//         name: "",
//         fees: [{ feesGroup: "", amount: 0 }],
//         status: "Active",
//       });
//     }
//   }, [show]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setTemplateForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleFeeChange = (
//     index: number,
//     field: "feesGroup" | "amount",
//     value: string | number
//   ) => {
//     const newFees = [...templateForm.fees];
//     newFees[index] = {
//       ...newFees[index],
//       [field]: field === "amount" ? Number(value) : value,
//     };
//     setTemplateForm((prev) => ({ ...prev, fees: newFees }));
//   };

//   const addFeeGroup = () => {
//     setTemplateForm((prev) => ({
//       ...prev,
//       fees: [...prev.fees, { feesGroup: "", amount: 0 }],
//     }));
//   };

//   const deleteFeeGroup = (index: number) => {
//     if (templateForm.fees.length <= 1) {
//       toast.error("At least one fee group is required");
//       return;
//     }
//     setTemplateForm((prev) => ({
//       ...prev,
//       fees: prev.fees.filter((_, i) => i !== index),
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     try {
//       const payload = {
//         ...templateForm,
//         sessionId,
//       };
//       const response = await axios.post<FeeTemplate>(
//         `${API_URL}/api/feesTemplate`,
//         payload,
//         config
//       );
//       setTemplates((prev) => [...prev, response.data]);
//       setSelectedTemplate(response.data);
//       toast.success("Fee Template created successfully");
//       onHide();
//     } catch (error) {
//       console.error("Error saving fee template:", (error as Error).message);
//       toast.error("Error saving fee template");
//     }
//   };

//   return (
//     <Modal show={show} onHide={onHide} centered size="lg">
//       <Modal.Header closeButton>
//         <Modal.Title>Add New Fee Template</Modal.Title>
//       </Modal.Header>
//       <form onSubmit={handleSubmit}>
//         <Modal.Body>
//           <div className="mb-2">
//             <label className="form-label">Template ID <span className="text-danger">*</span></label>
//             <input
//               type="text"
//               className="form-control"
//               name="templateId"
//               value={templateForm.templateId}
//               onChange={handleInputChange}
//               placeholder="e.g., FT-2023-001"
//               required
//             />
//           </div>
//           <div className="mb-2">
//             <label className="form-label">Template Name <span className="text-danger">*</span></label>
//             <input
//               type="text"
//               className="form-control"
//               name="name"
//               value={templateForm.name}
//               onChange={handleInputChange}
//               placeholder="e.g., Kindergarten Fee Template 2023"
//               required
//             />
//           </div>
//           <h5 className="mb-2">Fee Groups</h5>
//           {templateForm.fees.map((fee, feeIndex) => (
//             <div key={feeIndex} className="d-flex align-items-center border p-2 rounded mb-2">
//               <div className="flex-grow-1 me-2">
//                 <select
//                   className="form-select"
//                   value={typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || ""}
//                   onChange={(e) => handleFeeChange(feeIndex, "feesGroup", e.target.value)}
//                   required
//                 >
//                   <option value="">Select Fee Group</option>
//                   {feesGroups.map((group) => (
//                     <option key={group._id} value={group._id}>
//                       {group.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div className="flex-shrink-0 me-2" style={{ width: "120px" }}>
//                 <input
//                   type="text"
//                   className="form-control"
//                   placeholder="Amount"
//                   value={fee.amount === 0 ? "" : fee.amount}
//                   onChange={(e) => handleFeeChange(feeIndex, "amount", e.target.value)}
//                   onKeyPress={(e) => {
//                     if (!/[0-9]/.test(e.key)) {
//                       e.preventDefault();
//                     }
//                   }}
//                   required
//                 />
//               </div>
//               <button
//                 type="button"
//                 className="btn btn-danger btn-sm bg-red-600 hover:bg-red-700"
//                 onClick={() => deleteFeeGroup(feeIndex)}
//               >
//                 <i className="ti ti-trash" />
//               </button>
//             </div>
//           ))}
//           <button type="button" className="btn btn-primary btn-sm mt-2" onClick={addFeeGroup}>
//             Add Fee Group
//           </button>
//           <div className="d-flex align-items-center justify-content-between mt-2">
//             <div className="status-title">
//               <h5>Status</h5>
//               <p>Change the Status by toggle</p>
//             </div>
//             <div className="form-check form-switch">
//               <input
//                 className="form-check-input"
//                 type="checkbox"
//                 checked={templateForm.status === "Active"}
//                 onChange={(e) =>
//                   setTemplateForm((prev) => ({
//                     ...prev,
//                     status: e.target.checked ? "Active" : "Inactive",
//                   }))
//                 }
//               />
//             </div>
//           </div>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button
//             variant="light"
//             className="me-3 border border-gray-300 hover:bg-gray-100"
//             onClick={onHide}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="primary"
//             type="submit"
//             className="bg-blue-600 hover:bg-blue-700"
//           >
//             Add New Template
//           </Button>
//         </Modal.Footer>
//       </form>
//     </Modal>
//   );
// };

// // Edit Fee Template Modal
// interface EditFeeTemplateModalProps {
//   show: boolean;
//   onHide: () => void;
//   templates: FeeTemplate[];
//   setTemplates: React.Dispatch<React.SetStateAction<FeeTemplate[]>>;
//   feesGroups: FeesGroup[];
//   sessionId: string;
//   classes: Class[];
//   setSelectedTemplate: React.Dispatch<React.SetStateAction<FeeTemplate | null>>;
// }

// const EditFeeTemplateModal: React.FC<EditFeeTemplateModalProps> = ({
//   show,
//   onHide,
//   templates,
//   setTemplates,
//   feesGroups,
//   sessionId,
//   classes,
//   setSelectedTemplate,
// }) => {
//   const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
//   const [templateForm, setTemplateForm] = useState({
//     templateId: "",
//     name: "",
//     classIds: [] as string[],
//     fees: [] as FeeDetail[],
//     status: "Active" as "Active" | "Inactive",
//   });

//   const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const templateId = e.target.value;
//     setSelectedTemplateId(templateId);
//     const template = templates.find((t) => t._id === templateId);
//     if (template) {
//       setTemplateForm({
//         templateId: template.templateId || "",
//         name: template.name || "",
//         classIds: template.classIds.map((c) => (typeof c === "string" ? c : c?._id || "")),
//         fees: template.fees.length ? template.fees : [{ feesGroup: "", amount: 0 }],
//         status: template.status || "Active",
//       });
//     } else {
//       setTemplateForm({
//         templateId: "",
//         name: "",
//         classIds: [],
//         fees: [],
//         status: "Active",
//       });
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setTemplateForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleClassIdsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const options = e.target.options;
//     const selectedIds: string[] = [];
//     for (let i = 0; i < options.length; i++) {
//       if (options[i].selected) {
//         selectedIds.push(options[i].value);
//       }
//     }
//     setTemplateForm((prev) => ({ ...prev, classIds: selectedIds }));
//   };

//   const handleFeeChange = (
//     index: number,
//     field: "feesGroup" | "amount",
//     value: string | number
//   ) => {
//     const newFees = [...templateForm.fees];
//     newFees[index] = {
//       ...newFees[index],
//       [field]: field === "amount" ? Number(value) : value,
//     };
//     setTemplateForm((prev) => ({ ...prev, fees: newFees }));
//   };

//   const addFeeGroup = () => {
//     setTemplateForm((prev) => ({
//       ...prev,
//       fees: [...prev.fees, { feesGroup: "", amount: 0 }],
//     }));
//   };

//   const deleteFeeGroup = (index: number) => {
//     setTemplateForm((prev) => ({
//       ...prev,
//       fees: prev.fees.filter((_, i) => i !== index),
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!selectedTemplateId) {
//       toast.error("Please select a template to edit");
//       return;
//     }
//     try {
//       const payload = {
//         ...templateForm,
//         sessionId,
//       };
//       const response = await axios.put<FeeTemplate>(
//         `${API_URL}/api/feesTemplate/${selectedTemplateId}`,
//         payload,
//         config
//       );
//       setTemplates((prev) => prev.map((t) => (t._id === selectedTemplateId ? response.data : t)));
//       setSelectedTemplate(response.data);
//       toast.success("Fee Template updated successfully");
//       onHide();
//     } catch (error) {
//       console.error("Error saving fee template:", (error as Error).message);
//       toast.error("Error saving fee template");
//     }
//   };

//   const handleDelete = async () => {
//     if (!selectedTemplateId) {
//       toast.error("Please select a template to delete");
//       return;
//     }
//     try {
//       await axios.delete(`${API_URL}/api/feesTemplate/${selectedTemplateId}`, config);
//       setTemplates((prev) => prev.filter((t) => t._id !== selectedTemplateId));
//       setSelectedTemplate(null);
//       setSelectedTemplateId("");
//       setTemplateForm({ templateId: "", name: "", classIds: [], fees: [], status: "Active" });
//       toast.success("Fee Template deleted successfully");
//       onHide();
//     } catch (error) {
//       console.error("Error deleting fee template:", (error as Error).message);
//       toast.error("Error deleting fee template");
//     }
//   };

//   return (
//     <Modal show={show} onHide={onHide} centered size="lg">
//       <Modal.Header closeButton>
//         <Modal.Title style={{ height: "17px" }}>Edit Fee Template</Modal.Title>
//       </Modal.Header>
//       <form onSubmit={handleSubmit}>
//         <Modal.Body style={{ maxHeight: "77vh", overflowY: "auto", paddingRight: "10px" }}>
//           <div className="mb-2">
//             <label className="form-label">Select Template <span className="text-danger">*</span></label>
//             <select
//               className="form-select"
//               style={{ padding: "0.375rem 0.5rem", fontSize: "0.875rem", height: "calc(1.5em + 0.75rem + 2px)" }}
//               value={selectedTemplateId}
//               onChange={handleTemplateChange}
//               required
//             >
//               <option value="">Select Template</option>
//               {templates
//                 .filter((t) => (typeof t.sessionId === "string" ? t.sessionId : t.sessionId?._id || "") === sessionId)
//                 .map((template) => (
//                   <option key={template._id} value={template._id}>
//                     {template.name} ({template.templateId})
//                   </option>
//                 ))}
//             </select>
//           </div>
//           <div className="d-flex mb-2 gap-2">
//             <div className="w-1/2 flex-grow-1">
//               <label className="form-label">Template ID <span className="text-danger">*</span></label>
//               <input
//                 type="text"
//                 style={{ padding: "0.375rem 0.5rem", fontSize: "0.875rem", height: "calc(1.5em + 0.75rem + 2px)" }}
//                 className="form-control"
//                 name="templateId"
//                 value={templateForm.templateId}
//                 onChange={handleInputChange}
//                 placeholder="e.g., FT-2023-001"
//                 required
//               />
//             </div>
//             <div className="w-1/2 flex-grow-1">
//               <label className="form-label">Template Name <span className="text-danger">*</span></label>
//               <input
//                 type="text"
//                 className="form-control"
//                 style={{ padding: "0.375rem 0.5rem", fontSize: "0.875rem", height: "calc(1.5em + 0.75rem + 2px)" }}
//                 name="name"
//                 value={templateForm.name}
//                 onChange={handleInputChange}
//                 placeholder="e.g., Kindergarten Fee Template 2023"
//                 required
//               />
//             </div>
//           </div>
//           <div className="mb-2">
//             <label className="form-label">Assigned Classes</label>
//             <select
//               className="form-select"
//               name="classIds"
//               multiple
//               value={templateForm.classIds}
//               onChange={handleClassIdsChange}
//               style={{ height: "80px" }}
//             >
//               {classes.map((c) => (
//                 <option key={c._id} value={c._id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//             <small className="form-text text-muted">Hold Ctrl (Windows) or Cmd (Mac) to select multiple classes</small>
//           </div>
//           <h5 className="mb-2">Fee Groups</h5>
//           <div style={{ maxHeight: "180px", overflowY: "auto" }}>
//             {templateForm.fees.map((fee, feeIndex) => (
//               <div key={feeIndex} className="d-flex align-items-center border p-2 rounded mb-2">
//                 <div className="flex-grow-1 me-2">
//                   <select
//                     className="form-select"
//                     value={typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || ""}
//                     onChange={(e) => handleFeeChange(feeIndex, "feesGroup", e.target.value)}
//                     style={{ padding: "0.375rem 0.5rem", fontSize: "0.875rem", height: "calc(1.5em + 0.75rem + 2px)" }}
//                     required
//                   >
//                     <option value="">Select Fee Group</option>
//                     {feesGroups.map((group) => (
//                       <option key={group._id} value={group._id}>
//                         {group.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="flex-shrink-0 me-2" style={{ width: "120px" }}>
//                   <input
//                     type="text"
//                     className="form-control"
//                     placeholder="Amount"
//                     style={{ padding: "0.375rem 0.5rem", fontSize: "0.875rem", height: "calc(1.5em + 0.75rem + 2px)" }}
//                     value={fee.amount === 0 ? "" : fee.amount}
//                     onChange={(e) => handleFeeChange(feeIndex, "amount", e.target.value)}
//                     onKeyPress={(e) => {
//                       if (!/[0-9]/.test(e.key)) {
//                         e.preventDefault();
//                       }
//                     }}
//                     required
//                   />
//                 </div>
//                 <button
//                   type="button"
//                   className="btn btn-danger btn-sm bg-red-600 hover:bg-red-700"
//                   onClick={() => deleteFeeGroup(feeIndex)}
//                 >
//                   <i className="ti ti-trash" />
//                 </button>
//               </div>
//             ))}
//           </div>
//           <button type="button" className="btn btn-primary btn-sm mt-2" onClick={addFeeGroup}>
//             Add Fee Group
//           </button>
//           <div className="d-flex align-items-center justify-content-between mt-2">
//             <div className="status-title">
//               <h5>Status</h5>
//               <p>Change the Status by toggle</p>
//             </div>
//             <div className="form-check form-switch">
//               <input
//                 className="form-check-input"
//                 type="checkbox"
//                 checked={templateForm.status === "Active"}
//                 onChange={(e) =>
//                   setTemplateForm((prev) => ({
//                     ...prev,
//                     status: e.target.checked ? "Active" : "Inactive",
//                   }))
//                 }
//               />
//             </div>
//           </div>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button
//             variant="light"
//             className="me-3 border border-gray-300 hover:bg-gray-100 h-6"
//             onClick={onHide}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="danger"
//             className="me-2 bg-red-600 hover:bg-red-700"
//             onClick={handleDelete}
//           >
//             Delete Template
//           </Button>
//           <Button
//             variant="primary"
//             type="submit"
//             className="bg-blue-600 hover:bg-blue-700 me-3"
//           >
//             Edit Template
//           </Button>
//         </Modal.Footer>
//       </form>
//     </Modal>
//   );
// };

// // Assign Template Modal
// interface AssignTemplateModalProps {
//   show: boolean;
//   onHide: () => void;
//   classes: Class[];
//   selectedTemplate: FeeTemplate | null;
//   setTemplates: React.Dispatch<React.SetStateAction<FeeTemplate[]>>;
// }

// const AssignTemplateModal: React.FC<AssignTemplateModalProps> = ({
//   show,
//   onHide,
//   classes,
//   selectedTemplate,
//   setTemplates,
// }) => {
//   const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

//   useEffect(() => {
//     if (selectedTemplate) {
//       setSelectedClassIds(selectedTemplate.classIds.map((c) => (typeof c === "string" ? c : c?._id || "")));
//     }
//   }, [selectedTemplate]);

//   const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const options = e.target.options;
//     const selectedIds: string[] = [];
//     for (let i = 0; i < options.length; i++) {
//       if (options[i].selected) {
//         selectedIds.push(options[i].value);
//       }
//     }
//     setSelectedClassIds(selectedIds);
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!selectedTemplate) {
//       toast.error("No template selected");
//       return;
//     }
//     try {
//       const updatedTemplate = { ...selectedTemplate, classIds: selectedClassIds };
//       const response = await axios.put<FeeTemplate>(
//         `${API_URL}/api/feesTemplate/${selectedTemplate._id}`,
//         updatedTemplate,
//         config
//       );
//       setTemplates((prev) =>
//         prev.map((t) => (t._id === selectedTemplate._id ? response.data : t))
//       );
//       toast.success("Template assigned to classes successfully");
//       onHide();
//     } catch (error) {
//       console.error("Error assigning template:", (error as Error).message);
//       toast.error("Error assigning template");
//     }
//   };

//   return (
//     <Modal show={show} onHide={onHide} centered>
//       <Modal.Header closeButton>
//         <Modal.Title>Assign Fee Template to Classes</Modal.Title>
//       </Modal.Header>
//       <form onSubmit={handleSubmit}>
//         <Modal.Body>
//           <div className="mb-2">
//             <label className="form-label">Selected Template</label>
//             <input
//               type="text"
//               className="form-control"
//               value={selectedTemplate ? `${selectedTemplate.name} (${selectedTemplate.templateId})` : "N/A"}
//               readOnly
//             />
//           </div>
//           <div className="mb-2">
//             <label className="form-label">Select Classes</label>
//             <select
//               className="form-select"
//               multiple
//               value={selectedClassIds}
//               onChange={handleClassChange}
//             >
//               {classes.length > 0 ? (
//                 classes.map((c) => (
//                   <option key={c._id} value={c._id}>
//                     {c.name}
//                   </option>
//                 ))
//               ) : (
//                 <option disabled>No classes available</option>
//               )}
//             </select>
//             <small className="form-text text-muted">Hold Ctrl (Windows) or Cmd (Mac) to select multiple classes</small>
//           </div>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button
//             variant="light"
//             className="me-3 border border-gray-300 hover:bg-gray-100"
//             onClick={onHide}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="primary"
//             type="submit"
//             className="bg-blue-600 hover:bg-blue-700"
//           >
//             Assign
//           </Button>
//         </Modal.Footer>
//       </form>
//     </Modal>
//   );
// };

// // View Fee Template Modal
// interface ViewFeeTemplateModalProps {
//   show: boolean;
//   onHide: () => void;
//   selectedTemplate: FeeTemplate | null;
//   feesGroups: FeesGroup[];
// }

// const ViewFeeTemplateModal: React.FC<ViewFeeTemplateModalProps> = ({
//   show,
//   onHide,
//   selectedTemplate,
//   feesGroups,
// }) => {
//   const feeStructureColumns = [
//     {
//       title: "Fee Components",
//       dataIndex: "name",
//       render: (name: string) => <span>{name || "N/A"}</span>,
//     },
//     {
//       title: "Amount",
//       dataIndex: "amount",
//       render: (amount: number) => <span>{amount !== undefined ? amount : "N/A"}</span>,
//     },
//   ];

//   const feeStructureData = selectedTemplate?.fees.map((fee, index) => ({
//     key: `${typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || ""}-${index}`,
//     name: typeof fee.feesGroup === "string"
//       ? feesGroups.find((fg) => fg._id === fee.feesGroup)?.name || fee.feesGroup
//       : fee.feesGroup?.name || "Unknown Group",
//     amount: fee.amount,
//   })) || [];

//   return (
//     <Modal show={show} onHide={onHide} centered size="lg">
//       <Modal.Header closeButton>
//         <Modal.Title>Fee Template Details</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         {selectedTemplate ? (
//           <>
//             <div className="mb-2">
//               <label className="form-label">Template Name</label>
//               <input
//                 type="text"
//                 className="form-control"
//                 value={selectedTemplate.name || "N/A"}
//                 readOnly
//               />
//             </div>
//             <div className="mb-2 w-full">
//               <label className="form-label">Template ID</label>
//               <input
//                 type="text"
//                 className="form-control"
//                 value={selectedTemplate.templateId || "N/A"}
//                 readOnly
//               />
//             </div>
//             <h5 className="mb-2">Fee Structure Details</h5>
//             <Table
//               dataSource={feeStructureData}
//               columns={feeStructureColumns}
//               Selection={false}
//             />
//           </>
//         ) : (
//           <p>No template selected.</p>
//         )}
//       </Modal.Body>
//       <Modal.Footer>
//         <Button
//           variant="light"
//           className="me-3 border border-gray-300 hover:bg-gray-100"
//           onClick={onHide}
//         >
//           Close
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default FeeTemplateManager;

import React, { useRef, useState, useEffect } from "react";
import { all_routes } from "../../router/all_routes";
import { Link } from "react-router-dom";
import Table from "../../../core/common/dataTable/index";
import TooltipOption from "../../../core/common/tooltipOption";
import axios from "axios";
import toast from "react-hot-toast";
import { Modal, Button } from "react-bootstrap";

const config = {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
};

interface Session {
  _id: string;
  name: string;
  sessionId: string;
  status: "active" | "inactive" | "completed";
}

interface Class {
  _id: string;
  id: string;
  name: string;
  sessionId: string;
  teacherId?: { _id: string; name: string }[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface FeesGroup {
  _id: string;
  name: string;
  periodicity: "Monthly" | "Quarterly" | "Yearly" | "One Time";
  status: "Active" | "Inactive";
}

interface FeeDetail {
  feesGroup: string | { _id: string; name: string };
  amount: number;
}

interface FeeTemplate {
  _id: string;
  templateId: string;
  name: string;
  sessionId: string | { _id: string; name: string; sessionId: string };
  classIds: Array<string | { _id: string; id: string; name: string }>;
  fees: FeeDetail[];
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

const API_URL = process.env.REACT_APP_URL || "http://localhost:5000";

const FeeTemplateManager: React.FC = () => {
  const routes = all_routes;
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [feesGroups, setFeesGroups] = useState<FeesGroup[]>([]);
  const [templates, setTemplates] = useState<FeeTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FeeTemplate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sessionsResponse, groupsResponse, templatesResponse] = await Promise.all([
          axios.get<Session[]>(`${API_URL}/api/session/get`, config),
          axios.get<FeesGroup[]>(`${API_URL}/api/feesGroup`, config),
          axios.get<FeeTemplate[]>(`${API_URL}/api/feesTemplate`, config),
        ]);

        setSessions(sessionsResponse.data || []);
        setFeesGroups(groupsResponse.data || []);
        setTemplates(templatesResponse.data || []);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message || "Unknown error occurred");
        setLoading(false);
        // toast.error("Failed to fetch initial data");
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchClassesForSession(selectedSession);
    } else {
      setClasses([]);
      setSelectedClass("");
      setSelectedTemplate(null);
    }
  }, [selectedSession]);

  const fetchClassesForSession = async (sessionId: string) => {
    try {
      const response = await axios.get<Class[]>(`${API_URL}/api/class/session/${sessionId}`, config);
      setClasses(response.data || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setClasses([]);
      // toast.error("Failed to fetch classes");
    }
  };

  useEffect(() => {
    if (selectedClass) {
      const template = templates.find((t) =>
        t.classIds.some((id) => (typeof id === "string" ? id : id._id) === selectedClass)
      );
      setSelectedTemplate(template || null);
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedClass, templates]);

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSession(e.target.value);
    setSelectedClass("");
    setSelectedTemplate(null);
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value);
  };

  const handleTemplateSelect = (template: FeeTemplate) => {
    setSelectedTemplate(template);
    setShowViewModal(true);
  };

  const handleApplyClick = () => {
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.classList.remove("show");
    }
  };

  const templateColumns = [
    {
      title: "Template ID",
      dataIndex: "templateId",
      render: (templateId: string) => <span>{templateId || "N/A"}</span>,
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (name: string) => <span>{name || "N/A"}</span>,
    },
    {
      title: "Session",
      dataIndex: "sessionId",
      // render: (sessionId: string | { _id: string; name: string; sessionId: string }) => (
      //   <span>{typeof sessionId === "string" ? sessions.find(s => s._id === sessionId)?.name || "N/A" : sessionId.name || "N/A"}</span>
      // ),
      render: (sessionId: string | { _id: string; name: string; sessionId: string }) => (
        <span>
          {typeof sessionId === "string"
            ? sessions.find(s => s?._id === sessionId)?.name || "N/A"
            : sessionId?.name || "N/A"}
        </span>
      )
    },
    {
      title: "Assigned Classes",
      dataIndex: "classIds",
      // render: (classIds: Array<string | { _id: string; id: string; name: string }>) => (
      //   <span>
      //     {classIds.length > 0
      //       ? classIds
      //           .map((c) => (typeof c === "string" ? classes.find(cls => cls._id === c)?.name || c : c.name))
      //           .join(", ")
      //       : "Not Assigned"}
      //   </span>
      // ),
      render: (classIds: Array<string | { _id: string; id: string; name: string }>) => (
        <span>
          {classIds?.length > 0
            ? classIds
                .map((c) => (typeof c === "string" ? classes.find(cls => cls?._id === c)?.name || c : c?.name || "Unknown"))
                .join(", ")
            : "Not Assigned"}
        </span>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => <span>{status || "N/A"}</span>,
    },
    {
      title: "Action",
      render: (_: any, record: FeeTemplate) => (
        <div>
          <button
            className="btn btn-sm btn-primary me-1"
            onClick={() => handleTemplateSelect(record)}
          >
            View Details
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              setSelectedTemplate(record);
              setShowAssignModal(true);
            }}
          >
            Assign to Classes
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Class Fee Structure</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="#">Fees Collection</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Class Fee Structure
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Fee Templates</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="mb-3 me-2">
                  <select
                    className="form-select"
                    value={selectedSession}
                    onChange={handleSessionChange}
                  >
                    <option value="">Select Session</option>
                    {sessions.map((session) => (
                      <option key={session?._id} value={session?._id}>
                        {session?.name} ({session?.sessionId})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary mb-3 me-2"
                  onClick={() => setShowAddTemplateModal(true)}
                  disabled={!selectedSession}
                >
                  Add Template
                </button>
                <button
                  className="btn btn-primary mb-3 me-2"
                  onClick={() => setShowEditTemplateModal(true)}
                  disabled={!selectedSession}
                >
                  Edit Template
                </button>
              </div>
            </div>
            <div className="card-body p-0 py-3">
              <Table
                dataSource={templates.filter((t) =>
                  selectedSession
                    ? (typeof t.sessionId === "string" ? t.sessionId : t.sessionId?._id) === selectedSession
                    : true
                )}
                columns={templateColumns}
                Selection={false}
              />
            </div>
          </div>
        </div>
      </div>

      <AddFeeTemplateModal
        show={showAddTemplateModal}
        onHide={() => setShowAddTemplateModal(false)}
        templates={templates}
        setTemplates={setTemplates}
        feesGroups={feesGroups}
        sessionId={selectedSession}
        setSelectedTemplate={setSelectedTemplate}
      />

      <EditFeeTemplateModal
        show={showEditTemplateModal}
        onHide={() => setShowEditTemplateModal(false)}
        templates={templates}
        setTemplates={setTemplates}
        feesGroups={feesGroups}
        sessionId={selectedSession}
        classes={classes}
        setSelectedTemplate={setSelectedTemplate}
      />

      <AssignTemplateModal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        classes={classes}
        selectedTemplate={selectedTemplate}
        setTemplates={setTemplates}
        sessionId={selectedSession}
        setSelectedTemplate={setSelectedTemplate}
      />

      <ViewFeeTemplateModal
        show={showViewModal}
        feesGroups={feesGroups}
        onHide={() => setShowViewModal(false)}
        selectedTemplate={selectedTemplate}
      />
    </>
  );
};

// Add Fee Template Modal
interface AddFeeTemplateModalProps {
  show: boolean;
  onHide: () => void;
  templates: FeeTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<FeeTemplate[]>>;
  feesGroups: FeesGroup[];
  sessionId: string;
  setSelectedTemplate: React.Dispatch<React.SetStateAction<FeeTemplate | null>>;
}

const AddFeeTemplateModal: React.FC<AddFeeTemplateModalProps> = ({
  show,
  onHide,
  templates,
  setTemplates,
  feesGroups,
  sessionId,
  setSelectedTemplate,
}) => {
  const [templateForm, setTemplateForm] = useState({
    templateId: "",
    name: "",
    fees: [{ feesGroup: "", amount: 0 }] as FeeDetail[],
    status: "Active" as "Active" | "Inactive",
  });

  useEffect(() => {
    if (show) {
      setTemplateForm({
        templateId: "",
        name: "",
        fees: [{ feesGroup: "", amount: 0 }],
        status: "Active",
      });
    }
  }, [show]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTemplateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeeChange = (
    index: number,
    field: "feesGroup" | "amount",
    value: string | number
  ) => {
    const newFees = [...templateForm.fees];
    newFees[index] = {
      ...newFees[index],
      [field]: field === "amount" ? Number(value) : value,
    };
    setTemplateForm((prev) => ({ ...prev, fees: newFees }));
  };

  const addFeeGroup = () => {
    setTemplateForm((prev) => ({
      ...prev,
      fees: [...prev.fees, { feesGroup: "", amount: 0 }],
    }));
  };

  const deleteFeeGroup = (index: number) => {
    if (templateForm.fees.length <= 1) {
      toast.error("At least one fee group is required");
      return;
    }
    setTemplateForm((prev) => ({
      ...prev,
      fees: prev.fees.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        ...templateForm,
        sessionId,
      };
      const response = await axios.post<FeeTemplate>(
        `${API_URL}/api/feesTemplate`,
        payload,
        config
      );
      setTemplates((prev) => [...prev, response.data]);
      setSelectedTemplate(response.data);
      toast.success("Fee Template created successfully");
      onHide();
    } catch (error) {
      console.error("Error saving fee template:", error);
      toast.error("Error saving fee template");
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add New Fee Template</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-2">
            <label className="form-label">Template ID <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-control"
              name="templateId"
              value={templateForm.templateId}
              onChange={handleInputChange}
              placeholder="e.g., FT-2023-001"
              required
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Template Name <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={templateForm.name}
              onChange={handleInputChange}
              placeholder="e.g., Kindergarten Fee Template 2023"
              required
            />
          </div>
          <h5 className="mb-2">Fee Groups</h5>
          {templateForm.fees.map((fee, feeIndex) => (
            <div key={feeIndex} className="d-flex align-items-center border p-2 rounded mb-2">
              <div className="flex-grow-1 me-2">
                <select
                  className="form-select"
                  value={typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || ""}
                  onChange={(e) => handleFeeChange(feeIndex, "feesGroup", e.target.value)}
                  required
                >
                  <option value="">Select Fee Group</option>
                  {feesGroups.map((group) => (
                    <option key={group?._id} value={group?._id}>
                      {group?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-shrink-0 me-2" style={{ width: "120px" }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Amount"
                  value={fee.amount}
                  onChange={(e) => handleFeeChange(feeIndex, "amount", e.target.value)}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  required
                />
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm bg-red-600 hover:bg-red-700"
                onClick={() => deleteFeeGroup(feeIndex)}
              >
                <i className="ti ti-trash" />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-primary btn-sm mt-2" onClick={addFeeGroup}>
            Add Fee Group
          </button>
          <div className="d-flex align-items-center justify-content-between mt-2">
            <div className="status-title">
              <h5>Status</h5>
              <p>Change the Status by toggle</p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={templateForm.status === "Active"}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    status: e.target.checked ? "Active" : "Inactive",
                  }))
                }
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            className="me-3 border border-gray-300 hover:bg-gray-100"
            onClick={onHide}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add New Template
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

// Edit Fee Template Modal
interface EditFeeTemplateModalProps {
  show: boolean;
  onHide: () => void;
  templates: FeeTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<FeeTemplate[]>>;
  feesGroups: FeesGroup[];
  sessionId: string;
  classes: Class[];
  setSelectedTemplate: React.Dispatch<React.SetStateAction<FeeTemplate | null>>;
}

const EditFeeTemplateModal: React.FC<EditFeeTemplateModalProps> = ({
  show,
  onHide,
  templates,
  setTemplates,
  feesGroups,
  sessionId,
  classes,
  setSelectedTemplate,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateForm, setTemplateForm] = useState({
    templateId: "",
    name: "",
    classIds: [] as string[],
    fees: [] as FeeDetail[],
    status: "Active" as "Active" | "Inactive",
  });

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t?._id === templateId);
    if (template) {
      setTemplateForm({
        templateId: template.templateId || "",
        name: template.name || "",
        classIds: template.classIds?.map((c) => (typeof c === "string" ? c : c?._id)) || [],
        fees: template.fees?.length ? template.fees : [{ feesGroup: "", amount: 0 }],
        status: template.status || "Active",
      });
    } else {
      setTemplateForm({
        templateId: "",
        name: "",
        classIds: [],
        fees: [{ feesGroup: "", amount: 0 }],
        status: "Active",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTemplateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClassIdsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedIds: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedIds.push(options[i].value);
      }
    }
    setTemplateForm((prev) => ({ ...prev, classIds: selectedIds }));
  };

  const handleFeeChange = (
    index: number,
    field: "feesGroup" | "amount",
    value: string | number
  ) => {
    const newFees = [...templateForm.fees];
    newFees[index] = {
      ...newFees[index],
      [field]: field === "amount" ? Number(value) : value,
    };
    setTemplateForm((prev) => ({ ...prev, fees: newFees }));
  };

  const addFeeGroup = () => {
    setTemplateForm((prev) => ({
      ...prev,
      fees: [...prev.fees, { feesGroup: "", amount: 0 }],
    }));
  };

  const deleteFeeGroup = (index: number) => {
    setTemplateForm((prev) => ({
      ...prev,
      fees: prev.fees.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      toast.error("Please select a template to edit");
      return;
    }
    try {
      const payload = {
        ...templateForm,
        sessionId,
      };
      const response = await axios.put<FeeTemplate>(
        `${API_URL}/api/feesTemplate/${selectedTemplateId}`,
        payload,
        config
      );
      setTemplates((prev) => prev.map((t) => (t._id === selectedTemplateId ? response.data : t)));
      setSelectedTemplate(response.data);
      toast.success("Fee Template updated successfully");
      onHide();
    } catch (error) {
      console.error("Error saving fee template:", error);
      toast.error("Error saving fee template");
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template to delete");
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/feesTemplate/${selectedTemplateId}`, config);
      setTemplates((prev) => prev.filter((t) => t._id !== selectedTemplateId));
      setSelectedTemplate(null);
      setSelectedTemplateId("");
      setTemplateForm({ templateId: "", name: "", classIds: [], fees: [{ feesGroup: "", amount: 0 }], status: "Active" });
      toast.success("Fee Template deleted successfully");
      onHide();
    } catch (error) {
      console.error("Error deleting fee template:", error);
      toast.error("Error deleting fee template");
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Fee Template</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body style={{ maxHeight: "77vh", overflowY: "auto", paddingRight: "10px" }}>
          <div className="mb-2">
            <label className="form-label">Select Template <span className="text-danger">*</span></label>
            <select
              className="form-select"
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              required
            >
              <option value="">Select Template</option>
              {templates
                .filter((t) => (typeof t.sessionId === "string" ? t.sessionId : t.sessionId?._id) === sessionId)
                .map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name} ({template.templateId})
                  </option>
                ))}
            </select>
          </div>
          <div className="d-flex mb-2 gap-2">
            <div className="w-1/2 flex-grow-1">
              <label className="form-label">Template ID <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                name="templateId"
                value={templateForm.templateId}
                onChange={handleInputChange}
                placeholder="e.g., FT-2023-001"
                required
              />
            </div>
            <div className="w-1/2 flex-grow-1">
              <label className="form-label">Template Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={templateForm.name}
                onChange={handleInputChange}
                placeholder="e.g., Kindergarten Fee Template 2023"
                required
              />
            </div>
          </div>
          <div className="mb-2">
            <label className="form-label">Assigned Classes</label>
            <select
              className="form-select"
              name="classIds"
              multiple
              value={templateForm.classIds}
              onChange={handleClassIdsChange}
              style={{ height: "80px" }}
            >
              {classes.map((c) => (
                <option key={c?._id} value={c?._id}>
                  {c?.name}
                </option>
              ))}
            </select>
            <small className="form-text text-muted">Hold Ctrl (Windows) or Cmd (Mac) to select multiple classes</small>
          </div>
          <h5 className="mb-2">Fee Groups</h5>
          <div style={{ maxHeight: "180px", overflowY: "auto" }}>
            {templateForm.fees.map((fee, feeIndex) => (
              <div key={feeIndex} className="d-flex align-items-center border p-2 rounded mb-2">
                <div className="flex-grow-1 me-2">
                  <select
                    className="form-select"
                    value={typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || ""}
                    onChange={(e) => handleFeeChange(feeIndex, "feesGroup", e.target.value)}
                    required
                  >
                    <option value="">Select Fee Group</option>
                    {feesGroups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-shrink-0 me-2" style={{ width: "120px" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Amount"
                    value={fee.amount === 0 ? "" : fee.amount}
                    onChange={(e) => handleFeeChange(feeIndex, "amount", e.target.value)}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    required
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm bg-red-600 hover:bg-red-700"
                  onClick={() => deleteFeeGroup(feeIndex)}
                >
                  <i className="ti ti-trash" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-primary btn-sm mt-2" onClick={addFeeGroup}>
            Add Fee Group
          </button>
          <div className="d-flex align-items-center justify-content-between mt-2">
            <div className="status-title">
              <h5>Status</h5>
              <p>Change the Status by toggle</p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={templateForm.status === "Active"}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    status: e.target.checked ? "Active" : "Inactive",
                  }))
                }
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            className="me-3 border border-gray-300 hover:bg-gray-100"
            onClick={onHide}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="me-2 bg-red-600 hover:bg-red-700"
            onClick={handleDelete}
          >
            Delete Template
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Edit Template
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

// Assign Template Modal
interface AssignTemplateModalProps {
  show: boolean;
  onHide: () => void;
  classes: Class[];
  selectedTemplate: FeeTemplate | null;
  setTemplates: React.Dispatch<React.SetStateAction<FeeTemplate[]>>;
  sessionId: string;
  setSelectedTemplate: React.Dispatch<React.SetStateAction<FeeTemplate | null>>;
}

const AssignTemplateModal: React.FC<AssignTemplateModalProps> = ({
  show,
  onHide,
  classes,
  selectedTemplate,
  setTemplates,
  sessionId,
  setSelectedTemplate
}) => {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedTemplate) {
      // setSelectedClassIds(selectedTemplate.classIds.map((c) => (typeof c === "string" ? c : c._id)));
      setSelectedClassIds(selectedTemplate.classIds?.map((c) => (typeof c === "string" ? c : c?._id)) || []);
    }
  }, [selectedTemplate]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedIds: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedIds.push(options[i].value);
      }
    }
    setSelectedClassIds(selectedIds);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTemplate) {
      toast.error("No template selected");
      return;
    }
    if (!sessionId) {
      toast.error("No session selected");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        templateId: selectedTemplate._id,
        sessionId,
        classIds: selectedClassIds,
      };
      await axios.post(`${API_URL}/api/feesTemplate/assign-fees-to-students`, payload, config);
      // Fetch updated template to reflect new classIds
      const response = await axios.get<FeeTemplate>(
        `${API_URL}/api/feesTemplate/${selectedTemplate._id}`,
        config
      );
      setTemplates((prev) =>
        prev.map((t) => (t._id === selectedTemplate._id ? response.data : t))
      );
      setSelectedTemplate(response.data);
      toast.success("Template assigned to classes successfully. Fees populated for students.");
      onHide();
    } catch (error: any) {
      console.error("Error assigning template:", error);
      const errorMessage = error.response?.data?.message || "Error assigning template";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Assign Fee Template to Classes</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-2">
            <label className="form-label">Selected Template</label>
            <input
              type="text"
              className="form-control"
              value={selectedTemplate ? `${selectedTemplate.name} (${selectedTemplate.templateId})` : "N/A"}
              readOnly
            />
          </div>
          <div className="mb-2">
            <label className="form-label">Select Classes <span className="text-danger">*</span></label>
            <select
              className="form-select"
              multiple
              value={selectedClassIds}
              onChange={handleClassChange}
              style={{ height: "120px" }}
              required
            >
              {classes.length > 0 ? (
                classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option disabled>No classes available</option>
              )}
            </select>
            <small className="form-text text-muted">
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple classes. Fees will be assigned to all active students in selected classes.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            className="me-3 border border-gray-300 hover:bg-gray-100"
            onClick={onHide}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Assigning..." : "Assign"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

// View Fee Template Modal
interface ViewFeeTemplateModalProps {
  show: boolean;
  onHide: () => void;
  selectedTemplate: FeeTemplate | null;
  feesGroups: FeesGroup[];
}

const ViewFeeTemplateModal: React.FC<ViewFeeTemplateModalProps> = ({
  show,
  onHide,
  selectedTemplate,
  feesGroups,
}) => {
  const feeStructureColumns = [
    {
      title: "Fee Group",
      dataIndex: "name",
      render: (name: string) => <span>{name || "N/A"}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (amount: number) => <span>{amount !== undefined ? `₹${amount}` : "N/A"}</span>,
    },
  ];

  const feeStructureData = selectedTemplate?.fees?.map((fee, index) => ({
  key: `${typeof fee.feesGroup === "string" ? fee.feesGroup : fee.feesGroup?._id || ""}-${index}`,
  name: typeof fee.feesGroup === "string"
    ? feesGroups.find((fg) => fg?._id === fee.feesGroup)?.name || fee.feesGroup
    : fee.feesGroup?.name || "Unknown Group",
  amount: fee.amount,
})) || [];

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Fee Template Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedTemplate ? (
          <>
            <div className="mb-2">
              <label className="form-label">Template Name</label>
              <input
                type="text"
                className="form-control"
                value={selectedTemplate.name || "N/A"}
                readOnly
              />
            </div>
            <div className="mb-2">
              <label className="form-label">Template ID</label>
              <input
                type="text"
                className="form-control"
                value={selectedTemplate.templateId || "N/A"}
                readOnly
              />
            </div>
            <h5 className="mb-2">Fee Structure Details</h5>
            <Table
              dataSource={feeStructureData}
              columns={feeStructureColumns}
              Selection={false}
            />
          </>
        ) : (
          <p>No template selected.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="light"
          className="me-3 border border-gray-300 hover:bg-gray-100"
          onClick={onHide}
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FeeTemplateManager;