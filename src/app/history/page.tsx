import { createClient } from '@/lib/supabase/server'
import { getWeekStartString, formatWeekLabel } from '@/lib/utils/dates'
import Link from 'next/link'

export default async function HistoryPage() {
  const supabase = await createClient()
  const currentWeekStart = getWeekStartString()

  const { data: menus } = await supabase
    .from('weekly_menus')
    .select('*')
    .neq('week_start_date', currentWeekStart)
    .order('week_start_date', { ascending: false })

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">History</h1>
      {!menus?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p>No past weeks yet</p>
          <p className="text-sm mt-1">Your history will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {menus.map(menu => (
            <Link
              key={menu.id}
              href={`/history/${menu.id}`}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100"
            >
              <span className="font-medium text-gray-900">{formatWeekLabel(menu.week_start_date)}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
