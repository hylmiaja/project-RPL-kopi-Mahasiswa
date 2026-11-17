import { AiSettingsForm } from "@/components/admin/AiSettingsForm";

export const metadata = {
  title: "Pengaturan Model AI – Admin Panel",
};

export default function AdminSettingsAiPage() {
  return (
    <div className="py-2">
      <AiSettingsForm />
    </div>
  );
}

