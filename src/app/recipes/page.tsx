import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RecipeCard from '@/components/RecipeCard'
import type { Recipe } from '@/types'

export default async function RecipesPage() {
  const supabase = await createClient()
  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
        <Link
          href="/recipes/new"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add
        </Link>
      </div>
      {!recipes?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No recipes yet</p>
          <p className="text-sm mt-1">Add your first recipe to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe: Recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
