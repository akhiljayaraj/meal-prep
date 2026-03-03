import { createClient } from '@/lib/supabase/server'
import { formatWeekLabel } from '@/lib/utils/dates'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AddToWeekButton from './AddToWeekButton'
import type { MenuRecipeWithRecipe } from '@/types'

export default async function HistoryWeekPage({
  params,
}: {
  params: Promise<{ menuId: string }>
}) {
  const { menuId } = await params
  const supabase = await createClient()

  const { data: menu } = await supabase.from('weekly_menus').select('*').eq('id', menuId).single()
  if (!menu) notFound()

  const { data: menuRecipes } = await supabase
    .from('menu_recipes')
    .select('*, recipe:recipes(*)')
    .eq('menu_id', menuId)
    .order('added_at')

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/history" className="text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">{formatWeekLabel(menu.week_start_date)}</h1>
      </div>

      {!menuRecipes?.length ? (
        <p className="text-gray-400 text-center py-8">No dishes this week</p>
      ) : (
        <div className="space-y-3">
          {(menuRecipes as MenuRecipeWithRecipe[]).map(mr => (
            <div key={mr.id} className="flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {mr.recipe.image_url ? (
                  <img src={mr.recipe.image_url} alt={mr.recipe.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{mr.recipe.title}</h3>
                <AddToWeekButton recipeId={mr.recipe.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
