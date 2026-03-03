export interface Ingredient {
  name: string
  quantity: string
  unit: string
}

export interface Recipe {
  id: string
  title: string
  description: string | null
  image_url: string | null
  ingredients: Ingredient[]
  created_by: string | null
  created_at: string
}

export interface WeeklyMenu {
  id: string
  week_start_date: string
  created_at: string
}

export interface MenuRecipe {
  id: string
  menu_id: string
  recipe_id: string
  added_by: string | null
  added_at: string
}

export interface MenuRecipeWithRecipe extends MenuRecipe {
  recipe: Recipe
}
