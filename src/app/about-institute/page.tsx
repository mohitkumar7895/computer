import InternalPageLayout from "@/components/InternalPageLayout";

export default function AboutInstitutePage() {
  return (
    <InternalPageLayout
      title="About Us"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "About Us" }]}
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl space-y-4 text-sm leading-8 text-slate-500 sm:text-base sm:leading-9">
          <p>
            Welcome to Yukti Computer Institute, where technology meets excellence.
            Established in 2020, we are a leading computer training institute in Boisar
            Palghar dedicated to empowering individuals with the knowledge and skills
            needed to thrive in the digital age.
          </p>
          <p>
            Our mission is to provide top-notch education and hands-on training in
            computer science and IT, fostering a new generation of tech-savvy
            professionals. We combine practical classroom guidance, industry-relevant
            learning, and student-focused mentorship to help learners build confidence
            and career-ready skills.
          </p>
        </div>
      </div>
    </InternalPageLayout>
  );
}