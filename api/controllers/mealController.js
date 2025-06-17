import Meal from "../models/meal.js";

// Add a single meal
export const addMeal = async (req, res) => {
  try {
    const meal = req.body;
    console.log("Received single meal:", meal);

    const { month, dayOfWeek, name, description, mealType } = meal;
    const validMealTypes = ["breakfast", "lunch", "snack"];
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // Validate required fields
    if (!month || !dayOfWeek || !name || !description || !mealType) {
      console.log("Validation failed: Missing required fields", meal);
      return res.status(400).json({ message: "All fields (month, dayOfWeek, name, description, mealType) are required" });
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      console.log("Validation failed: Invalid month format", month);
      return res.status(400).json({ message: "Invalid month format. Use YYYY-MM (e.g., 2025-01)" });
    }

    // Validate dayOfWeek
    if (!validDays.includes(dayOfWeek)) {
      console.log("Validation failed: Invalid dayOfWeek", dayOfWeek);
      return res.status(400).json({ message: "Invalid dayOfWeek. Must be Monday to Friday" });
    }

    // Validate meal type
    if (!validMealTypes.includes(mealType)) {
      console.log("Validation failed: Invalid meal type", mealType);
      return res.status(400).json({ message: `Invalid meal type: ${mealType}. Must be breakfast, lunch, or snack` });
    }

    // Check for existing meal
    const existingMeal = await Meal.findOne({ month, dayOfWeek, mealType });
    if (existingMeal) {
      console.log("Validation failed: Duplicate meal", { month, dayOfWeek, mealType });
      return res.status(400).json({
        message: `A ${mealType} meal already exists for ${dayOfWeek} in ${month}`,
      });
    }

    // Insert meal
    console.log("Inserting meal:", meal);
    const insertedMeal = await new Meal({ ...meal}).save();
    console.log("Inserted meal:", insertedMeal);
    res.status(201).json({ message: "Meal added successfully", meal: insertedMeal });
  } catch (error) {
    console.error("Add meal error:", { message: error.message, stack: error.stack });
    res.status(500).json({ message: "Server error while adding meal" });
  }
};

// Batch add meals
export const batchAddMeals = async (req, res) => {
  try {
    const meals = req.body;

    if (!Array.isArray(meals) || meals.length === 0) {
      console.log("Validation failed: Meals array is required and cannot be empty");
      return res.status(400).json({ message: "Meals array is required and cannot be empty" });
    }

    const validMealTypes = ["breakfast", "lunch", "snack"];
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const errors = [];

    // Validate all meals
    for (const meal of meals) {
      const { month, dayOfWeek, name, description, mealType } = meal;
      if (!month || !dayOfWeek || !name || !description || !mealType) {
        errors.push(`Invalid meal: All fields (month, dayOfWeek, name, description, mealType) are required`);
        continue;
      }
      if (!/^\d{4}-\d{2}$/.test(month)) {
        errors.push(`Invalid month format for meal on ${dayOfWeek}: ${month}. Use YYYY-MM`);
      }
      if (!validDays.includes(dayOfWeek)) {
        errors.push(`Invalid dayOfWeek for meal: ${dayOfWeek}. Must be Monday to Friday`);
      }
      if (!validMealTypes.includes(mealType)) {
        errors.push(`Invalid meal type '${mealType}' for meal on ${dayOfWeek} of ${month}`);
      }
    }

    if (errors.length > 0) {
      console.log("Validation errors:", errors);
      return res.status(400).json({ message: "Validation errors", errors });
    }

    // Check for duplicates in the request
    const mealsByDay = {};
    for (const meal of meals) {
      const key = `${meal.month}-${meal.dayOfWeek}`;
      if (!mealsByDay[key]) mealsByDay[key] = [];
      mealsByDay[key].push(meal.mealType);
    }

    for (const [key, types] of Object.entries(mealsByDay)) {
      const duplicates = types.filter((type, index) => types.indexOf(type) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate meal types on ${key}: ${duplicates.join(", ")}`);
      }
    }

    if (errors.length > 0) {
      console.log("Validation errors:", errors);
      return res.status(400).json({ message: "Validation errors", errors });
    }

    // Check for existing meals in the database
    const existingMeals = await Meal.find({
      month: { $in: meals.map((m) => m.month) },
      dayOfWeek: { $in: meals.map((m) => m.dayOfWeek) },
      mealType: { $in: validMealTypes },
    });

    for (const meal of meals) {
      const existing = existingMeals.find(
        (m) => m.month === meal.month && m.dayOfWeek === meal.dayOfWeek && m.mealType === meal.mealType
      );
      if (existing) {
        errors.push(`A ${meal.mealType} meal already exists for ${meal.dayOfWeek} in ${meal.month}`);
      }
    }

    if (errors.length > 0) {
      console.log("Validation errors:", errors);
      return res.status(400).json({ message: "Cannot add meals", errors });
    }

    // Insert new meals
    const newMeals = meals.map((meal) => ({
      month: meal.month,
      dayOfWeek: meal.dayOfWeek,
      mealType: meal.mealType,
      name: meal.name,
      description: meal.description,
      picture: null,
    }));

    console.log("Inserting meals:", newMeals);
    const insertedMeals = await Meal.insertMany(newMeals);
    console.log("Inserted meals:", insertedMeals);

    // Fetch updated meal plan for the month
    const monthMeals = await Meal.find({
      month: meals[0].month,
    }).sort({ dayOfWeek: 1, mealType: 1 });

    const mealPlan = {
      Monday: { breakfast: null, lunch: null, snack: null },
      Tuesday: { breakfast: null, lunch: null, snack: null },
      Wednesday: { breakfast: null, lunch: null, snack: null },
      Thursday: { breakfast: null, lunch: null, snack: null },
      Friday: { breakfast: null, lunch: null, snack: null },
    };

    monthMeals.forEach((meal) => {
      mealPlan[meal.dayOfWeek][meal.mealType] = {
        _id: meal._id.toString(),
        name: meal.name,
        description: meal.description,
        picture: meal.picture,
        month: meal.month,
        dayOfWeek: meal.dayOfWeek,
      };
    });

    res.status(201).json({
      message: "Meals added successfully",
      meals: insertedMeals,
      mealPlan,
      month: meals[0].month,
    });
  } catch (error) {
    console.error("Batch add meals error:", { message: error.message, stack: error.stack });
    res.status(500).json({ message: "Server error while adding meals" });
  }
};

// Get meal plan for a month
export const getMealPlan = async (req, res) => {
  try {
    const { month } = req.query;
    // const userId = req.user.id;

    if (!month) {
      console.log("Validation failed: Missing month");
      return res.status(400).json({ message: "month query parameter is required" });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      console.log("Validation failed: Invalid month format", month);
      return res.status(400).json({ message: "Invalid month format. Use YYYY-MM (e.g., 2025-01)" });
    }

    console.log("Fetching meals for month:", month);
    const meals = await Meal.find({ month }).sort({ dayOfWeek: 1, mealType: 1 }).lean();

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
      };
    });

    console.log("Returning meal plan for month:", month);
    res.status(200).json({ mealPlan, month });
  } catch (error) {
    console.error("Get meal plan error:", { message: error.message, stack: error.stack });
    res.status(500).json({ message: "Server error while fetching meal plan" });
  }
};

// Edit meal
export const editMeal = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "admin") {
      console.log("Access denied: User is not admin", req.user);
      return res.status(403).json({ message: "Only admins can edit meals" });
    }

    const { id } = req.params;
    const { month, dayOfWeek, name, description, mealType } = req.body;

    if (!id || id === "undefined") {
      console.log("Validation failed: Invalid meal ID");
      return res.status(400).json({ message: "Invalid meal ID" });
    }

    if (!month || !dayOfWeek || !name || !description || !mealType) {
      console.log("Validation failed: Missing required fields", req.body);
      return res.status(400).json({ message: "All fields (month, dayOfWeek, name, description, mealType) are required" });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      console.log("Validation failed: Invalid month format", month);
      return res.status(400).json({ message: "Invalid month format. Use YYYY-MM (e.g., 2025-01)" });
    }

    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    if (!validDays.includes(dayOfWeek)) {
      console.log("Validation failed: Invalid dayOfWeek", dayOfWeek);
      return res.status(400).json({ message: "Invalid dayOfWeek. Must be Monday to Friday" });
    }

    const validMealTypes = ["breakfast", "lunch", "snack"];
    if (!validMealTypes.includes(mealType)) {
      console.log("Validation failed: Invalid meal type", mealType);
      return res.status(400).json({ message: `Invalid meal type: ${mealType}. Must be breakfast, lunch, or snack` });
    }

    const meal = await Meal.findById(id);
    if (!meal) {
      console.log("Meal not found", id);
      return res.status(404).json({ message: "Meal not found" });
    }

    const existingMeal = await Meal.findOne({
      month,
      dayOfWeek,
      mealType,
      _id: { $ne: id },
    });
    if (existingMeal) {
      console.log("Validation failed: Duplicate meal", { month, dayOfWeek, mealType });
      return res.status(400).json({
        message: `A ${mealType} meal already exists for ${dayOfWeek} in ${month}`,
      });
    }

    console.log("Updating meal:", id, req.body);
    meal.month = month;
    meal.dayOfWeek = dayOfWeek;
    meal.name = name;
    meal.description = description;
    meal.mealType = mealType;
    await meal.save();
    console.log("Updated meal:", meal);

    res.status(200).json({ message: "Meal updated successfully", meal });
  } catch (error) {
    console.error("Edit meal error:", { message: error.message, stack: error.stack });
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid meal ID format" });
    }
    res.status(500).json({ message: "Server error while editing meal" });
  }
};

// Delete meal
export const deleteMeal = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "admin") {
      console.log("Access denied: User is not admin", req.user);
      return res.status(403).json({ message: "Only admins can delete meals" });
    }

    const { id } = req.params;
    if (!id || id === "undefined") {
      console.log("Validation failed: Invalid meal ID");
      return res.status(400).json({ message: "Invalid meal ID" });
    }

    console.log("Deleting meal:", id);
    const meal = await Meal.findByIdAndDelete(id);
    if (!meal) {
      console.log("Meal not found", id);
      return res.status(404).json({ message: "Meal not found" });
    }

    console.log("Deleted meal:", meal);
    res.status(200).json({ message: "Meal deleted successfully" });
  } catch (error) {
    console.error("Delete meal error:", { message: error.message, stack: error.stack });
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid meal ID format" });
    }
    res.status(500).json({ message: "Server error while deleting meal" });
  }
};