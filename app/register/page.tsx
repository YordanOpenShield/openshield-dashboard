import { redirect } from "next/navigation";

export default function RegisterPage() {
  // Registration is disabled - only seed user can be created via API
  redirect("/login");
}
