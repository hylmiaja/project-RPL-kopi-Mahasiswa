import { AiSettingsForm } from "@/components/admin/AiSettingsForm";

export const metadata = {
  title: "Pengaturan Model AI & API Key – Kopi Mahasiswa",
};

export default function AdminAiSettingsPage() {
  return (
    <div className="py-2">
      <AiSettingsForm />
    </div>
  );
}

