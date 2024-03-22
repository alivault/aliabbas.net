interface MainProps {
  children: React.ReactNode
}
export default function Main({ children }: MainProps) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10">
      {children}
    </main>
  )
}
