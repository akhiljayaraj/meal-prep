'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Recipe } from '@/types'

interface Props {
  recipes: Recipe[]
  menuId: string
  existingIds: Set<string>
}

export default function RecipePickerClient({ recipes, menuId, existingIds }: Props) {
  const router = useRouter()

  async function addRecipe(recipeId: string) {
    const supabase = createClient()
    await supabase.from('menu_recipes').insert({
      menu_id: menuId,
      recipe_id: recipeId,
    })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Pick a Dish</h1>
      </div>

      {recipes.length === 0 ? (
        <p className="text-gray-400 text-center py-16">No recipes yet. Add some first!</p>
      ) : (
        <div className="space-y-2">
          {recipes.map(recipe => {
            const added = existingIds.has(recipe.id)
            return (
              <button
                key={recipe.id}
                onClick={() => !added && addRecipe(recipe.id)}
                disabled={added}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                  added
                    ? 'bg-emerald-50 border-emerald-200 opacity-60'
                    : 'bg-white border-gray-100 active:bg-gray-50'
                }`}
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                  )}
                </div>
                <span className="flex-1 font-medium text-gray-900">{recipe.title}</span>
                {added && <span className="text-emerald-600 text-sm">Added</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
