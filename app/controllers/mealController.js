import Meal from "../models/meal.js";

// Add a single meal (for parents, teachers, admins)
export const addMeal = async (req, res) => {
  try {
    const { month, dayOfWeek, name, description, mealType } = req.body;
    const userRole = req.user.role;

    // Validate required fields
    if (!month || !dayOfWeek || !name || !description || !mealType) {
      console.log("Validation failed: Missing required fields", req.body);
      return res.status(400).json({ message: "All fields (month, dayOfWeek, name, description, mealType) are required" });
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      console.log("Validation failed: Invalid month format", month);
      return res.status(400).json({ message: "Invalid month format. Use YYYY-MM (e.g., 2025-01)" });
    }

    // Validate dayOfWeek
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    if (!validDays.includes(dayOfWeek)) {
      console.log("Validation failed: Invalid dayOfWeek", dayOfWeek);
      return res.status(400).json({ message: "Invalid dayOfWeek. Must be Monday to Friday" });
    }

    // Restrict meal types for parents
    const validMealTypes = userRole === "parent" ? ["breakfast", "lunch"] : ["breakfast", "lunch", "snack"];
    if (!validMealTypes.includes(mealType)) {
      console.log("Validation failed: Invalid meal type", mealType);
      return res.status(400).json({ message: `Invalid meal type: ${mealType}. Must be ${validMealTypes.join(" or ")}` });
    }

    // Derive servedOn from month and dayOfWeek (first occurrence of dayOfWeek in the month)
    const [year, monthNum] = month.split("-").map(Number);
    const firstDayOfMonth = new Date(year, monthNum - 1, 1);
    const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };
    let dayOffset = (dayMap[dayOfWeek] - firstDayOfMonth.getDay() + 7) % 7;
    if (dayOffset === 0 && firstDayOfMonth.getDay() > dayMap[dayOfWeek]) dayOffset = 7;
    const servedOn = new Date(year, monthNum - 1, 1 + dayOffset);

    // Check for existing meal
    const existingMeal = await Meal.findOne({ month, dayOfWeek, mealType });
    if (existingMeal) {
      console.log("Validation failed: Duplicate meal", { month, dayOfWeek, mealType });
      return res.status(400).json({
        message: `A ${mealType} meal already exists for ${dayOfWeek} in ${month}`,
      });
    }

    // Insert meal
    const meal = new Meal({
      month,
      dayOfWeek,
      name,
      description,
      mealType,
      servedOn,
      picture: null,
    });

    console.log("Inserting meal:", meal);
    const insertedMeal = await meal.save();
    console.log("Inserted meal:", insertedMeal);
    res.status(201).json({ message: "Meal added successfully", meal: insertedMeal });
  } catch (error) {
    console.error("Add meal error:", { message: error.message, stack: error.stack });
    res.status(500).json({ message: "Server error while adding meal" });
  }
};

// Get meal plan for a week (for parents, teachers, admins)
// Get meal plan for a month (for parents, teachers, admins)
export const getMealPlan = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      console.log("Validation failed: Missing month");
      return res.status(400).json({ message: "month query parameter is required" });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      console.log("Validation failed: Invalid month format", month);
      return res.status(400).json({ message: "Invalid month format. Use YYYY-MM (e.g., 2025-01)" });
    }

    console.log("Fetching meals for month:", month);
    const meals = await Meal.find({ month })
      .sort({ dayOfWeek: 1, mealType: 1 })
      .lean();

    const mealPlan = {
      Monday: { breakfast: null, lunch: null, snack: null },
      Tuesday: { breakfast: null, lunch: null, snack: null },
      Wednesday: { breakfast: null, lunch: null, snack: null },
      Thursday: { breakfast: null, lunch: null, snack: null },
      Friday: { breakfast: null, lunch: null, snack: null },
    };

    meals.forEach((meal) => {
      mealPlan[meal.dayOfWeek][meal.mealType] = {
        _id: meal._id.toString(),
        name: meal.name,
        description: meal.description,
        picture: meal.picture,
        month: meal.month,
        dayOfWeek: meal.dayOfWeek,
        servedOn: meal.servedOn,
      };
    });

    console.log("Returning meal plan for month:", month);
    res.status(200).json({ mealPlan, month });
  } catch (error) {
    console.error("Get meal plan error:", { message: error.message, stack: error.stack });
    res.status(500).json({ message: "Server error while fetching meal plan" });
  }
};