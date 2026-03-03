import { createClient } from '@/lib/supabase/server'
import { getWeekStartString } from '@/lib/utils/dates'
import { aggregateIngredients } from '@/lib/utils/shopping'
import ShoppingListClient from './ShoppingListClient'
import type { Recipe } from '@/types'

export default async function ShoppingListPage() {
  const supabase = await createClient()
  const weekStart = getWeekStartString()

  const { data: menu } = await supabase
    .from('weekly_menus')
    .select('id')
    .eq('week_start_date', weekStart)
    .single()

  if (!menu) {
    return (
      <div className="p-4 text-center py-16 text-gray-400">
        <p>No menu for this week yet.</p>
      </div>
    )
  }

  const { data: menuRecipes } = await supabase
    .from('menu_recipes')
    .select('recipe:recipes(id, title, description, image_url, ingredients, created_by, created_at)')
    .eq('menu_id', menu.id)

  const recipes = (menuRecipes ?? []).map(mr => mr.recipe) as unknown as Recipe[]
  const ingredients = aggregateIngredients(recipes)

  return <ShoppingListClient ingredients={ingredients} weekStart={weekStart} />
}
