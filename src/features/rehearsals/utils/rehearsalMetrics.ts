export interface TextUnitPageInfo {
  start_page?: number | null
  end_page?: number | null
  rehearsals?: { start_time: string; end_time: string }[]
}

function pageCount(startPage: number | null | undefined, endPage: number | null | undefined): number {
  if (startPage == null || endPage == null) return 1
  return Math.max(1, endPage - startPage + 1)
}

export function totalRehearsalMinutes(rehearsals: { start_time: string; end_time: string }[]): number {
  return rehearsals.reduce((sum, r) => {
    const ms = new Date(r.end_time).getTime() - new Date(r.start_time).getTime()
    return sum + ms / 60000
  }, 0)
}

export function formatHoursAndMinutes(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes)
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${hours}:${String(remainder).padStart(2, '0')}`
}

export function minutesPerPage(item: TextUnitPageInfo): number | null {
  if (!item.rehearsals || item.rehearsals.length === 0) return null
  const minutes = totalRehearsalMinutes(item.rehearsals)
  if (minutes <= 0) return null
  return minutes / pageCount(item.start_page, item.end_page)
}
