import Link from 'next/link'
import getFormattedDate from '@/lib/getFormattedDate'

type Props = {
  article: Meta
}

export default function ListItem({ article }: Props) {
  const { id, title, date } = article
  const formattedDate = getFormattedDate(date)

  return (
    <li>
      <Link
        href={`/articles/${id}`}
        className="-mx-4 flex flex-col items-start gap-1 rounded-lg p-4 transition-colors hover:bg-foreground/10 active:bg-foreground/20"
      >
        {title}
        <span className="text-xs opacity-50">{formattedDate}</span>
      </Link>
    </li>
  )
}
