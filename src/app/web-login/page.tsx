export default function WebLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#2f3746] px-4">
      <section className="w-full max-w-md bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6">
        <h1 className="text-center text-3xl font-medium text-slate-800 sm:text-5xl">Administrator Login</h1>

        <form className="mt-7 space-y-4" action="#" method="post">
          <div>
            <label className="text-sm uppercase tracking-wide text-slate-500">User Name</label>
            <input
              type="text"
              placeholder="User Name"
              className="mt-2 h-12 w-full border border-slate-300 px-3 text-sm text-slate-700 outline-none transition focus:border-[#2aa847]"
            />
          </div>

          <div>
            <label className="text-sm uppercase tracking-wide text-slate-500">Password</label>
            <input
              type="password"
              placeholder="Password"
              className="mt-2 h-12 w-full border border-slate-300 px-3 text-sm text-slate-700 outline-none transition focus:border-[#2aa847]"
            />
          </div>

          <button
            type="submit"
            className="mt-1 h-12 w-full bg-[#2aa847] text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#25943e]"
          >
            Login
          </button>
        </form>
      </section>
    </main>
  );
}
