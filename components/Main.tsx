interface MainProps {
  children: React.ReactNode
}
export default function Main({ children }: MainProps) {
  return <main className="mx-auto w-full max-w-2xl grow">{children}</main>
}
