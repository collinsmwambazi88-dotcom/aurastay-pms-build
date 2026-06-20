import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { OnboardingWizard } from "./onboarding-wizard"

export default async function OnboardPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? ""

  return <OnboardingWizard creatorEmail={email} creatorName={user.firstName ?? email} />
}
