import FranchiseLoginForm from "@/components/affiliation/FranchiseLoginForm";
import InternalPageLayout from "@/components/InternalPageLayout";

export default function FranchiseLoginPage() {
  return (
    <InternalPageLayout
      title="ATC Login"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Franchise" },
        { label: "ATC Login" },
      ]}
    >
      <FranchiseLoginForm />
    </InternalPageLayout>
  );
}
