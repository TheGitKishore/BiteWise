import MealPlan from '../entity/MealPlan';

class UpdateMealPlanController {
  async updateMealPlan(planId, data) {
    try {
      // Basic validation (optional but recommended)
      if (!data.name || data.name.trim() === '') {
        return { success: false, message: 'Plan name is required' };
      }

      const updated = await MealPlan.update(planId, data);

      return {
        success: true,
        message: 'Meal plan updated successfully',
        data: updated,
      };
    } catch (error) {
      console.error('UPDATE ERROR:', error);
      return {
        success: false,
        message: 'Failed to update meal plan',
      };
    }
  }
}

export default UpdateMealPlanController;