import { createClient } from '@/lib/supabase/server'
import { getWeekStartString, formatWeekLabel } from '@/lib/utils/dates'
import MenuPageClient from './MenuPageClient'
import type { MenuRecipeWithRecipe } from '@/types'

async function getOrCreateCurrentMenu(supabase: Awaited<ReturnType<typeof createClient>>) {
  const weekStart = getWeekStartString()
  let { data: menu } = await supabase
    .from('weekly_menus')
    .select('*')
    .eq('week_start_date', weekStart)
    .single()

  if (!menu) {
    const { data } = await supabase
      .from('weekly_menus')
      .insert({ week_start_date: weekStart })
      .select()
      .single()
    menu = data

    // insert may fail on unique conflict (race condition) — retry select
    if (!menu) {
      const { data: existing } = await supabase
        .from('weekly_menus')
        .select('*')
        .eq('week_start_date', weekStart)
        .single()
      menu = existing
    }
  }
  return menu
}

export default async function MenuPage() {
  const supabase = await createClient()
  const menu = await getOrCreateCurrentMenu(supabase)
  if (!menu) return <div className="p-4 text-gray-500">Unable to load menu. Please refresh.</div>

  const { data: menuRecipes } = await supabase
    .from('menu_recipes')
    .select('*, recipe:recipes(*)')
    .eq('menu_id', menu.id)
    .order('added_at')

  return (
    <MenuPageClient
      menu={menu}
      menuRecipes={(menuRecipes ?? []) as MenuRecipeWithRecipe[]}
      weekLabel={formatWeekLabel(menu.week_start_date)}
    />
  )
}
