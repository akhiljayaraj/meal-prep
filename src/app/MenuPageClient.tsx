'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { MenuRecipeWithRecipe, WeeklyMenu } from '@/types'

interface Props {
  menu: WeeklyMenu
  menuRecipes: MenuRecipeWithRecipe[]
  weekLabel: string
}

export default function MenuPageClient({ menu, menuRecipes, weekLabel }: Props) {
  const router = useRouter()

  async function removeRecipe(menuRecipeId: string) {
    const supabase = createClient()
    await supabase.from('menu_recipes').delete().eq('id', menuRecipeId)
    router.refresh()
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">This Week</h1>
          <p className="text-sm text-gray-400">{weekLabel}</p>
        </div>
        <button
          onClick={() => router.push(`/recipes/picker?menuId=${menu.id}`)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add dish
        </button>
      </div>

      {menuRecipes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No dishes yet</p>
          <p className="text-sm mt-1">Add dishes to plan this week&apos;s meals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {menuRecipes.map(mr => (
            <div key={mr.id} className="flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {mr.recipe.image_url ? (
                  <img src={mr.recipe.image_url} alt={mr.recipe.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{mr.recipe.title}</h3>
                {mr.recipe.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{mr.recipe.description}</p>
                )}
              </div>
              <button
                onClick={() => removeRecipe(mr.id)}
                className="text-gray-300 hover:text-red-400 flex-shrink-0 self-start"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
