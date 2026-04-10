import Image from "next/image";

const timelineItems = [
  {
    question: "Is You Institute Is Government Approved?",
    answer: "",
    active: false,
  },
  {
    question: "Certificate Provided By Your Institute Is Government Approved?",
    answer: "Ans. Yes",
    active: true,
  },
  {
    question: "Is Your Institute Has Online Learning Mode?",
    answer: "",
    active: false,
  },
  {
    question: "Where Is Head Office Of Your Institute ?",
    answer: "",
    active: false,
  },
  {
    question: "Is Your Institute Provide Service For ATC All Over India Yes",
    answer: "",
    active: false,
  },
];

export default function FaqAbout() {
  return (
    <section id="about" className="scroll-mt-28 bg-white px-4 py-12 sm:scroll-mt-32 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[0.98fr_1fr] lg:items-start">
        <div id="faq" className="scroll-mt-28 sm:scroll-mt-32">
          <div>
            <h2 className="text-xl font-black uppercase tracking-wide text-slate-900 sm:text-2xl lg:text-[2rem]">
              Frequently <span className="text-[#0a0aa1]">Questions</span>
            </h2>
            <div className="mt-4 h-1 w-16 bg-slate-200" />
          </div>

          <div className="relative mt-8 space-y-6 pl-12 sm:mt-10 sm:pl-14">
            <div className="absolute top-3 bottom-3 left-6.5 w-px bg-slate-300" />
            {timelineItems.map((item) => (
              <div key={item.question} className="relative">
                <span
                  className={`absolute top-1 -left-9 flex h-6 w-6 items-center justify-center rounded-full border ${
                    item.active
                      ? "border-[#0a0aa1] bg-white"
                      : "border-[#0a0aa1] bg-[#0a0aa1]"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      item.active ? "bg-[#0a0aa1]" : "bg-white"
                    }`}
                  />
                </span>

                <h3 className="text-sm font-bold leading-6 text-slate-600 sm:text-lg sm:leading-7">
                  {item.question}
                </h3>
                {item.answer ? (
                  <p className="mt-2 text-sm text-slate-500">{item.answer}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-wide text-slate-900 sm:text-2xl lg:text-[2rem]">
              About <span className="text-[#0a0aa1]">Us</span>
            </h2>
            <div className="mt-4 h-1 w-16 bg-slate-200" />
          </div>

          <div className="relative mt-10 sm:mt-12">
            <div className="absolute -left-5 top-5 h-28 w-full bg-slate-100 sm:-left-6 sm:top-6 sm:h-36" />
            <div className="relative h-48 overflow-hidden sm:h-56 lg:h-64">
              <Image
                src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80"
                alt="Computer lab"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div className="mt-6 max-w-xl text-slate-500">
            <h3 id="about-institute" className="scroll-mt-28 text-xl font-extrabold text-slate-900 sm:scroll-mt-32 sm:text-2xl">
              About Institute
            </h3>
            <div className="mt-4 space-y-3 text-sm leading-7">
              <p>
                We Yukti Group&apos;s Yukti Computer Institute, approved under MSME act by government of India,
              </p>
              <p>
                We have been started in the year 2018, with motto to educate students according to current industrial trend .Till date we have trained more than 500+ student right now most of them are working in well reputed Industries.
              </p>
              <p>
                We have very high qualified team who has wide range of experience in IT industry.
              </p>
            </div>

            <button
              type="button"
              className="mt-5 inline-flex items-center gap-2 rounded-sm bg-[#0a0aa1] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#080885]"
            >
              Read More
              <span className="text-xs">▶</span>
            </button>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article id="director-message" className="scroll-mt-28 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:scroll-mt-32">
                <h4 className="text-sm font-bold text-slate-900">Director Message</h4>
                <p className="mt-2 text-xs leading-6 text-slate-600">
                  We focus on practical learning, discipline, and career-ready training for every student.
                </p>
              </article>

              <article id="our-mission" className="scroll-mt-28 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:scroll-mt-32">
                <h4 className="text-sm font-bold text-slate-900">Our Mission</h4>
                <p className="mt-2 text-xs leading-6 text-slate-600">
                  To provide affordable and industry-oriented computer education with real skill development.
                </p>
              </article>

              <article id="our-vision" className="scroll-mt-28 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:scroll-mt-32">
                <h4 className="text-sm font-bold text-slate-900">Our Vision</h4>
                <p className="mt-2 text-xs leading-6 text-slate-600">
                  To help learners become confident professionals and create better opportunities through technology.
                </p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}