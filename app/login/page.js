import LoginClient from "./LoginClient";
import { FREE_SIGNUP_CREDITS } from "../../lib/plans";

export const metadata = {
  title: "Sign In — TumaCV",
  description: `Sign in or create a free TumaCV account — ${FREE_SIGNUP_CREDITS} tailored applications free, no card required.`,
};

export default function Page() {
  return <LoginClient />;
}
