// Der neue, vereinfachte NavUser.tsx
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import AuthButton from "./AuthButton";

export default async function NavUser() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-row gap-4 items-center h-full">
      {user && <p className="">{user.email}</p>}

      <AuthButton user={user} />
    </div>
  );
}
