import GitHubIcon from '@/components/GitHubIcon'

export default function Footer() {
  return (
    <footer className="flex flex-col items-center">
      <a
        href="https://github.com/alivault"
        target="_blank"
        aria-label="GitHub Icon"
      >
        <GitHubIcon />
      </a>
    </footer>
  )
}
