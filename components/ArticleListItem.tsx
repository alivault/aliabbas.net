import Link from 'next/link'
import getFormattedDate from '@/lib/getFormattedDate'

type Props = {
  article: Meta
}

export default function ListItem({ article }: Props) {
  const { id, title, date } = article
  const formattedDate = getFormattedDate(date)

  return (
    <li className='flex flex-col items-start gap-1'>
      <Link
        href={`/articles/${id}`}
        className='text-md text-link hover:underline'
      >
        {title}
      </Link>
      <span className='text-xs opacity-50'>{formattedDate}</span>
    </li>
  )
}
