import { redirect } from "next/navigation";

export default function Home() {
  console.log("[v0] Root page hit, redirecting to /dashboard");
  redirect("/dashboard");
}
