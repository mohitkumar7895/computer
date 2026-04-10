import BecomeAtcForm from "@/components/affiliation/BecomeAtcForm";
import InternalPageLayout from "@/components/InternalPageLayout";

export default function BecomeAtcPage() {
  return (
    <InternalPageLayout
      title="Apply For ALC"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Students Section" },
        { label: "Apply for ALC" },
      ]}
    >
      <BecomeAtcForm />
    </InternalPageLayout>
  );
}
