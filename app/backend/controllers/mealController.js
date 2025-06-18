import Meal from "../models/meal.js";

export const addMeal = async (req, res) => {
  try {
    const { day, name, description, mealType } = req.body;
    // if (req.user.role !== "admin") {
    //   return res.status(403).json({ message: "Unauthorized" });
    // }

    if (!day || !name || !description || !mealType) {
      return res.status(400).json({ message: "Day, name, description, and meal type are required" });
    }
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const validMealTypes = ["breakfast", "lunch"];
    if (!validDays.includes(day)) {
      return res.status(400).json({ message: "Invalid day. Must be Monday to Friday" });
    }
    if (!validMealTypes.includes(mealType)) {
      return res.status(400).json({ message: "Invalid meal type. Must be breakfast or lunch" });
    }

    const existingMeal = await Meal.findOne({ day, mealType });
    if (existingMeal) {
      return res.status(400).json({ message: `A ${mealType} meal already exists for ${day}` });
    }

    const meal = new Meal({
      day,
      name,
      description,
      picture: null, 
      // allergies: allergies || [], 
      mealType
    });

    await meal.save();

    res.status(201).json({ message: "Meal added successfully", meal });
  } catch (error) {
    console.error("Add meal error:", error);
    res.status(500).json({ message: "Server error while adding meal" });
  }
};

export const getMealPlan = async (req, res) => {
  // try {
  //   // if (req.user.role !== "parent") {
  //   //   return res.status(403).json({ message: "Unauthorized" });
  //   // }

  //   const meals = await Meal.find({})
  //     .sort({ day: 1, mealType: 1 }) 
  //     .lean();
  //   const mealPlan = {
  //     Monday: { breakfast: null, lunch: null },
  //     Tuesday: { breakfast: null, lunch: null },
  //     Wednesday: { breakfast: null, lunch: null },
  //     Thursday: { breakfast: null, lunch: null },
  //     Friday: { breakfast: null, lunch: null }
  //   };

  //   meals.forEach(meal => {
  //     mealPlan[meal.day][meal.mealType] = {
  //       name: meal.name,
  //       description: meal.description,
  //       picture: meal.picture,
  //       // allergies: meal.allergies
  //     };
  //   });

  //   res.status(200).json(mealPlan);
  // } catch (error) {
  //   console.error("Get meal plan error:", error);
  //   res.status(500).json({ message: "Server error while fetching meal plan" });
  // }
  try {
    const { weekStart } = req.query;

    if (!weekStart) {
      console.log("Validation failed: Missing weekStart");
      return res.status(400).json({ message: "weekStart query parameter is required" });
    }

    const startDate = new Date(weekStart);
    if (isNaN(startDate.getTime())) {
      console.log("Validation failed: Invalid weekStart date", weekStart);
      return res.status(400).json({ message: "Invalid weekStart date format" });
    }

    // Ensure startDate is a Monday
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 1) {
      startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4); // Friday

    console.log("Fetching meals from", startDate, "to", endDate);
    const meals = await Meal.find({
      servedOn: {
        $gte: startDate.setHours(0, 0, 0, 0),
        $lte: endDate.setHours(23, 59, 59, 999)
      }
    })
      .sort({ servedOn: 1, mealType: 1 })
      .lean();

    const mealPlan = {
      Monday: { breakfast: null, lunch: null, snack: null },
      Tuesday: { breakfast: null, lunch: null, snack: null },
      Wednesday: { breakfast: null, lunch: null, snack: null },
      Thursday: { breakfast: null, lunch: null, snack: null },
      Friday: { breakfast: null, lunch: null, snack: null }
    };

    meals.forEach(meal => {
      const mealDate = new Date(meal.servedOn);
      const dayName = mealDate.toLocaleDateString("en-US", { weekday: "long" });
      if (mealPlan[dayName]) {
        mealPlan[dayName][meal.mealType] = {
          _id: meal._id.toString(),
          name: meal.name,
          description: meal.description,
          picture: meal.picture,
          servedOn: meal.servedOn
        };
      }
    });

    console.log("Returning meal plan for week starting", startDate.toISOString().split("T")[0]);
    res.status(200).json({ mealPlan, weekStart: startDate.toISOString().split("T")[0] });
  } catch (error) {
    console.error("Get meal plan error:", { message: error.message, stack: error.stack });
    res.status(500).json({ message: "Server error while fetching meal plan" });
  }
};