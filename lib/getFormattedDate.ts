export default function getFormattedDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(dateObj)
}
