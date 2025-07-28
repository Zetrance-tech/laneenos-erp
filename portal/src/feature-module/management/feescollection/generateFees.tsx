import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Spin,
  Select,
  Table,
  Button,
  Form,
  Modal,
  Radio,
  Tooltip,
  InputNumber,
} from "antd";
import { all_routes } from "../../router/all_routes";
import moment from "moment";
import TooltipOption from "../../../core/common/tooltipOption";
import { useAuth } from "../../../context/AuthContext";
import { useMemo } from "react";
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
  quarterlyGroupId?: string;
  periodicity: "Monthly" | "Quarterly";
}

interface TallyData {
  totalAmount: number;
  totalNetPayable: number;
  feesByMonth: {
    [month: string]: GeneratedFee[];
  };
  generationGroupId?: string;
  quarterlyGroupId?: string;
  periodicity: "Monthly" | "Quarterly";
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
  quarterlyGroupId?: string;
  periodicity: "Monthly" | "Quarterly";
}

interface FeeTableRow {
  key: string;
  student: {
    _id?: string;
    name: string;
    admissionNumber: string;
  };
  month: string;
  totalAmount: number | 0;
  totalNetPayable: number | 0;
  dueDate?: string;
  generatedAt?: string;
  status?: string;
  feeDetails: GeneratedFee[];
  generationGroupId?: string;
  quarterlyGroupId?: string;
  periodicity: "Monthly" | "Quarterly";
}

interface GenerationGroup {
  generationGroupId: string;
  quarterlyGroupId?: string;
  periodicity: "Monthly" | "Quarterly";
  months: string[];
  generatedAt: string;
  tally: Tally[];
}

const API_URL = process.env.REACT_APP_URL;

const GenerateStudentFees: React.FC = () => {
  const routes = all_routes;
  const { token, user } = useAuth();
  const [quarterlyStudentIds, setQuarterlyStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<
    "Monthly" | "Quarterly" | undefined
  >(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedViewStudentId, setSelectedViewStudentId] =
    useState<string>("");
  const [generatedMonths, setGeneratedMonths] = useState<string[]>([]);
  const [selectedViewMonths, setSelectedViewMonths] = useState<string[]>([]);
  const [viewPeriodicity, setViewPeriodicity] = useState<
    "Monthly" | "Quarterly" | "All"
  >("All");
  const [monthlyFees, setMonthlyFees] = useState<FeeTableRow[]>([]);
  const [allFees, setAllFees] = useState<FeeTableRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<
    "All" | "Generated" | "Not Generated"
  >("All");

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedFeeDetails, setSelectedFeeDetails] = useState<GeneratedFee[]>(
    []
  );
  const [selectedMonthStatus, setSelectedMonthStatus] = useState<
    string | undefined
  >(undefined);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [editingFeeSummary, setEditingFeeSummary] =
    useState<FeeTableRow | null>(null);
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [isEditFeesModalVisible, setIsEditFeesModalVisible] =
    useState<boolean>(false);
  const [editingFees, setEditingFees] = useState<GeneratedFee[]>([]);
  const [editingFeeRecord, setEditingFeeRecord] = useState<FeeTableRow | null>(
    null
  );
  const [form] = Form.useForm();
  const [generateMode, setGenerateMode] = useState<"single" | "class">(
    "single"
  );
  const [isTallyModalVisible, setIsTallyModalVisible] =
    useState<boolean>(false);
  const [selectedTally, setSelectedTally] = useState<Tally[]>([]);
  const [generationGroups, setGenerationGroups] = useState<GenerationGroup[]>(
    []
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isGenerateModalVisible, setIsGenerateModalVisible] =
    useState<boolean>(false);
  const [generateStudentId, setGenerateStudentId] = useState<string>("");
  const [generateMonths, setGenerateMonths] = useState<string[]>([]);
  const [generatePeriodicity, setGeneratePeriodicity] = useState<
    "Monthly" | "Quarterly"
  >("Monthly");
  const [generateDueDate, setGenerateDueDate] = useState<moment.Moment | null>(
    null
  );

  const months = [
    { value: "Apr", label: "April" },
    { value: "May", label: "May" },
    { value: "Jun", label: "June" },
    { value: "Jul", label: "July" },
    { value: "Aug", label: "August" },
    { value: "Sep", label: "September" },
    { value: "Oct", label: "October" },
    { value: "Nov", label: "November" },
    { value: "Dec", label: "December" },
    { value: "Jan", label: "January" },
    { value: "Feb", label: "February" },
    { value: "Mar", label: "March" },
  ];

  const quarters = [
    { value: "Q1", label: "Q1 (Apr, May, Jun)", months: ["Apr", "May", "Jun"] },
    { value: "Q2", label: "Q2 (Jul, Aug, Sep)", months: ["Jul", "Aug", "Sep"] },
    { value: "Q3", label: "Q3 (Oct, Nov, Dec)", months: ["Oct", "Nov", "Dec"] },
    { value: "Q4", label: "Q4 (Jan, Feb, Mar)", months: ["Jan", "Feb", "Mar"] },
  ];

  
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const getAvailableStudentsForMonthly = useMemo(() => {
    if (!students.length) return [];

    // Filter out students who have ANY quarterly fees
    const monthlyOnlyStudents = students.filter((student) => {
      // Check if this student has any quarterly fees across all sessions
      const hasQuarterlyFees = quarterlyStudentIds.has(student._id);
      return !hasQuarterlyFees;
    });

    return monthlyOnlyStudents;
  }, [students, quarterlyStudentIds]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Session[]>(
        `${API_URL}/api/session/get`,
        config
      );
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
      const response = await axios.get<Class[]>(
        `${API_URL}/api/class/session/${selectedSession}`,
        config
      );
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
      type StrictMonthlyFeesSummary = {
        student: {
          _id: string;
          name: string;
          admissionNumber: string;
        };
        month: string;
        totalAmount: number | null | undefined;
        totalNetPayable: number | null | undefined;
        dueDate?: string;
        generatedAt?: string;
        status?: string;
        feeDetails: GeneratedFee[];
        generationGroupId?: string;
        quarterlyGroupId?: string;
        periodicity: "Monthly" | "Quarterly";
      };

      const response = await axios.get<StrictMonthlyFeesSummary[]>(
        `${API_URL}/api/studentFees/class/${selectedClass}/session/${selectedSession}/generated-summary`,
        config
      );
      const feesData = response.data || [];

      const aggregatedFees = feesData.reduce(
        (acc, summary: StrictMonthlyFeesSummary) => {
          if (summary.periodicity === "Quarterly" && summary.quarterlyGroupId) {
            const key = `${summary.student._id}-${summary.quarterlyGroupId}`;
            if (!acc[key]) {
              acc[key] = {
                key,
                student: summary.student,
                month: summary.month,
                totalAmount: 0,
                totalNetPayable: 0,
                dueDate: summary.dueDate,
                generatedAt: summary.generatedAt,
                status: summary.status ?? undefined,
                feeDetails: [],
                generationGroupId: summary.generationGroupId,
                quarterlyGroupId: summary.quarterlyGroupId,
                periodicity: summary.periodicity,
              } as FeeTableRow;
            }
            const currentEntry = acc[key];
            const amount =
              summary.totalAmount != null ? Number(summary.totalAmount) : 0;
            const netPayable =
              summary.totalNetPayable != null
                ? Number(summary.totalNetPayable)
                : 0;
            if (isNaN(amount) || isNaN(netPayable)) {
              console.warn(
                `Invalid amount or netPayable for student ${summary.student._id}, month ${summary.month}`
              );
              return acc;
            }
            currentEntry.totalAmount += amount;
            currentEntry.totalNetPayable += netPayable;
            currentEntry.feeDetails.push(
              ...(Array.isArray(summary.feeDetails) ? summary.feeDetails : [])
            );
            if (
              !currentEntry.status ||
              currentEntry.status === "paid" ||
              (currentEntry.status === "partially_paid" &&
                summary.status === "pending")
            ) {
              currentEntry.status = summary.status ?? undefined;
            }
            return acc;
          }
          const feeDetails = Array.isArray(summary.feeDetails)
            ? summary.feeDetails
            : [];
          acc[`${summary.student._id}-${summary.month}`] = {
            key: `${summary.student._id}-${summary.month}`,
            student: summary.student,
            month: summary.month,
            totalAmount: feeDetails.reduce(
              (sum, fee) => sum + (Number(fee.amount) || 0),
              0
            ),
            totalNetPayable: feeDetails.reduce((sum, fee) => {
              const netPayable = Number(
                fee.netPayable ??
                  Number(fee.amount) - (Number(fee.discount) || 0)
              );
              return sum + netPayable;
            }, 0),
            dueDate: summary.dueDate,
            generatedAt: summary.generatedAt,
            status: summary.status ?? undefined,
            feeDetails,
            generationGroupId: summary.generationGroupId,
            quarterlyGroupId: summary.quarterlyGroupId,
            periodicity: summary.periodicity,
          };
          return acc;
        },
        {} as Record<string, FeeTableRow>
      );

      const transformedFees = Object.values(aggregatedFees);
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
    if (!selectedViewStudentId || !selectedSession) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<string[]>(
        `${API_URL}/api/studentFees/months/${selectedViewStudentId}?sessionId=${selectedSession}`,
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
    if (
      !selectedSession ||
      (!selectedViewStudentId && generateMode === "single") ||
      (!selectedClass && generateMode === "class")
    )
      return;
    setLoading(true);
    setError(null);
    try {
      const params: any = { sessionId: selectedSession };
      if (generateMode === "single") {
        params.studentId = selectedViewStudentId;
      } else {
        params.classId = selectedClass;
      }
      const response = await axios.get<GenerationGroup[]>(
        `${API_URL}/api/studentFees/generation-groups`,
        { ...config, params }
      );
      const groupData = response.data || [];
      const sortedGroups = groupData.sort(
        (a, b) =>
          new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      );
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
    if (
      !generateMonths.length ||
      !generateDueDate ||
      !selectedClass ||
      !selectedSession
    ) {
      toast.error(
        "Please select a class, session, at least one month/quarter, periodicity, and due date"
      );
      return;
    }
    if (generateMode === "single" && !generateStudentId) {
      toast.error("Please select a student for single student mode");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let response;
      const actualMonths =
        generatePeriodicity === "Quarterly"
          ? generateMonths.flatMap(
              (q) =>
                quarters.find((quarter) => quarter.value === q)?.months || []
            )
          : generateMonths;
      if (generateMode === "single") {
        const payload = {
          studentId: generateStudentId,
          sessionId: selectedSession,
          months: actualMonths,
          dueDate: generateDueDate.toISOString(),
          generatedAt: new Date().toISOString(),
          periodicity: generatePeriodicity,
        };
        response = await axios.post(
          `${API_URL}/api/studentFees/fees/generate`,
          payload,
          config
        );
        toast.success("Fees generated successfully for the student");
      } else {
        const payload = {
          classId: selectedClass,
          sessionId: selectedSession,
          months: actualMonths,
          dueDate: generateDueDate.toISOString(),
          generatedAt: new Date().toISOString(),
          periodicity: generatePeriodicity,
        };
        response = await axios.post(
          `${API_URL}/api/studentFees/fees/generate-class`,
          payload,
          config
        );
        toast.success("Fees generated successfully for the class");
      }
      fetchGeneratedFeesForClass();
      if (generateMode === "single") fetchGeneratedMonths();
      fetchGenerationGroups();
      setIsGenerateModalVisible(false);
      setGenerateMonths([]);
      setGenerateDueDate(null);
      setGenerateStudentId("");
      setGeneratePeriodicity("Monthly");
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : `Failed to generate fees for ${
            generateMode === "single" ? "student" : "class"
          }`;
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
      // Handle months properly for both Monthly and Quarterly
      let monthsToUpdate: string[];

      if (editingFeeSummary.periodicity === "Quarterly") {
        // For quarterly, find the actual months from the quarter
        const quarter = quarters.find(
          (q) => q.value === editingFeeSummary.month
        );
        monthsToUpdate = quarter ? quarter.months : [editingFeeSummary.month];
      } else {
        // For monthly, just use the single month
        monthsToUpdate = [editingFeeSummary.month];
      }

      const payload = {
        studentId: editingFeeSummary.student._id,
        sessionId: selectedSession,
        months: monthsToUpdate, // Send array of actual months
        dueDate: moment(newDueDate).format("YYYY-MM-DD"),
        periodicity: editingFeeSummary.periodicity,
        quarterlyGroupId: editingFeeSummary.quarterlyGroupId,
      };

      await axios.patch(
        `${API_URL}/api/studentFees/update-due-date`,
        payload,
        config
      );

      toast.success("Fee due date updated successfully");
      fetchGeneratedFeesForClass();
      setIsEditModalVisible(false);
      setEditingFeeSummary(null);
      setNewDueDate("");
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
    setEditingFees(
      record.feeDetails.map((fee) => ({
        ...fee,
        amount: fee.amount || 0,
        originalAmount: fee.originalAmount || fee.amount || 0,
        discount: fee.discount || 0,
      }))
    );
    setIsEditFeesModalVisible(true);
    form.setFieldsValue({
      fees: record.feeDetails.map((fee) => ({
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

      const updatedFees = values.fees.map((fee: any) => ({
        feesGroup: fee.feesGroupId,
        amount: Number(fee.amount) || 0,
        originalAmount: Number(fee.amount) || 0,
        discount: Number(fee.discount) || 0,
      }));

      // Handle months properly for both Monthly and Quarterly
      let monthsToUpdate: string[];

      if (editingFeeRecord.periodicity === "Quarterly") {
        // For quarterly, find the actual months from the quarter
        const quarter = quarters.find(
          (q) => q.value === editingFeeRecord.month
        );
        monthsToUpdate = quarter ? quarter.months : [editingFeeRecord.month];
      } else {
        // For monthly, just use the single month
        monthsToUpdate = [editingFeeRecord.month];
      }

      const payload = {
        studentId: editingFeeRecord.student._id,
        sessionId: selectedSession,
        months: monthsToUpdate, // Now correctly sending array of actual months
        fees: updatedFees,
        periodicity: editingFeeRecord.periodicity,
        quarterlyGroupId: editingFeeRecord.quarterlyGroupId, // Add this for quarterly fees
      };

      setLoading(true);
      setError(null);

      const response = await axios.patch(
        `${API_URL}/api/studentFees/edit-fees-month`,
        payload,
        config
      );

      toast.success(response.data.message || "Fees updated successfully");
      fetchGeneratedFeesForClass();
      if (generateMode === "single") fetchGeneratedMonths();
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
      const monthsToDelete =
        record.periodicity === "Quarterly"
          ? quarters.find((quarter) => quarter.value === record.month)
              ?.months || [record.month]
          : [record.month];
      console.log("monthsToDelete:", monthsToDelete); // Debug the months being sent
      const payload = {
        studentId: record.student._id,
        sessionId: selectedSession,
        months: monthsToDelete,
      };
      console.log("Delete payload:", payload);
      await axios.put(
        `${API_URL}/api/studentFees/delete-generated-fees`,
        payload,
        config
      );
      toast.success("Generated fees deleted successfully");
      fetchGeneratedFeesForClass();
      if (generateMode === "single") fetchGeneratedMonths();
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

  const handleViewDetails = (
    feeDetails: GeneratedFee[],
    status?: string,
    periodicity?: "Monthly" | "Quarterly"
  ) => {
    if (!feeDetails || feeDetails.length === 0) {
      console.warn("No fee details available to display", {
        feeDetails,
        status,
      });
      toast.error("No fee details available for this record");
      return;
    }
    console.log("Here", feeDetails);
    setSelectedFeeDetails(feeDetails);
    setSelectedMonthStatus(status);
    setSelectedPeriodicity(periodicity);
    setIsModalVisible(true);
  };

  const handleEditDueDate = (record: FeeTableRow) => {
    setEditingFeeSummary(record);
    setNewDueDate(
      record.dueDate ? moment(record.dueDate).format("YYYY-MM-DD") : ""
    );
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

  const handleGenerateModalOpen = () => {
    setIsGenerateModalVisible(true);
  };

  const handleGenerateModalClose = () => {
    setIsGenerateModalVisible(false);
    setGenerateMonths([]);
    setGenerateDueDate(null);
    setGenerateStudentId("");
    setGeneratePeriodicity("Monthly");
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
      setSelectedViewStudentId("");
      setGeneratedMonths([]);
      setSelectedViewMonths([]);
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
      setSelectedViewStudentId("");
      setGeneratedMonths([]);
      setSelectedViewMonths([]);
      setGenerationGroups([]);
      setSelectedGroupId("");
      setError(null);
    }
  }, [selectedClass, selectedSession]);
  useEffect(() => {
    if (selectedClass && selectedSession && students.length > 0) {
      let filteredFees: FeeTableRow[] = [];
      console.log("selectedStatus in useEffect:", selectedStatus);
      // Identify students with any quarterly fees
      const newQuarterlyStudentIds = new Set<string>(
        allFees
          .filter(
            (fee): fee is FeeTableRow & { quarterlyGroupId: string } =>
              fee.periodicity === "Quarterly" && !!fee.quarterlyGroupId
          )
          .map((fee) => fee.student._id ?? "")
          .filter((id): id is string => !!id)
      );
      setQuarterlyStudentIds(newQuarterlyStudentIds);

      // Determine display periods based on periodicity
      const displayPeriods =
        viewPeriodicity === "Quarterly" || viewPeriodicity === "All"
          ? quarters
          : months.map((m) => ({
              value: m.value,
              months: [m.value],
              label: m.label,
            }));

      // Populate fees based on periodicity filter
      students.forEach((student) => {
        const isQuarterlyStudent = newQuarterlyStudentIds.has(student._id);

        // Skip students based on periodicity filter
        if (viewPeriodicity === "Monthly" && isQuarterlyStudent) return;
        if (viewPeriodicity === "Quarterly" && !isQuarterlyStudent) return;
        if (selectedViewStudentId && student._id !== selectedViewStudentId)
          return;

        displayPeriods.forEach((period) => {
          // For quarterly students (in "Quarterly" or "All" view), process entire quarters
          if (
            (viewPeriodicity === "Quarterly" || viewPeriodicity === "All") &&
            isQuarterlyStudent
          ) {
            // Find all existing fees for the quarter's months
            const quarterFees = period.months
              .map((month) =>
                allFees.find(
                  (fee): fee is FeeTableRow =>
                    fee.student._id === student._id &&
                    fee.month === month &&
                    fee.periodicity === "Quarterly"
                )
              )
              .filter((fee): fee is FeeTableRow => !!fee);

            // If there are any fees in the quarter or the student is quarterly, include a record
            const existingFee = quarterFees[0];
            const isQuarterlyRecord =
              quarterFees.length > 0 || isQuarterlyStudent;

            if (
              (viewPeriodicity === "Quarterly" || viewPeriodicity === "All") &&
              isQuarterlyRecord
            ) {
              const feeRow: FeeTableRow = {
                key: `${student._id}_${period.value}`,
                student: {
                  _id: student._id,
                  name: student.name,
                  admissionNumber: student.admissionNumber,
                },
                month: period.value, // Use quarter value (e.g., Q1)
                totalAmount: quarterFees.reduce(
                  (sum, fee) => sum + (fee.totalAmount || 0),
                  0
                ),
                totalNetPayable: quarterFees.reduce(
                  (sum, fee) => sum + (fee.totalNetPayable || 0),
                  0
                ),
                dueDate: existingFee?.dueDate,
                generatedAt: existingFee?.generatedAt,
                status: existingFee?.status,
                feeDetails: quarterFees.flatMap((fee) => fee.feeDetails),
                periodicity: "Quarterly" as const, // Explicitly type as "Quarterly"
                quarterlyGroupId: existingFee?.quarterlyGroupId,
              };
              // Apply status filter
              if (
                selectedStatus === "All" ||
                (selectedStatus === "Generated" && feeRow.generatedAt) ||
                (selectedStatus === "Not Generated" && !feeRow.generatedAt)
              ) {
                filteredFees.push(feeRow);
              }
            }
          } else if (
            viewPeriodicity === "Monthly" ||
            (viewPeriodicity === "All" && !isQuarterlyStudent)
          ) {
            // For monthly view or "All" with non-quarterly students, process individual months
            const month = period.months[0]; // Single month for monthly view
            const existingFee = allFees.find(
              (fee): fee is FeeTableRow =>
                fee.student._id === student._id && fee.month === month
            );

            if (
              viewPeriodicity === "All" ||
              (viewPeriodicity === "Monthly" &&
                !isQuarterlyStudent &&
                (!existingFee || existingFee.periodicity === "Monthly"))
            ) {
              const feeRow: FeeTableRow = existingFee || {
                key: `${student._id}_${month}`,
                student: {
                  _id: student._id,
                  name: student.name,
                  admissionNumber: student.admissionNumber,
                },
                month,
                totalAmount: 0,
                totalNetPayable: 0,
                dueDate: undefined,
                generatedAt: undefined,
                status: undefined,
                feeDetails: [],
                periodicity: "Monthly" as const, // Explicitly type as "Monthly"
                quarterlyGroupId: undefined,
              };
              // Apply status filter
              if (
                selectedStatus === "All" ||
                (selectedStatus === "Generated" && feeRow.generatedAt) ||
                (selectedStatus === "Not Generated" && !feeRow.generatedAt)
              ) {
                filteredFees.push(feeRow);
              }
            }
          }
        });
      });

      // Apply month/quarter filter if selected
      if (selectedViewMonths.length > 0) {
        const actualMonths =
          viewPeriodicity === "Quarterly" || viewPeriodicity === "All"
            ? selectedViewMonths.flatMap(
                (q) =>
                  quarters.find((quarter) => quarter.value === q)?.months || []
              )
            : selectedViewMonths;
        filteredFees = filteredFees.filter((fee) =>
          fee.periodicity === "Quarterly"
            ? quarters
                .find((q) => q.value === fee.month)
                ?.months.some((m) => actualMonths.includes(m))
            : actualMonths.includes(fee.month)
        );
      }

      setMonthlyFees(filteredFees);
    } else {
      setMonthlyFees([]);
      setQuarterlyStudentIds(new Set());
    }
  }, [
    selectedSession,
    selectedClass,
    students,
    allFees,
    viewPeriodicity,
    selectedViewMonths,
    selectedViewStudentId,
    selectedStatus,
  ]);
  const summaryColumns = [
    {
      title: "Student Name",
      dataIndex: "student",
      render: (student: { name: string; admissionNumber: string }) => (
        <div>
          <div>{student?.name || "N/A"}</div>
          <small className="text-muted">
            ({student?.admissionNumber || "N/A"})
          </small>
        </div>
      ),
      sorter: (a: FeeTableRow, b: FeeTableRow) =>
        a.student.name.localeCompare(b.student.name),
    },
    {
      title: "Month",
      dataIndex: "month",
      render: (month: string, record: FeeTableRow) => {
      const monthMap: { [key: string]: string } = {
        Apr: "April",
        May: "May",
        Jun: "June",
        Jul: "July",
        Aug: "August",
        Sep: "September",
        Oct: "October",
        Nov: "November",
        Dec: "December",
        Jan: "January",
        Feb: "February",
        Mar: "March",
      };
      if (record.periodicity === "Quarterly") {
        const quarter = quarters.find((q) => q.value === month);
        return (
          <span style={{ color: "black" }}>
            {quarter
              ? `Quarter ${quarter.value.slice(1)} (${quarter.months
                  .map((m) => monthMap[m] || m)
                  .join(" ")})`
              : month || "N/A"}
          </span>
        );
      }
      return <span style={{ color: "black" }}>{monthMap[month] || month || "N/A"}</span>;
    },
      sorter: (a: FeeTableRow, b: FeeTableRow) =>
        a.month.localeCompare(b.month),
    },
    {
      title: "Periodicity",
      dataIndex: "periodicity",
      render: (periodicity: string) => <span>{periodicity || "Monthly"}</span>,
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      render: (totalAmount: number | null, record: FeeTableRow) => (
        <span>
          {record.generatedAt && totalAmount !== null
            ? `₹${totalAmount.toFixed(2)}`
            : "-"}
        </span>
      ),
      sorter: (a: FeeTableRow, b: FeeTableRow) =>
        (a.totalAmount || 0) - (b.totalAmount || 0),
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
        <span>
          {generatedAt
            ? moment(generatedAt).format("YYYY-MM-DD HH:mm:ss")
            : "-"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status?: string) => (
        <span
          className={`badge ${
            status === "paid"
              ? "bg-success"
              : status === "pending"
              ? "bg-warning"
              : status
              ? "bg-danger"
              : "bg-secondary"
          }`}
        >
          {status
            ? status.charAt(0).toUpperCase() + status.slice(1)
            : "Not Generated"}
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
                onClick={() =>
                  handleViewDetails(
                    record.feeDetails,
                    record.status,
                    record.periodicity
                  )
                }
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
                    disabled={
                      record.status === "paid" ||
                      record.status === "partially_paid"
                    }
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
      title: "Periodicity",
      dataIndex: "tally",
      render: (tally: TallyData) => (
        <span>{tally.periodicity || "Monthly"}</span>
      ),
    },
    {
      title: "Total Amount",
      dataIndex: "tally",
      render: (tally: TallyData) => (
        <span>₹{tally.totalAmount.toFixed(2)}</span>
      ),
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
            <Tooltip title="Generate fees for selected students or class">
              <Button
                type="primary"
                onClick={handleGenerateModalOpen}
                disabled={!selectedClass || !selectedSession || loading}
              >
                Generate Fees
              </Button>
            </Tooltip>
          </div>
        </div>
        <div className="card">
          <div className="card-header pb-0">
            <h4 className="mb-3">View Fees Status</h4>
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
              <Form.Item label="Periodicity">
                <Select
                  placeholder="Select periodicity"
                  value={viewPeriodicity}
                  onChange={(value: "Monthly" | "Quarterly" | "All") => {
                    setViewPeriodicity(value);
                    setSelectedViewMonths([]);
                    setSelectedViewStudentId("");
                  }}
                  style={{ width: 150 }}
                  options={[
                    { value: "All", label: "All" },
                    { value: "Monthly", label: "Monthly" },
                    { value: "Quarterly", label: "Quarterly" },
                  ]}
                  disabled={loading}
                />
              </Form.Item>
              <Form.Item label="Student">
                <Select
                  showSearch
                  placeholder="Select student"
                  value={selectedViewStudentId || undefined}
                  onChange={(value: string) => setSelectedViewStudentId(value)}
                  style={{ width: 220 }}
                  options={[
                    { value: "", label: "All Students" },
                    ...(students || [])
                      .filter((student) => {
                        const isQuarterlyStudent = quarterlyStudentIds.has(
                          student._id
                        );
                        return (
                          viewPeriodicity === "All" ||
                          (viewPeriodicity === "Quarterly" &&
                            isQuarterlyStudent) ||
                          (viewPeriodicity === "Monthly" && !isQuarterlyStudent)
                        );
                      })
                      .map((student) => ({
                        value: student._id,
                        label: `${student.name} (${student.admissionNumber})`,
                      })),
                  ]}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  disabled={!selectedClass || loading}
                  allowClear
                />
              </Form.Item>
              <Form.Item
                label={viewPeriodicity === "Quarterly" ? "Quarters" : "Months"}
              >
                <Select
                  mode="multiple"
                  placeholder={
                    viewPeriodicity === "Quarterly"
                      ? "Select quarters"
                      : "Select months"
                  }
                  value={selectedViewMonths || []}
                  onChange={(value: string[]) =>
                    setSelectedViewMonths(value || [])
                  }
                  style={{ width: 200 }}
                  options={viewPeriodicity === "Quarterly" ? quarters : months}
                  disabled={
                    !selectedClass || loading || viewPeriodicity === "All"
                  }
                  allowClear
                  dropdownStyle={{ color: "black" }}
                  tagRender={(props) => (
                    <span
                      style={{
                        color: "black",
                        backgroundColor: "#f5f5f5",
                        padding: "2px 8px",
                        margin: "2px",
                        borderRadius: "4px",
                      }}
                    >
                      {props.label}
                    </span>
                  )}
                />
              </Form.Item>
              <Form.Item label="Status">
                <Select
                  placeholder="Select status"
                  value={selectedStatus}
                  onChange={(value: "All" | "Generated" | "Not Generated") =>
                    setSelectedStatus(value)
                  }
                  style={{ width: 150 }}
                  options={[
                    { value: "All", label: "All" },
                    { value: "Generated", label: "Generated" },
                    { value: "Not Generated", label: "Not Generated" },
                  ]}
                  disabled={loading}
                />
              </Form.Item>
            </div>
            {(generationGroups || []).length > 0 && (
              <div className="mt-3">
                <h5>View Tally for Generated Fees</h5>
                <Form.Item label="Select Generation Group">
                  <Select
                    placeholder="Select a generation group"
                    value={selectedGroupId || undefined}
                    onChange={(value: string) => {
                      setSelectedGroupId(value);
                      const group = generationGroups.find(
                        (g) => g.generationGroupId === value
                      );
                      handleViewTally(group?.tally || []);
                    }}
                    style={{ width: 300 }}
                    options={(generationGroups || []).map((group) => ({
                      value: group.generationGroupId,
                      label: `${group.months.join(", ")} (${
                        group.periodicity
                      }) - ${moment(group.generatedAt).format(
                        "MMM DD, YYYY HH:mm"
                      )}`,
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
  {selectedViewMonths.length > 0 &&
    ` - ${
      viewPeriodicity === "Quarterly"
        ? selectedViewMonths
            .map(
              (q) =>
                quarters.find((quarter) => quarter.value === q)?.label || q
            )
            .join(", ")
        : selectedViewMonths
            .map((month) => {
              const monthMap: { [key: string]: string } = {
                Apr: "April",
                May: "May",
                Jun: "June",
                Jul: "July",
                Aug: "August",
                Sep: "September",
                Oct: "October",
                Nov: "November",
                Dec: "December",
                Jan: "January",
                Feb: "February",
                Mar: "March",
              };
              return monthMap[month] || month;
            })
            .join(", ")
    }`}
  {selectedViewStudentId &&
    ` - ${
      students.find((s) => s._id === selectedViewStudentId)?.name || "Unknown"
    }`}
</h5>
                  <Table
                    dataSource={monthlyFees || []}
                    columns={summaryColumns}
                    rowKey="key"
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                  />
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="alert alert-info mx-3" role="alert">
                    {selectedClass
                      ? "No students found for this class or no fees match the selected filters."
                      : "Please select a class and session to view fees data."}
                  </p>
                </div>
              )}
            </Spin>
          </div>
        </div>
        <Modal
          title="Generate Fees"
          open={isGenerateModalVisible}
          onCancel={handleGenerateModalClose}
          footer={null}
          width={650}
          style={{ top: 50 }}
          zIndex={10000}
        >
          <div className="p-3">
            <Form
              labelCol={{ style: { width: 140 } }}
              wrapperCol={{ style: { flex: 1 } }}
              colon={false}
              layout="horizontal"
            >
              <Form.Item label="Generate For">
                <Tooltip
                  title={
                    generateMode === "single"
                      ? "Generate fees for a single student"
                      : "Generate fees for all students in the class"
                  }
                >
                  <Radio.Group
                    value={generateMode}
                    onChange={(e) => {
                      setGenerateMode(e.target.value);
                      setGenerateStudentId("");
                      setGenerateMonths([]);
                      setGenerateDueDate(null);
                    }}
                    disabled={loading}
                    style={{ width: 300 }}
                  >
                    <Radio value="single">Single Student</Radio>
                    <Radio value="class">Entire Class</Radio>
                  </Radio.Group>
                </Tooltip>
              </Form.Item>
      <Form.Item label="Periodicity">
        <Select
          placeholder="Select periodicity"
          value={generatePeriodicity}
          onChange={(value: "Monthly" | "Quarterly") => {
            setGeneratePeriodicity(value);
            setGenerateMonths([]);
            setGenerateStudentId("");
          }}
          style={{ width: 300 }}
          options={[
            { value: "Monthly", label: "Monthly" },
            { value: "Quarterly", label: "Quarterly" },
          ]}
          disabled={loading}
        />
      </Form.Item>

              {generateMode === "single" && (
                <Form.Item
                  label="Student"
                  extra={
                    generatePeriodicity === "Quarterly"
                      ? "Only students with a quarterly fee structure are eligible."
                      : undefined
                  }
                >
                  <Select
  showSearch
  placeholder="Select student"
  value={generateStudentId || undefined}
  onChange={(value: string) => setGenerateStudentId(value)}
  style={{ width: 300 }}
  options={(students || [])
    .filter((student) => {
      const isQuarterlyStudent = quarterlyStudentIds.has(student._id);
      
      // Show all students, but filter based on selected periodicity
      if (generatePeriodicity === "Monthly") {
        return !isQuarterlyStudent; // Only show monthly students
      } else if (generatePeriodicity === "Quarterly") {
        return true; // Show all students for quarterly (including monthly ones)
      }
      return true;
    })
    .map((student) => {
      const isQuarterlyStudent = quarterlyStudentIds.has(student._id);
      const typeLabel = isQuarterlyStudent ? "📊 Quarterly" : "📅 Monthly";
      
      return {
        value: student._id,
        label: `${student.name} (${student.admissionNumber}) - ${typeLabel}`,
      };
    })}
  filterOption={(input, option) =>
    (option?.label ?? "")
      .toLowerCase()
      .includes(input.toLowerCase())
  }
  disabled={!selectedClass || loading}
  allowClear
  notFoundContent={
    generatePeriodicity === "Monthly" ? 
    "No monthly students found. All students have quarterly fees." : 
    "No students found"
  }
/>
                </Form.Item>
              )}


              <Form.Item
                label={
                  generatePeriodicity === "Quarterly" ? "Quarters" : "Months"
                }
              >
                <Select
                  mode="multiple"
                  placeholder={
                    generatePeriodicity === "Quarterly"
                      ? "Select quarters"
                      : "Select months"
                  }
                  value={generateMonths || []}
                  onChange={(value: string[]) => setGenerateMonths(value || [])}
                  style={{ width: 300 }}
                  options={
                    generatePeriodicity === "Quarterly" ? quarters : months
                  }
                  disabled={
                    (!generateStudentId && generateMode === "single") ||
                    !selectedClass ||
                    loading
                  }
                  allowClear
                  dropdownStyle={{ color: "black" }}
                  tagRender={(props) => (
                    <span
                      style={{
                        color: "black",
                        backgroundColor: "#f5f5f5",
                        padding: "2px 8px",
                        margin: "2px",
                        borderRadius: "4px",
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
                  value={
                    generateDueDate
                      ? moment(generateDueDate).format("YYYY-MM-DD")
                      : ""
                  }
                  onChange={(e) =>
                    setGenerateDueDate(
                      e.target.value ? moment(e.target.value) : null
                    )
                  }
                  disabled={loading}
                  style={{ width: 300, padding: "4px" }}
                />
              </Form.Item>
            </Form>
            <div className="text-right mt-4">
              <Button
                onClick={handleGenerateModalClose}
                style={{ marginRight: 10 }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleGenerateFees}
                disabled={
                  !generateMonths.length ||
                  !generateDueDate ||
                  !selectedClass ||
                  (generateMode === "single" && !generateStudentId) ||
                  loading
                }
              >
                Generate for {generateMode === "single" ? "Student" : "Class"}
              </Button>
            </div>
          </div>
        </Modal>
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
            locale={{
              emptyText: "No fee details available",
            }}
            footer={() => {
              const totalAmount = (selectedFeeDetails || []).reduce(
                (sum: number, fee: GeneratedFee) =>
                  sum + (Number(fee.netPayable) || 0),
                0
              );
              return (
                <div className="text-right">
                  <strong>
                    Total Net Payable: ₹{totalAmount.toFixed(2)}
                    {selectedMonthStatus && (
                      <span
                        className={`badge ms-2 ${
                          selectedMonthStatus === "paid"
                            ? "bg-success"
                            : selectedMonthStatus === "pending"
                            ? "bg-warning"
                            : selectedMonthStatus
                            ? "bg-danger"
                            : "bg-secondary"
                        }`}
                        aria-label={`Status: ${
                          selectedMonthStatus || "Not Generated"
                        }`}
                      >
                        {selectedMonthStatus
                          ? selectedMonthStatus.charAt(0).toUpperCase() +
                            selectedMonthStatus.slice(1)
                          : "Not Generated"}
                      </span>
                    )}
                  </strong>
                </div>
              );
            }}
          />
        </Modal>
        <Modal
          title={`Update Due Date - ${
            editingFeeSummary?.student.name || "All Students"
          } (${editingFeeSummary?.month || "N/A"})`}
          open={isEditModalVisible}
          onOk={handleUpdateDueDate}
          onCancel={handleEditModalClose}
          okText="Update"
          cancelText="Cancel"
          zIndex={10000}
        >
          <Form.Item
            label="New Due Date"
            rules={[
              { required: true, message: "Please select a new due date" },
            ]}
          >
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
          title={`Edit Fees - ${editingFeeRecord?.student.name || "N/A"} (${
            editingFeeRecord?.month || "N/A"
          })`}
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
                        rules={[
                          {
                            required: true,
                            message: "Fee group ID is required",
                          },
                        ]}
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
                      rules={[
                        { required: true, message: "Please enter the amount" },
                      ]}
                      initialValue={value || 0}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                        onChange={(val) => {
                          const updated = [...editingFees];
                          updated[index].amount = Number(val) || 0;
                          updated[index].netPayable =
                            updated[index].amount -
                            (updated[index].discount || 0);
                          setEditingFees(updated);
                          form.setFieldsValue({
                            fees: updated.map((fee, i) => ({
                              feesGroupId: fee.feesGroup._id,
                              amount:
                                i === index ? Number(val) || 0 : fee.amount,
                              discount: fee.discount || 0,
                            })),
                          });
                        }}
                      />
                    </Form.Item>
                  ),
                },
                // Uncomment if discount and netPayable are needed:
                /*
        {
          title: "Discount",
          dataIndex: "discount",
          key: "discount",
          render: (value, record, index) => (
            <Form.Item
              name={["fees", index, "discount"]}
              rules={[{ required: true, message: "Please enter the discount" }]}
              initialValue={value || 0}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                onChange={(val) => {
                  const updated = [...editingFees];
                  updated[index].discount = Number(val) || 0;
                  updated[index].netPayable =
                    (updated[index].amount || 0) - (Number(val) || 0);
                  setEditingFees(updated);
                  form.setFieldsValue({
                    fees: updated.map((fee, i) => ({
                      feesGroupId: fee.feesGroup._id,
                      amount: fee.amount || 0,
                      discount: i === index ? Number(val) || 0 : fee.discount,
                    })),
                  });
                }}
              />
            </Form.Item>
          ),
        },
        {
          title: "Net Payable",
          dataIndex: "netPayable",
          key: "netPayable",
          render: (value) => <span>₹{value?.toFixed(0) || 0}</span>,
        },
        */
              ]}
              footer={() => {
                const total = editingFees.reduce(
                  (sum, fee) => sum + (fee.netPayable || 0),
                  0
                );
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
                          {editingFeeRecord.status.charAt(0).toUpperCase() +
                            editingFeeRecord.status.slice(1)}
                        </span>
                      )}
                    </strong>
                  </div>
                );
              }}
            />
            <div className="text-right mt-4">
              <Button
                onClick={handleEditFeesModalClose}
                style={{ marginRight: 8 }}
              >
                Cancel
              </Button>
              <Button type="primary" onClick={handleEditFeesSubmit}>
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal>

        <Modal
          title={
            selectedTally.length > 0 && selectedTally[0]?.tally?.months
              ? `Tally for ${selectedTally[0].tally.months.join(", ")}`
              : "Tally"
          }
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
    </div>
  );
};

export default GenerateStudentFees;
