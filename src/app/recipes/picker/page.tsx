import { createClient } from '@/lib/supabase/server'
import RecipePickerClient from './RecipePickerClient'
import type { Recipe } from '@/types'

export default async function RecipePickerPage({
  searchParams,
}: {
  searchParams: Promise<{ menuId: string }>
}) {
  const { menuId } = await searchParams
  const supabase = await createClient()

  const { data: recipes } = await supabase.from('recipes').select('*').order('title')
  const { data: existing } = await supabase
    .from('menu_recipes')
    .select('recipe_id')
    .eq('menu_id', menuId)

  const existingIds = new Set(existing?.map(r => r.recipe_id) ?? [])

  return (
    <RecipePickerClient
      recipes={(recipes ?? []) as Recipe[]}
      menuId={menuId}
      existingIds={existingIds}
    />
  )
}
