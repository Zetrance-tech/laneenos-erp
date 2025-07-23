import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Spin, Select, Table, Button, Form, Modal, Radio, Tooltip, InputNumber } from "antd";
import { all_routes } from "../../router/all_routes";
import moment from "moment";
import TooltipOption from "../../../core/common/tooltipOption";
import { useAuth } from "../../../context/AuthContext";

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
}

interface Student {
  _id: string;
  admissionNumber: string;
  name: string;
  classId: string;
}

interface GeneratedFee {
  _id: string;
  student: {
    _id: string;
    name: string;
    admissionNumber: string;
  };
  feesGroup: {
    _id: string;
    name: string;
    periodicity: string;
  };
  amount: number;
  originalAmount: number;
  discount: number;
  discountPercent: number;
  netPayable: number;
  dueDate?: string;
  status?: string;
  generatedBy?: {
    _id: string;
    name: string;
  };
  generatedAt?: string;
  month?: string;
  generationGroupId?: string;
}

interface TallyData {
  totalAmount: number;
  totalNetPayable: number;
  feesByMonth: {
    [month: string]: GeneratedFee[];
  };
  generationGroupId?: string;
  months: string[];
}

interface Tally {
  student: {
    _id: string;
    name: string;
    admissionNumber: string;
  };
  tally: TallyData;
}

interface MonthlyFeesSummary {
  student: {
    _id: string;
    name: string;
    admissionNumber: string;
  };
  month: string;
  totalAmount: number;
  totalNetPayable: number;
  dueDate?: string;
  generatedAt?: string;
  status?: string;
  feeDetails: GeneratedFee[];
  generationGroupId?: string;
}

interface FeeTableRow {
  key: string;
  student: {
    _id?: string;
    name: string;
    admissionNumber: string;
  };
  month: string;
  totalAmount: number | null;
  totalNetPayable: number | null;
  dueDate?: string;
  generatedAt?: string;
  status?: string;
  feeDetails: GeneratedFee[];
  generationGroupId?: string;
}

interface GenerationGroup {
  generationGroupId: string;
  months: string[];
  generatedAt: string;
  tally: Tally[];
}

const API_URL = process.env.REACT_APP_URL;

const GenerateStudentFees: React.FC = () => {
  const routes = all_routes;
  const { token, user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [generatedMonths, setGeneratedMonths] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<moment.Moment | null>(null);
  const [monthlyFees, setMonthlyFees] = useState<FeeTableRow[]>([]);
  const [allFees, setAllFees] = useState<FeeTableRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedFeeDetails, setSelectedFeeDetails] = useState<GeneratedFee[]>([]);
  const [selectedMonthStatus, setSelectedMonthStatus] = useState<string | undefined>(undefined);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [editingFeeSummary, setEditingFeeSummary] = useState<FeeTableRow | null>(null);
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [isEditFeesModalVisible, setIsEditFeesModalVisible] = useState<boolean>(false);
  const [editingFees, setEditingFees] = useState<GeneratedFee[]>([]);
  const [editingFeeRecord, setEditingFeeRecord] = useState<FeeTableRow | null>(null);
  const [form] = Form.useForm();
  const [generationMode, setGenerationMode] = useState<"single" | "class">("single");
  const [isTallyModalVisible, setIsTallyModalVisible] = useState<boolean>(false);
  const [selectedTally, setSelectedTally] = useState<Tally[]>([]);
  const [generationGroups, setGenerationGroups] = useState<GenerationGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const months = [
    "Apr", "May", "Jun", "Jul", "Aug", "Sep",
    "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
  ];
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Session[]>(`${API_URL}/api/session/get`, config);
      const sessionData = response.data || [];
      setSessions(
        sessionData.map((session) => ({
          _id: session._id,
          name: session.name || "Unknown Session",
          sessionId: session.sessionId || "",
          status: session.status || "inactive",
        }))
      );
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch sessions";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesForSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Class[]>(`${API_URL}/api/class/session/${selectedSession}`, config);
      const classData = response.data || [];
      setClasses(
        classData.map((cls) => ({
          _id: cls._id,
          id: cls.id || "",
          name: cls.name || "Unknown Class",
          sessionId: cls.sessionId || "",
        }))
      );
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch classes";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForClass = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<{ data: Student[] }>(
        `${API_URL}/api/studentFees/students-by-class-session/${selectedClass}/${selectedSession}`,
        config
      );
      const studentData = response.data?.data || [];
      setStudents(
        studentData.map((student) => ({
          _id: student._id,
          admissionNumber: student.admissionNumber || "",
          name: student.name || "Unknown Student",
          classId: student.classId || "",
        }))
      );
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch students";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneratedFeesForClass = async () => {
    if (!selectedClass || !selectedSession) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<MonthlyFeesSummary[]>(
        `${API_URL}/api/studentFees/class/${selectedClass}/session/${selectedSession}/generated-summary`,
        config
      );
      const feesData = response.data || [];
      const transformedFees: FeeTableRow[] = feesData.map(summary => {
        const feeDetails = Array.isArray(summary.feeDetails) ? summary.feeDetails : [];
        const totalAmount = feeDetails.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
        const totalNetPayable = feeDetails.reduce((sum, fee) => {
          const netPayable = Number(fee.netPayable) || (Number(fee.amount) - (Number(fee.discount) || 0));
          return sum + netPayable;
        }, 0);
        return {
          key: `${summary.student._id}-${summary.month}`,
          student: summary.student || { _id: '', name: 'Unknown', admissionNumber: '' },
          month: summary.month || '',
          totalAmount,
          totalNetPayable,
          dueDate: summary.dueDate,
          generatedAt: summary.generatedAt,
          status: summary.status,
          feeDetails,
          generationGroupId: summary.generationGroupId,
        };
      });
      setAllFees(transformedFees);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch generated fees for class";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneratedMonths = async () => {
    if (!selectedStudentId || !selectedSession) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<string[]>(
        `${API_URL}/api/studentFees/months/${selectedStudentId}?sessionId=${selectedSession}`,
        config
      );
      setGeneratedMonths(response.data);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch generated months";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenerationGroups = async () => {
    if (!selectedSession || (!selectedStudentId && generationMode === "single") || (!selectedClass && generationMode === "class")) return;
    setLoading(true);
    setError(null);
    try {
      const params: any = { sessionId: selectedSession };
      if (generationMode === "single") {
        params.studentId = selectedStudentId;
      } else {
        params.classId = selectedClass;
      }
      const response = await axios.get<GenerationGroup[]>(`${API_URL}/api/studentFees/generation-groups`, { ...config, params });
      const groupData = response.data || [];
      const sortedGroups = groupData.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
      setGenerationGroups(sortedGroups);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to fetch generation groups";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFees = async () => {
    if (!selectedMonths.length || !dueDate || !selectedClass || !selectedSession) {
      toast.error("Please select a class, session, at least one month, and due date");
      return;
    }
    if (generationMode === "single" && !selectedStudentId) {
      toast.error("Please select a student for single student mode");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let response;
      if (generationMode === "single") {
        const payload = {
          studentId: selectedStudentId,
          sessionId: selectedSession,
          months: selectedMonths,
          dueDate: dueDate.toISOString(),
          generatedAt: new Date().toISOString(),
        };
        response = await axios.post(`${API_URL}/api/studentFees/fees/generate`, payload, config);
        toast.success("Fees generated successfully for the student");
      } else {
        const payload = {
          classId: selectedClass,
          sessionId: selectedSession,
          months: selectedMonths,
          dueDate: dueDate.toISOString(),
          generatedAt: new Date().toISOString(),
        };
        response = await axios.post(`${API_URL}/api/studentFees/fees/generate-class`, payload, config);
        toast.success("Fees generated successfully for the class");
      }
      fetchGeneratedFeesForClass();
      if (generationMode === "single") fetchGeneratedMonths();
      fetchGenerationGroups();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : `Failed to generate fees for ${generationMode === "single" ? "student" : "month"}`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDueDate = async () => {
    if (!editingFeeSummary || !newDueDate) {
      toast.error("Please select a month and new due date");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        studentId: editingFeeSummary.student._id,
        sessionId: selectedSession,
        month: editingFeeSummary.month,
        dueDate: moment(newDueDate).format("YYYY-MM-DD"),
      };
      await axios.patch(`${API_URL}/api/studentFees/update-due-date`, payload, config);
      toast.success("Fee due date updated successfully");
      fetchGeneratedFeesForClass();
      setIsEditModalVisible(false);
      setEditingFeeSummary(null);
      setNewDueDate('');
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to update due date";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFees = (record: FeeTableRow) => {
    setEditingFeeRecord(record);
    setEditingFees(record.feeDetails.map(fee => ({
      ...fee,
      amount: fee.amount || 0,
      originalAmount: fee.originalAmount || fee.amount || 0,
      discount: fee.discount || 0,
    })));
    setIsEditFeesModalVisible(true);
    form.setFieldsValue({
      fees: record.feeDetails.map(fee => ({
        feesGroupId: fee.feesGroup._id,
        amount: fee.amount || 0,
        discount: fee.discount || 0,
      })),
    });
  };

  const handleEditFeesSubmit = async () => {
    if (!editingFeeRecord || !editingFees.length) {
      toast.error("No fee details to update");
      return;
    }
    try {
      const values = await form.validateFields();
      console.log("11")
      console.log(values)
      const updatedFees = values.fees.map((fee: any) => ({
        feesGroup: fee.feesGroupId,
        amount: Number(fee.amount) || 0,
        originalAmount: Number(fee.amount) || 0,
        discount: Number(fee.discount) || 0,
      }));
      console.log(updatedFees);
      console.log("22")

      const payload = {
        studentId: editingFeeRecord.student._id,
        sessionId: selectedSession,
        month: editingFeeRecord.month,
        fees: updatedFees,
      };
      console.log(payload)
      console.log(1)
      setLoading(true);
      setError(null);
      const response = await axios.patch(`${API_URL}/api/studentFees/edit-fees-month`, payload, config);
      console.log(2)

      toast.success(response.data.message || "Fees updated successfully");
      fetchGeneratedFeesForClass();
      if (generationMode === "single") fetchGeneratedMonths();
      setIsEditFeesModalVisible(false);
      setEditingFeeRecord(null);
      setEditingFees([]);
      form.resetFields();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to update fees";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGeneratedFees = async (record: FeeTableRow) => {
    if (!record.student._id) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        studentId: record.student._id,
        sessionId: selectedSession,
        month: record.month,
      };
      await axios.put(`${API_URL}/api/studentFees/delete-generated-fees`, payload, config);
      toast.success("Generated fees deleted successfully");
      fetchGeneratedFeesForClass();
      if (generationMode === "single") fetchGeneratedMonths();
      fetchGenerationGroups();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to delete generated fees";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchClassesForSession();
    } else {
      setClasses([]);
      setSelectedClass("");
      setStudents([]);
      setSelectedStudentId("");
      setGeneratedMonths([]);
      setSelectedMonths([]);
      setMonthlyFees([]);
      setAllFees([]);
      setGenerationGroups([]);
      setSelectedGroupId("");
      setError(null);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedClass && selectedSession) {
      fetchStudentsForClass();
      fetchGeneratedFeesForClass();
      fetchGenerationGroups();
    } else {
      setStudents([]);
      setAllFees([]);
      setMonthlyFees([]);
      setSelectedStudentId("");
      setGeneratedMonths([]);
      setSelectedMonths([]);
      setGenerationGroups([]);
      setSelectedGroupId("");
      setError(null);
    }
  }, [selectedClass, selectedSession]);

  useEffect(() => {
    if (generationMode === "single" && selectedStudentId && selectedSession) {
      fetchGeneratedMonths();
      fetchGenerationGroups();
      const selectedStudent = students.find(student => student._id === selectedStudentId);
      if (selectedMonths.length > 0 && selectedStudent) {
        const filteredRows: FeeTableRow[] = [];
        selectedMonths.forEach(month => {
          const existingFee = allFees.find(
            fee => fee.student._id === selectedStudentId && fee.month === month
          );
          filteredRows.push(
            existingFee || {
              key: `${selectedStudentId}_${month}`,
              student: {
                _id: selectedStudentId,
                name: selectedStudent.name,
                admissionNumber: selectedStudent.admissionNumber,
              },
              month,
              totalAmount: null,
              totalNetPayable: null,
              dueDate: undefined,
              generatedAt: undefined,
              status: undefined,
              feeDetails: [],
            }
          );
        });
        setMonthlyFees(filteredRows);
      } else {
        setMonthlyFees(allFees.filter(fee => fee.student._id === selectedStudentId));
      }
    } else if (
      generationMode === "class" &&
      selectedClass &&
      selectedSession &&
      students.length > 0
    ) {
      fetchGenerationGroups();
      if (selectedMonths.length > 0) {
        const filteredRows: FeeTableRow[] = [];
        students.forEach(student => {
          selectedMonths.forEach(month => {
            const existingFee = allFees.find(
              fee => fee.student._id === student._id && fee.month === month
            );
            filteredRows.push(
              existingFee || {
                key: `${student._id}_${month}`,
                student: {
                  _id: student._id,
                  name: student.name,
                  admissionNumber: student.admissionNumber,
                },
                month,
                totalAmount: null,
                totalNetPayable: null,
                dueDate: undefined,
                generatedAt: undefined,
                status: undefined,
                feeDetails: [],
              }
            );
          });
        });
        setMonthlyFees(filteredRows);
      } else {
        const allRows: FeeTableRow[] = [];
        students.forEach(student => {
          months.forEach(month => {
            const existingFee = allFees.find(
              fee => fee.student._id === student._id && fee.month === month
            );
            allRows.push(
              existingFee || {
                key: `${student._id}_${month}`,
                student: {
                  _id: student._id,
                  name: student.name,
                  admissionNumber: student.admissionNumber,
                },
                month,
                totalAmount: null,
                totalNetPayable: null,
                dueDate: undefined,
                generatedAt: undefined,
                status: undefined,
                feeDetails: [],
              }
            );
          });
        });
        setMonthlyFees(allRows);
      }
    } else {
      setMonthlyFees(allFees);
    }
  }, [
    generationMode,
    selectedStudentId,
    selectedMonths,
    selectedSession,
    selectedClass,
    students,
    allFees,
  ]);

  const selectedStudent = students.find(student => student._id === selectedStudentId);

  const handleViewDetails = (feeDetails: GeneratedFee[], status?: string) => {
    setSelectedFeeDetails(feeDetails);
    setSelectedMonthStatus(status);
    setIsModalVisible(true);
  };

  const handleEditDueDate = (record: FeeTableRow) => {
    setEditingFeeSummary(record);
    setNewDueDate(record.dueDate ? moment(record.dueDate).format("YYYY-MM-DD") : "");
    setIsEditModalVisible(true);
  };

  const handleViewTally = (tally: Tally[]) => {
    setSelectedTally(tally || []);
    setIsTallyModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedFeeDetails([]);
    setSelectedMonthStatus(undefined);
  };

  const handleEditModalClose = () => {
    setIsEditModalVisible(false);
    setEditingFeeSummary(null);
    setNewDueDate("");
  };

  const handleEditFeesModalClose = () => {
    setIsEditFeesModalVisible(false);
    setEditingFeeRecord(null);
    setEditingFees([]);
    form.resetFields();
  };

  const handleTallyModalClose = () => {
    setIsTallyModalVisible(false);
    setSelectedTally([]);
    setSelectedGroupId("");
  };

  const summaryColumns = [
    {
      title: "Student Name",
      dataIndex: "student",
      render: (student: { name: string; admissionNumber: string }) => (
        <div>
          <div>{student?.name || "N/A"}</div>
          <small className="text-muted">({student?.admissionNumber || "N/A"})</small>
        </div>
      ),
      sorter: (a: FeeTableRow, b: FeeTableRow) => a.student.name.localeCompare(b.student.name),
    },
    {
      title: "Month",
      dataIndex: "month",
      render: (month: string) => <span style={{ color: 'black' }}>{month || "N/A"}</span>,
      sorter: (a: FeeTableRow, b: FeeTableRow) => a.month.localeCompare(b.month),
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      render: (totalAmount: number | null) => <span>{totalAmount !== null ? `₹${totalAmount.toFixed(2)}` : "-"}</span>,
      sorter: (a: FeeTableRow, b: FeeTableRow) => (a.totalAmount || 0) - (b.totalAmount || 0),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      render: (dueDate?: string) => (
        <span>{dueDate ? moment(dueDate).format("MMM DD, YYYY") : "-"}</span>
      ),
      sorter: (a: FeeTableRow, b: FeeTableRow) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: "Generated At",
      dataIndex: "generatedAt",
      render: (generatedAt?: string) => (
        <span>{generatedAt ? moment(generatedAt).format("YYYY-MM-DD HH:mm:ss") : "-"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status?: string) => (
        <span
          className={`badge ${
            status === "paid" ? "bg-success" :
            status === "pending" ? "bg-warning" :
            status ? "bg-danger" : "bg-secondary"
          }`}
        >
          {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Not Generated"}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: FeeTableRow) => (
        <div className="dropdown">
          <button
            className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content px-2"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="ti ti-dots-vertical fs-14" />
          </button>
          <ul className="dropdown-menu dropdown-menu-right p-3">
            <li>
              <button
                className="dropdown-item rounded-1"
                onClick={() => handleViewDetails(record.feeDetails, record.status)}
                disabled={!record.feeDetails || record.feeDetails.length === 0}
              >
                <i className="ti ti-eye me-2"></i>
                View Details
              </button>
            </li>
            {record.dueDate && (
              <>
                <li>
                  <button
                    className="dropdown-item rounded-1"
                    onClick={() => handleEditDueDate(record)}
                  >
                    <i className="ti ti-edit-circle me-2" />
                    Update Due Date
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item rounded-1"
                    onClick={() => handleEditFees(record)}
                    disabled={record.status === "paid" || record.status === "partially_paid"}
                  >
                    <i className="ti ti-edit me-2" />
                    Edit Fees
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item rounded-1"
                    onClick={() => handleDeleteGeneratedFees(record)}
                  >
                    <i className="ti ti-trash-x me-2" />
                    Delete
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      ),
    },
  ];

  const feeColumns = [
    {
      title: "Fee Group",
      dataIndex: "feesGroup",
      render: (feesGroup: { name: string }) => (
        <span>{feesGroup?.name || "N/A"}</span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (amount: number) => <span>₹{amount?.toFixed(0) || 0}</span>,
    },
  ];

  const tallyColumns = [
    {
      title: "Student",
      dataIndex: "student",
      render: (student: { name: string; admissionNumber: string }) => (
        <span>{`${student.name} (${student.admissionNumber})`}</span>
      ),
    },
    {
      title: "Total Amount",
      dataIndex: "tally",
      render: (tally: TallyData) => <span>₹{tally.totalAmount.toFixed(2)}</span>,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Generate Student Fees</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="#">Fees Collection</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Generate Fees
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            {/* <TooltipOption /> */}
          </div>
        </div>
        <div className="card">
          <div className="card-header pb-0">
            <h4 className="mb-3">Generate Fees</h4>

            <div className="mb-3">
              <Form.Item label="Generate For">
                <Tooltip title={generationMode === "single" ? "Generate fees for a single student" : "Generate fees for all students in the class"}>
                  <Radio.Group
                    value={generationMode}
                    onChange={(e) => {
                      setGenerationMode(e.target.value);
                      setSelectedSession("");
                      setSelectedClass("");
                      setSelectedStudentId("");
                      setSelectedMonths([]);
                      setGeneratedMonths([]);
                      setMonthlyFees([]);
                      setAllFees([]);
                      setGenerationGroups([]);
                      setSelectedGroupId("");
                    }}
                    disabled={loading}
                  >
                    <Radio value="single">Single Student</Radio>
                    <Radio value="class">Entire Class</Radio>
                  </Radio.Group>
                </Tooltip>
              </Form.Item>
            </div>

            <div className="d-flex flex-wrap gap-3">
              <Form.Item label="Session">
                <Select
                  placeholder="Select a session"
                  value={selectedSession || undefined}
                  onChange={(value: string) => setSelectedSession(value)}
                  style={{ width: 200 }}
                  options={(sessions || []).map((session) => ({
                    value: session._id,
                    label: `${session.name} (${session.sessionId})`,
                  }))}
                  disabled={loading}
                  allowClear
                />
              </Form.Item>

              <Form.Item label="Class">
                <Select
                  placeholder="Select a class"
                  value={selectedClass || undefined}
                  onChange={(value: string) => setSelectedClass(value)}
                  style={{ width: 200 }}
                  options={(classes || []).map((cls) => ({
                    value: cls._id,
                    label: cls.name,
                  }))}
                  disabled={!selectedSession || loading}
                  allowClear
                />
              </Form.Item>

              {generationMode === "single" && (
                <Form.Item label="Student">
                  <Select
                    showSearch
                    placeholder="Search student"
                    value={selectedStudentId || undefined}
                    onChange={(value: string) => setSelectedStudentId(value)}
                    style={{ width: 220 }}
                    options={(students || []).map((student) => ({
                      value: student._id,
                      label: `${student.name} (${student.admissionNumber})`,
                    }))}
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                    disabled={!selectedClass || loading}
                    allowClear
                  />
                </Form.Item>
              )}

              <Form.Item label="Months">
                <Select
                  mode="multiple"
                  placeholder="Select months"
                  value={selectedMonths || []}
                  onChange={(value: string[]) => setSelectedMonths(value || [])}
                  style={{ width: 200 }}
                  options={(months || []).map((month) => ({
                    value: month,
                    label: month,
                  }))}
                  disabled={(!selectedStudentId && generationMode === "single") || !selectedClass || loading}
                  allowClear
                  dropdownStyle={{ color: 'black' }}
                  tagRender={(props) => (
                    <span
                      style={{
                        color: 'black',
                        backgroundColor: '#f5f5f5',
                        padding: '2px 8px',
                        margin: '2px',
                        borderRadius: '4px',
                      }}
                    >
                      {props.label}
                    </span>
                  )}
                />
              </Form.Item>

              <Form.Item label="Due Date">
                <input
                  type="date"
                  value={dueDate ? moment(dueDate).format("YYYY-MM-DD") : ""}
                  onChange={(e) => setDueDate(e.target.value ? moment(e.target.value) : null)}
                  disabled={loading}
                  style={{ width: 150, padding: "4px" }}
                />
              </Form.Item>

              <Form.Item label=" ">
                <Tooltip title={`Generate fees for ${generationMode === "single" ? "the selected student" : "all students in the class"} for the chosen months`}>
                  <Button
                    type="primary"
                    onClick={handleGenerateFees}
                    disabled={
                      !selectedMonths.length ||
                      !dueDate ||
                      !selectedClass ||
                      (generationMode === "single" && !selectedStudentId) ||
                      loading
                    }
                  >
                    Generate for {generationMode === "single" ? "Student" : "Class"}
                  </Button>
                </Tooltip>
              </Form.Item>
            </div>

            {(generationGroups || []).length > 0 && (
              <div className="mt-3">
                <h5>View Tally for Generated Fees</h5>
                <Form.Item label="Select Generation Month Group">
                  <Select
                    placeholder="Select a generation month group"
                    value={selectedGroupId || undefined}
                    onChange={(value: string) => {
                      setSelectedGroupId(value);
                      const group = generationGroups.find(g => g.generationGroupId === value);
                      handleViewTally(group?.tally || []);
                    }}
                    style={{ width: 300 }}
                    options={(generationGroups || []).map((group) => ({
                      value: group.generationGroupId,
                      label: `${group.months.join(", ")} (${moment(group.generatedAt).format("MMM DD, YYYY HH:mm")})`,
                    }))}
                    disabled={loading}
                    allowClear
                  />
                </Form.Item>
              </div>
            )}
          </div>

          <div className="card-body p-0 py-3">
            <Spin spinning={loading} size="large">
              {error ? (
                <div className="text-center py-4">
                  <p className="alert alert-danger mx-3" role="alert">
                    {error}
                  </p>
                  <div>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => {
                        setError(null);
                        if (selectedClass && selectedSession) {
                          fetchStudentsForClass();
                          fetchGeneratedFeesForClass();
                          fetchGenerationGroups();
                        } else if (selectedSession) {
                          fetchClassesForSession();
                        } else {
                          fetchSessions();
                        }
                      }}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : loading ? (
                <div className="text-center py-4">
                  <p>Loading fees data...</p>
                </div>
              ) : monthlyFees.length > 0 ? (
                <div className="p-3">
                  <h5>
                    Generated Fees Summary
                    {selectedStudentId && generationMode === "single" && ` - ${selectedStudent?.name || "Unknown"} (${selectedStudent?.admissionNumber || "N/A"})`}
                    {selectedMonths.length > 0 && ` - ${selectedMonths.join(", ")}`}
                  </h5>
                  <Table
                    dataSource={monthlyFees || []}
                    columns={summaryColumns}
                    rowKey="key"
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                  />
                  {generationMode === "single" && selectedStudentId && selectedMonths.length > 0 && !monthlyFees.some(fee => fee.totalAmount) && (
                    <p className="alert alert-info mx-3 mt-3" role="alert">
                      No fees data available for {selectedStudent?.name || "Unknown"} in {selectedMonths.join(", ")}. Set due date and click Generate Fees to generate fees or view available fee groups.
                    </p>
                  )}
                  <Modal
                    title="Fee Details"
                    open={isModalVisible}
                    onCancel={handleModalClose}
                    footer={null}
                    width={800}
                    style={{ top: 50 }}
                    zIndex={10000}
                  >
                    <Table
                      dataSource={selectedFeeDetails}
                      columns={feeColumns}
                      rowKey="_id"
                      pagination={{ pageSize: 10, showSizeChanger: false }}
                      footer={() => {
                        const totalAmount = (selectedFeeDetails || []).reduce((sum: number, fee: GeneratedFee) => sum + (Number(fee.netPayable) || 0), 0);
                        return (
                          <div className="text-right">
                            <strong>
                              Total Amount: ₹{totalAmount.toFixed(2)}
                              {selectedMonthStatus && (
                                <span
                                  className={`badge ms-2 ${
                                    selectedMonthStatus === "paid" ? "bg-success" :
                                    selectedMonthStatus === "pending" ? "bg-warning" :
                                    selectedMonthStatus ? "bg-danger" : "bg-secondary"
                                  }`}
                                  aria-label={`Status: ${selectedMonthStatus || "Not Generated"}`}
                                >
                                  {selectedMonthStatus ? selectedMonthStatus.charAt(0).toUpperCase() + selectedMonthStatus.slice(1) : "Not Generated"}
                                </span>
                              )}
                            </strong>
                          </div>
                        );
                      }}
                    />
                  </Modal>
                  <Modal
                    title={`Update Due Date - ${editingFeeSummary?.student.name || "All Students"} (${editingFeeSummary?.month || "N/A"})`}
                    open={isEditModalVisible}
                    onOk={handleUpdateDueDate}
                    onCancel={handleEditModalClose}
                    okText="Update"
                    cancelText="Cancel"
                    zIndex={10000}
                  >
                    <Form.Item label="New Due Date" rules={[{ required: true, message: 'Please select a new due date' }]}>
                      <input
                        type="date"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        style={{ width: "100%", height: "100%", padding: "8px" }}
                        disabled={loading}
                      />
                    </Form.Item>
                  </Modal>
                 <Modal
  title={`Edit Fees - ${editingFeeRecord?.student.name || "N/A"} (${editingFeeRecord?.month || "N/A"})`}
  open={isEditFeesModalVisible}
  onCancel={handleEditFeesModalClose}
  footer={null}
  width={800}
  style={{ top: 50 }}
  zIndex={10000}
>
  <Form form={form} layout="vertical">
    <Table
      dataSource={editingFees}
      rowKey={(record) => record?.feesGroup?._id}
      pagination={false}
      columns={[
        {
          title: "Fee Group",
          dataIndex: ["feesGroup", "name"],
          key: "feesGroup",
          render: (name, record, index) => (
            <>
              <Form.Item
                name={["fees", index, "feesGroupId"]}
                initialValue={record.feesGroup._id}
                noStyle
                rules={[{ required: true, message: "Fee group ID is required" }]}
              >
                <input type="hidden" />
              </Form.Item>
              <span>{name || "N/A"}</span>
            </>
          ),
        },
        {
          title: "Amount",
          dataIndex: "amount",
          key: "amount",
          render: (value, record, index) => (
            <Form.Item
              name={["fees", index, "amount"]}
              rules={[{ required: true, message: "Please enter the amount" }]}
              initialValue={value || 0}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                onChange={(val) => {
                  const updated = [...editingFees];
                  updated[index].amount = Number(val) || 0;
                  updated[index].netPayable = updated[index].amount - (updated[index].discount || 0);
                  setEditingFees(updated);
                  form.setFieldsValue({
                    fees: updated.map((fee, i) => ({
                      feesGroupId: fee.feesGroup._id,
                      amount: i === index ? Number(val) || 0 : fee.amount,
                      discount: fee.discount || 0,
                    })),
                  });
                }}
              />
            </Form.Item>
          ),
        },
        // {
        //   title: "Discount",
        //   dataIndex: "discount",
        //   key: "discount",
        //   render: (value, record, index) => (
        //     <Form.Item
        //       name={["fees", index, "discount"]}
        //       rules={[{ required: true, message: "Please enter the discount" }]}
        //       initialValue={value || 0}
        //     >
        //       <InputNumber
        //         min={0}
        //         style={{ width: "100%" }}
        //         onChange={(val) => {
        //           const updated = [...editingFees];
        //           updated[index].discount = Number(val) || 0;
        //           updated[index].netPayable = (updated[index].amount || 0) - (Number(val) || 0);
        //           setEditingFees(updated);
        //           form.setFieldsValue({
        //             fees: updated.map((fee, i) => ({
        //               feesGroupId: fee.feesGroup._id,
        //               amount: fee.amount || 0,
        //               discount: i === index ? Number(val) || 0 : fee.discount,
        //             })),
        //           });
        //         }}
        //       />
        //     </Form.Item>
        //   ),
        // },
        // {
        //   title: "Net Payable",
        //   dataIndex: "netPayable",
        //   key: "netPayable",
        //   render: (value) => <span>₹{value?.toFixed(0) || 0}</span>,
        // },
      ]}
      footer={() => {
        const total = editingFees.reduce((sum, fee) => sum + (fee.netPayable || 0), 0);
        return (
          <div className="text-right">
            <strong>
              Total Net Payable: ₹{total.toFixed(2)}
              {editingFeeRecord?.status && (
                <span
                  className={`badge ms-2 ${
                    editingFeeRecord.status === "paid"
                      ? "bg-success"
                      : editingFeeRecord.status === "pending"
                      ? "bg-warning"
                      : "bg-danger"
                  }`}
                >
                  {editingFeeRecord.status.charAt(0).toUpperCase() + editingFeeRecord.status.slice(1)}
                </span>
              )}
            </strong>
          </div>
        );
      }}
    />
    <div className="text-right mt-4">
      <Button onClick={handleEditFeesModalClose} style={{ marginRight: 8 }}>
        Cancel
      </Button>
      <Button type="primary" onClick={handleEditFeesSubmit}>
        Save Changes
      </Button>
    </div>
  </Form>
</Modal>
                  <Modal
                    title={selectedTally.length > 0 && selectedTally[0]?.tally?.months ? `Tally for ${selectedTally[0].tally.months.join(", ")}` : "Tally"}
                    open={isTallyModalVisible}
                    onCancel={handleTallyModalClose}
                    footer={null}
                    width={600}
                    style={{ top: 50 }}
                    zIndex={10000}
                  >
                    <Table
                      dataSource={selectedTally || []}
                      columns={tallyColumns}
                      rowKey={(row: Tally) => row.student._id || Math.random().toString()}
                      pagination={false}
                    />
                  </Modal>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="alert alert-info mx-3" role="alert">
                    {selectedStudentId && selectedMonths.length > 0 && generationMode === "single"
                      ? `No fees data available for ${selectedStudent?.name || "Unknown"} in ${selectedMonths.join(", ")}. Set due date and click Generate Fees to generate fees or view available fee groups.`
                      : selectedStudentId && generationMode === "single"
                        ? "No generated fees found for this student"
                        : selectedClass
                          ? "No students found for this class."
                          : "Please select a class and session to view fees data."}
                  </p>
                </div>
              )}
            </Spin>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateStudentFees;