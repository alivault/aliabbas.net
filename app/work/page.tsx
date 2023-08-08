import WorkList from '@/components/WorkList';
import TheNav from '@/components/TheNav';

export default function WorkPage() {
  return (
    <main>
      <TheNav />
      <section className='flex flex-col gap-4'>
        <h1 className='text-2xl font-bold'>💼 Work History</h1>
        <WorkList />
      </section>
    </main>
  );
}
