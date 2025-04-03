import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ProfileInfo() {
  const user = useQuery(api.user.functions.getUser);

  return <div>Profile</div>;
}
