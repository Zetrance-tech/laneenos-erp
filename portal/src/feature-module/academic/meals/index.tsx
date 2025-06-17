import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { all_routes } from "../../router/all_routes";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TooltipOption from "../../../core/common/tooltipOption";
import { Spin, Table, Alert } from "antd";
import "antd/dist/reset.css";
import { useAuth } from "../../../context/AuthContext";
const apiBaseUrl = process.env.REACT_APP_URL;

interface Meal {
  _id?: string;
  month: string; // Format: "YYYY-MM"
  dayOfWeek: string;
  name: string;
  description: string;
  picture: string | null;
  mealType: string;
}

interface MealPlan {
  Monday: { breakfast: Meal | null; lunch: Meal | null; snack: Meal | null };
  Tuesday: { breakfast: Meal | null; lunch: Meal | null; snack: Meal | null };
  Wednesday: { breakfast: Meal | null; lunch: Meal | null; snack: Meal | null };
  Thursday: { breakfast: Meal | null; lunch: Meal | null; snack: Meal | null };
  Friday: { breakfast: Meal | null; lunch: Meal | null; snack: Meal | null };
}

interface MealSlot {
  mealType: string;
  name: string;
  description: string;
}

type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

const MealPlan: React.FC = () => {
  const routes = all_routes;
  const [mealPlan, setMealPlan] = useState<MealPlan>({
    Monday: { breakfast: null, lunch: null, snack: null },
    Tuesday: { breakfast: null, lunch: null, snack: null },
    Wednesday: { breakfast: null, lunch: null, snack: null },
    Thursday: { breakfast: null, lunch: null, snack: null },
    Friday: { breakfast: null, lunch: null, snack: null },
  });
  const { token, user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
  const [modalMonth, setModalMonth] = useState<Date | null>(null);
  const [selectedDays, setSelectedDays] = useState<{ [key in Day]: boolean }>({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
  });
  const [meals, setMeals] = useState<{ [key in Day]: MealSlot[] }>({
    Monday: [{ mealType: "", name: "", description: "" }],
    Tuesday: [{ mealType: "", name: "", description: "" }],
    Wednesday: [{ mealType: "", name: "", description: "" }],
    Thursday: [{ mealType: "", name: "", description: "" }],
    Friday: [{ mealType: "", name: "", description: "" }],
  });
  const [editMeal, setEditMeal] = useState<{
    _id: string;
    month: string;
    dayOfWeek: string;
    mealType: string;
    name: string;
    description: string;
  } | null>(null);
  const [deleteMealId, setDeleteMealId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setUserRole(decodedToken.role);
      } catch (error) {
        console.error("Error decoding token:", error);
        toast.error("Invalid token. Please log in again.");
      }
    }
  }, []);

  useEffect(() => {
    const fetchMealPlan = async () => {
      if (!selectedMonth) return;
      try {
        const monthString = `${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1).toString().padStart(2, "0")}`;
        console.log("Fetching meal plan for month:", monthString);
        const response = await axios.get<{ mealPlan: MealPlan; month: string }>(
          `${apiBaseUrl}/api/meals/plan`,
          {
            params: { month: monthString },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Fetched meal plan:", response.data.mealPlan);
        setMealPlan(response.data.mealPlan);
      } catch (error: any) {
        console.error("Error fetching meal plan:", error);
        setMealPlan({
          Monday: { breakfast: null, lunch: null, snack: null },
          Tuesday: { breakfast: null, lunch: null, snack: null },
          Wednesday: { breakfast: null, lunch: null, snack: null },
          Thursday: { breakfast: null, lunch: null, snack: null },
          Friday: { breakfast: null, lunch: null, snack: null },
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (userRole) fetchMealPlan();
  }, [selectedMonth, userRole]);

  const handleModalOpen = async () => {
    const month = selectedMonth || new Date();
    setModalMonth(month);
    console.log("Modal opened with month:", `${month.getFullYear()}-${(month.getMonth() + 1).toString().padStart(2, "0")}`);

    const newMeals: { [key in Day]: MealSlot[] } = {
      Monday: [{ mealType: "", name: "", description: "" }],
      Tuesday: [{ mealType: "", name: "", description: "" }],
      Wednesday: [{ mealType: "", name: "", description: "" }],
      Thursday: [{ mealType: "", name: "", description: "" }],
      Friday: [{ mealType: "", name: "", description: "" }],
    };
    setMeals(newMeals);
    setSelectedDays({
      Monday: false,
      Tuesday: false,
      Wednesday: false,
      Thursday: false,
      Friday: false,
    });
  };

  const addMealSlot = (day: Day) => {
    setMeals((prev) => ({
      ...prev,
      [day]: [...prev[day], { mealType: "", name: "", description: "" }],
    }));
  };

  const removeMealSlot = (day: Day, index: number) => {
    setMeals((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const handleInputChange = (day: Day, index: number, field: string, value: string) => {
    setMeals((prev) => {
      const updated = [...prev[day]];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [day]: updated };
    });
  };

  const isMealValid = (meal: MealSlot) => {
    const validMealTypes = ["breakfast", "lunch", "snack"];
    return (
      meal.mealType &&
      validMealTypes.includes(meal.mealType) &&
      meal.name.trim() &&
      meal.description.trim()
    );
  };

  const getAvailableMealTypes = (day: Day) => {
    const existingTypes = Object.keys(mealPlan[day])
      .filter((type) => mealPlan[day][type as "breakfast" | "lunch" | "snack"])
      .map((type) => type.toLowerCase());
    return ["breakfast", "lunch", "snack"].filter((type) => !existingTypes.includes(type));
  };

  const getMealPayload = () => {
    if (!modalMonth) {
      console.error("getMealPayload: modalMonth is null");
      return [];
    }
    const monthString = `${modalMonth.getFullYear()}-${(modalMonth.getMonth() + 1).toString().padStart(2, "0")}`;
    console.log("getMealPayload: month =", monthString);
    const mealPayload: any[] = [];

    Object.keys(selectedDays).forEach((day) => {
      if (selectedDays[day as Day]) {
        const dayMeals = meals[day as Day]
          .filter(isMealValid)
          .filter((meal) => {
            const existingMeal = mealPlan[day as Day][meal.mealType as "breakfast" | "lunch" | "snack"];
            if (existingMeal) {
              console.log(`Skipping ${meal.mealType} for ${day} as it already exists`);
              return false;
            }
            return true;
          })
          .map((meal) => ({
            month: monthString,
            dayOfWeek: day,
            mealType: meal.mealType,
            name: meal.name.trim(),
            description: meal.description.trim(),
          }));
        mealPayload.push(...dayMeals);
      }
    });

    const mealsByDay: { [key: string]: string[] } = {};
    for (const meal of mealPayload) {
      const key = `${meal.month}-${meal.dayOfWeek}`;
      if (!mealsByDay[key]) mealsByDay[key] = [];
      mealsByDay[key].push(meal.mealType);
    }

    for (const [key, types] of Object.entries(mealsByDay)) {
      const duplicates = types.filter((type, index) => types.indexOf(type) !== index);
      if (duplicates.length > 0) {
        throw new Error(
          `Duplicate meal types on ${key}: ${duplicates.join(", ")}. Each meal type can only be added once per day.`
        );
      }
    }

    return mealPayload;
  };

  const handleSubmitMeals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalMonth) {
      console.log("Submission failed: No month selected");
      toast.error("Please select a month.");
      return;
    }

    if (!token) {
      console.log("Submission failed: No token");
      toast.error("Please log in to add meals.");
      return;
    }

    try {
      const mealPayload = getMealPayload();
      console.log("Meal payload to be sent:", mealPayload);
      console.log("Payload type:", Array.isArray(mealPayload) ? "Array" : typeof mealPayload);
      console.log("Payload length:", mealPayload.length);

      if (mealPayload.length === 0) {
        console.log("Submission failed: No valid meals or no days selected");
        toast.error("Please select at least one day and add valid meals.");
        return;
      }

      console.log("Sending batch POST request to /api/meals/batch-add");
      const response = await axios.post(`${apiBaseUrl}/api/meals/batch-add`, mealPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const monthString = `${modalMonth.getFullYear()}-${(modalMonth.getMonth() + 1).toString().padStart(2, "0")}`;
      console.log("Fetching updated meal plan for month:", monthString);
      const planResponse = await axios.get<{ mealPlan: MealPlan; month: string }>(
        `${apiBaseUrl}/api/meals/plan`,
        {
          params: { month: monthString },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Updated meal plan:", planResponse.data.mealPlan);
      setMealPlan(planResponse.data.mealPlan);
      setMeals({
        Monday: [{ mealType: "", name: "", description: "" }],
        Tuesday: [{ mealType: "", name: "", description: "" }],
        Wednesday: [{ mealType: "", name: "", description: "" }],
        Thursday: [{ mealType: "", name: "", description: "" }],
        Friday: [{ mealType: "", name: "", description: "" }],
      });
      setSelectedDays({
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
      });
      toast.success("Meals successfully saved!");
      document.getElementById("add_meal_plan")?.classList.remove("d-block");
    } catch (error: any) {
      console.error("Error saving meals:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: string) => toast.error(err));
      } else {
        toast.error(
          `Failed to save meals: ${error.response?.data?.message || error.message || "Please try again."}`
        );
      }
    }
  };

  const handleEditMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMeal || !editMeal._id) {
      console.log("Edit failed: Invalid meal ID");
      toast.error("Invalid meal ID. Please try again.");
      return;
    }

    try {
      if (!token) {
        console.log("Edit failed: No token");
        toast.error("Please log in to edit a meal.");
        return;
      }

      console.log("Sending PUT request to edit meal:", editMeal._id);
      await axios.put(
        `${apiBaseUrl}/api/meals/${editMeal._id}`,
        {
          month: editMeal.month,
          dayOfWeek: editMeal.dayOfWeek,
          mealType: editMeal.mealType,
          name: editMeal.name,
          description: editMeal.description,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!selectedMonth) {
        console.error("Edit failed: selectedMonth is null");
        toast.error("No month selected. Please select a month and try again.");
        return;
      }
      const monthString = `${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1).toString().padStart(2, "0")}`;
      console.log("Fetching updated meal plan for month:", monthString);
      const response = await axios.get<{ mealPlan: MealPlan; month: string }>(
        `${apiBaseUrl}/api/meals/plan`,
        {
          params: { month: monthString },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Updated meal plan:", response.data.mealPlan);
      setMealPlan(response.data.mealPlan);
      setEditMeal(null);
      toast.success("Meal updated successfully.");
    } catch (error: any) {
      console.error("Error editing meal:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(`Failed to edit meal: ${error.response?.data?.message || "Please try again."}`);
    }
  };

  const handleDeleteMeal = async () => {
    if (!deleteMealId) return;

    try {
      if (!token) {
        console.log("Delete failed: No token");
        toast.error("Please log in to delete a meal.");
        return;
      }

      console.log("Sending DELETE request for meal:", deleteMealId);
      await axios.delete(`${apiBaseUrl}/api/meals/${deleteMealId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!selectedMonth) {
        console.error("Delete failed: selectedMonth is null");
        toast.error("No month selected. Please select a month and try again.");
        return;
      }
      const monthString = `${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1).toString().padStart(2, "0")}`;
      console.log("Fetching updated meal plan for month:", monthString);
      const response = await axios.get<{ mealPlan: MealPlan; month: string }>(
        `${apiBaseUrl}/api/meals/plan`,
        {
          params: { month: monthString },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Updated meal plan:", response.data.mealPlan);
      setMealPlan(response.data.mealPlan);
      setDeleteMealId(null);
      toast.success("Meal deleted successfully.");
    } catch (error: any) {
      console.error("Error deleting meal:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(`Failed to delete meal: ${error.response?.data?.message || "Please try again."}`);
    }
  };

  if (userRole !== "admin") {
    return (
      <div className="page-wrapper">
        <div className="content content-two">
          <h3 className="page-title mb-1">Access Denied</h3>
          <p>Only admins can access the meal plan management page.</p>
        </div>
      </div>
    );
  }

  const tableColumns = [
    {
      title: "Meal Type",
      dataIndex: "mealType",
      key: "mealType",
      width: 150,
      render: (text: string) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <i
            className={`ti ti-${
              text === "breakfast" ? "egg" : text === "lunch" ? "salad" : "apple"
            } me-2`}
            style={{ fontSize: "16px" }}
          />
          {text.charAt(0).toUpperCase() + text.slice(1)}
        </div>
      ),
    },
    ...Object.keys(mealPlan).map((day) => ({
      title: day,
      dataIndex: day,
      key: day,
      render: (_: any, record: any) => {
        const meal = record[day];
        return meal ? (
          <div>
            <p style={{ margin: "0 0 4px", color: "#333" }}>
              <strong>Name:</strong> {meal.name}
            </p>
            <p style={{ margin: "0 0 4px", color: "#333" }}>
              <strong>Description:</strong> {meal.description}
            </p>
            <div style={{ marginTop: "8px" }}>
              <button
                className="btn btn-sm btn-outline-primary me-2"
                data-bs-toggle="modal"
                data-bs-target="#edit_meal"
                onClick={() => {
                  if (!meal._id) {
                    console.log("Edit failed: Missing meal ID");
                    toast.error("Cannot edit meal: Missing ID.");
                    return;
                  }
                  console.log("Opening edit modal for meal:", meal._id);
                  setEditMeal({
                    _id: meal._id,
                    month: meal.month,
                    dayOfWeek: meal.dayOfWeek,
                    mealType: record.mealType,
                    name: meal.name,
                    description: meal.description,
                  });
                }}
              >
                <i className="ti ti-edit me-1" /> Edit
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                data-bs-toggle="modal"
                data-bs-target="#delete_meal"
                onClick={() => {
                  if (!meal._id) {
                    console.log("Delete failed: Missing meal ID");
                    toast.error("Cannot delete meal: Missing ID.");
                    return;
                  }
                  console.log("Opening delete modal for meal:", meal._id);
                  setDeleteMealId(meal._id);
                }}
              >
                <i className="ti ti-trash me-1" /> Delete
              </button>
            </div>
          </div>
        ) : (
          "-"
        );
      },
    })),
  ];

  const tableDataSource = ["breakfast", "lunch", "snack"].map((mealType) => {
    const row: any = { key: mealType, mealType };
    Object.keys(mealPlan).forEach((day) => {
      row[day] = mealPlan[day as Day][mealType as "breakfast" | "lunch" | "snack"];
    });
    return row;
  });

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="page-wrapper">
        <div className="content content-two">
          <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Meal Plan</h3>
              <nav>
                <ol className="calendar mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Management</li>
                  <li className="">
                    Meals
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <TooltipOption />
              <div className="mb-2">
                <Link
                  to="#"
                  className="btn btn-primary d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#add_meal_plan"
                  onClick={handleModalOpen}
                >
                  <i className="ti ti-square-rounded-plus me-2" /> Add Meal Plan
                </Link>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
              <h4 className="mb-3">Monthly Meal Plan</h4>
              <div className="d-flex align-items-center flex-wrap">
                <div className="mb-3 me-2">
                  <label className="form-label">Select Month</label>
                  <DatePicker
                    selected={selectedMonth}
                    onChange={(date: Date) => setSelectedMonth(date)}
                    className="form-control"
                    dateFormat="MMMM yyyy"
                    showMonthYearPicker
                  />
                </div>
              </div>
            </div>
            <div className="card-body pb-0">
              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                  <Spin size="large" />
                </div>
              ) : tableDataSource.some((row) =>
                  Object.keys(mealPlan).some((day) => row[day])
                ) ? (
                <div className="table-responsive">
                  <Table
                    columns={tableColumns}
                    dataSource={tableDataSource}
                    pagination={false}
                    bordered
                    rowKey="key"
                    scroll={{ x: true }}
                  />
                </div>
              ) : (
                <div className="text-center py-4">
                  <Alert
                    message="No Meal Plan found for this month"
                    // type="MealType"
                    showIcon
                    className="mx-3"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="add_meal_plan">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Meal Plan</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  setMeals({
                    Monday: [{ mealType: "", name: "", description: "" }],
                    Tuesday: [{ mealType: "", name: "", description: "" }],
                    Wednesday: [{ mealType: "", name: "", description: "" }],
                    Thursday: [{ mealType: "", name: "", description: "" }],
                    Friday: [{ mealType: "", name: "", description: "" }],
                  });
                  setSelectedDays({
                    Monday: false,
                    Tuesday: false,
                    Wednesday: false,
                    Thursday: false,
                    Friday: false,
                  });
                }}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmitMeals}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Month</label>
                      <DatePicker
                        selected={modalMonth}
                        onChange={(date: Date) => {
                          setModalMonth(date);
                          handleModalOpen();
                        }}
                        className="form-control"
                        dateFormat="MMMM yyyy"
                        showMonthYearPicker
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Select Days to Add Meals</label>
                  <div className="d-flex flex-wrap">
                    {Object.keys(selectedDays).map((day) => (
                      <div key={day} className="form-check me-3">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`day-${day}`}
                          checked={selectedDays[day as Day]}
                          onChange={(e) =>
                            setSelectedDays((prev) => ({
                              ...prev,
                              [day]: e.target.checked,
                            }))
                          }
                        />
                        <label className="form-check-label" htmlFor={`day-${day}`}>
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="add-more-timetable">
                  <ul className="tab-links nav nav-pills" id="pills-tab2" role="tablist">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => (
                      <li
                        key={day}
                        className={`nav-link ${index === 0 ? "active" : ""}`}
                        id={`pills-${day.toLowerCase()}-tab`}
                        data-bs-toggle="pill"
                        data-bs-target={`#pills-${day.toLowerCase()}`}
                        role="tab"
                        aria-controls={`pills-${day.toLowerCase()}`}
                        aria-selected={index === 0}
                      >
                        <Link to="#">{day}</Link>
                      </li>
                    ))}
                  </ul>
                  <div className="tab-content pt-0 dashboard-tab">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                      <div
                        key={day}
                        className={`tab-pane fade ${day === "Monday" ? "show active" : ""}`}
                        id={`pills-${day.toLowerCase()}`}
                        role="tabpanel"
                        aria-labelledby={`pills-${day.toLowerCase()}-tab`}
                      >
                        {selectedDays[day as Day] ? (
                          <>
                            {meals[day as Day].map((meal, index) => (
                              <div key={index} className="add-timetable-row">
                                <div className="row timetable-count">
                                  <div className="col-lg-4">
                                    <div className="mb-3">
                                      <label className="form-label">Meal Type</label>
                                      <select
                                        className={`form-control ${
                                          meal.mealType && !["breakfast", "lunch", "snack"].includes(meal.mealType)
                                            ? "is-invalid"
                                            : ""
                                        }`}
                                        value={meal.mealType}
                                        onChange={(e) => handleInputChange(day as Day, index, "mealType", e.target.value)}
                                        required
                                      >
                                        <option value="">Select Meal Type</option>
                                        {getAvailableMealTypes(day as Day).map((type) => (
                                          <option key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                          </option>
                                        ))}
                                      </select>
                                      <div className="invalid-feedback">Please select a valid meal type.</div>
                                      {meal.mealType && mealPlan[day as Day][meal.mealType as "breakfast" | "lunch" | "snack"] && (
                                        <div className="text-danger mt-1">
                                          {meal.mealType} already exists for {day}. Please choose another type or edit the existing meal.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="col-lg-4">
                                    <div className="mb-3">
                                      <label className="form-label">Name</label>
                                      <input
                                        type="text"
                                        className={`form-control ${
                                          meal.name.trim() === "" && meal.mealType ? "is-invalid" : ""
                                        }`}
                                        value={meal.name}
                                        onChange={(e) => handleInputChange(day as Day, index, "name", e.target.value)}
                                        required
                                      />
                                      <div className="invalid-feedback">Name is required.</div>
                                    </div>
                                  </div>
                                  <div className="col-lg-4">
                                    <div className="d-flex align-items-end">
                                      <div className="mb-3 flex-fill">
                                        <label className="form-label">Description</label>
                                        <input
                                          type="text"
                                          className={`form-control ${
                                            meal.description.trim() === "" && meal.mealType ? "is-invalid" : ""
                                          }`}
                                          value={meal.description}
                                          onChange={(e) =>
                                            handleInputChange(day as Day, index, "description", e.target.value)
                                          }
                                          required
                                        />
                                        <div className="invalid-feedback">Description is required.</div>
                                      </div>
                                      {meals[day as Day].length > 1 && (
                                        <div className="mb-3 ms-2">
                                          <Link
                                            to="#"
                                            className="delete-time-table"
                                            onClick={() => removeMealSlot(day as Day, index)}
                                          >
                                            <i className="ti ti-trash" />
                                          </Link>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <Link
                              to="#"
                              className="btn btn-primary add-new-timetable"
                              onClick={() => addMealSlot(day as Day)}
                            >
                              <i className="ti ti-square-rounded-plus-filled me-2" /> Add New
                            </Link>
                          </>
                        ) : (
                          <p className="text-muted">Select this day to add meals.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-muted">
                    Note: Select the days you want to add meals for. Each meal type (Breakfast, Lunch, Snack) can only be
                    added once per day. Use the "Edit" button to modify existing meals.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <Link to="#" className="btn btn-light me-2" data-bs-dismiss="modal">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={getMealPayload().length === 0 || !Object.values(selectedDays).some((selected) => selected)}
                >
                  Add Meals
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" id="edit_meal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Meal</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setEditMeal(null)}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleEditMeal}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Month</label>
                  <DatePicker
                    selected={editMeal ? new Date(editMeal.month + "-01") : null}
                    onChange={(date: Date) =>
                      setEditMeal((prev) =>
                        prev
                          ? {
                              ...prev,
                              month: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`,
                            }
                          : null
                      )
                    }
                    className={`form-control ${editMeal?.month ? "" : "is-invalid"}`}
                    dateFormat="MMMM yyyy"
                    showMonthYearPicker
                    required
                  />
                  <div className="invalid-feedback">Please select a month.</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Day of Week</label>
                  <select
                    className={`form-control ${
                      editMeal?.dayOfWeek && ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(editMeal.dayOfWeek)
                        ? ""
                        : "is-invalid"
                    }`}
                    value={editMeal?.dayOfWeek || ""}
                    onChange={(e) => setEditMeal((prev) => (prev ? { ...prev, dayOfWeek: e.target.value } : null))}
                    required
                  >
                    <option value="">Select Day</option>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <div className="invalid-feedback">Please select a valid day.</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Meal Type</label>
                  <select
                    className={`form-control ${
                      editMeal?.mealType && ["breakfast", "lunch", "snack"].includes(editMeal.mealType) ? "" : "is-invalid"
                    }`}
                    value={editMeal?.mealType || ""}
                    onChange={(e) => setEditMeal((prev) => (prev ? { ...prev, mealType: e.target.value } : null))}
                    required
                  >
                    <option value="">Select Meal Type</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snack">Snack</option>
                  </select>
                  <div className="invalid-feedback">Please select a valid meal type.</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className={`form-control ${editMeal?.name.trim() ? "" : "is-invalid"}`}
                    value={editMeal?.name || ""}
                    onChange={(e) => setEditMeal((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                    placeholder="Enter meal name"
                    required
                  />
                  <div className="invalid-feedback">Name is required.</div>
                </div>
                <div className="mb-0">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className={`form-control ${editMeal?.description.trim() ? "" : "is-invalid"}`}
                    value={editMeal?.description || ""}
                    onChange={(e) => setEditMeal((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                    placeholder="Enter meal description"
                    required
                  />
                  <div className="invalid-feedback">Description is required.</div>
                </div>
              </div>
              <div className="modal-footer">
                <Link
                  to="#"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                  onClick={() => setEditMeal(null)}
                >
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" id="delete_meal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Delete Meal</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setDeleteMealId(null)}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this meal? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <Link
                to="#"
                className="btn btn-light me-2"
                data-bs-dismiss="modal"
                onClick={() => setDeleteMealId(null)}
              >
                Cancel
              </Link>
              <button className="btn btn-danger" data-bs-dismiss="modal" onClick={handleDeleteMeal}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlan;