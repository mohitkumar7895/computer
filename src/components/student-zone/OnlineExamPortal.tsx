import Image from "next/image";
import Link from "next/link";

export default function OnlineExamPortal() {
  return (
    <section className="relative min-h-[calc(100vh-88px)] overflow-hidden bg-black text-white">
      <Image
        src="https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1800&q=80"
        alt="Online examination"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-black/25" />

      <div className="relative mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl flex-col justify-between">
        <header className="flex flex-wrap items-center justify-between gap-3 bg-black/70 px-4 py-3 sm:px-8">
          <h1 className="text-2xl font-semibold tracking-wide sm:text-3xl">
            Online Examination Portal
          </h1>
          <button
            type="button"
            className="rounded-sm bg-yellow-400 px-3 py-1 text-sm font-semibold text-slate-900"
          >
            Login
          </button>
        </header>

        <main className="mb-auto mt-10 bg-black/55 px-4 py-6 sm:mt-14 sm:px-8">
          <h2 className="text-4xl font-medium sm:text-5xl">Instructions</h2>
          <ul className="mt-6 space-y-2 text-lg leading-relaxed text-white/95 sm:mt-8 sm:text-2xl">
            <li>• Test Duration: 90 Minutes</li>
            <li>• Number of questions: 70 Multiple Choice Questions with multiple subjects</li>
            <li>• Each question has multiple options out of which one or more may be correct</li>
          </ul>
        </main>

        <footer className="flex flex-col items-start justify-between gap-2 bg-black/70 px-4 py-3 text-sm sm:flex-row sm:items-center sm:px-8 sm:text-lg">
          <Link href="#" className="underline underline-offset-2">
            Administrator / Centre Login
          </Link>
          <p className="font-semibold">Copyright © Yukti Computer Institute</p>
        </footer>
      </div>
    </section>
  );
}
