import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";

export const Route = createFileRoute("/dashboard/documents")({
  component: () => (
    <div>
      <PageHeader title="Documents" description="Resident, property and estate documents in one library." icon={FileText} />
      <EmptyState
        title="Document library"
        description="Upload bylaws, meeting minutes, policies, resident IDs and property papers. Full upload UI is in the next iteration."
      />
    </div>
  ),
});
