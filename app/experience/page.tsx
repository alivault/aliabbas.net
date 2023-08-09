import WorkList from '@/components/WorkList';
import TheNav from '@/components/TheNav';
import Footer from '@/components/Footer';

export default function WorkPage() {
  return (
    <main className='flex flex-col gap-8'>
      <TheNav />
      <section className='flex flex-col gap-8'>
        <h1 className='text-2xl font-bold'>💼 Experience</h1>
        <WorkList />
        <Footer />
      </section>
    </main>
  );
}
