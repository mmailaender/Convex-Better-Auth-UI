import ProfileInfo from "@/components/users/ui/widget/ProfileInfo";
import DeleteUser from "@/components/users/ui/widget/DeleteUser";

export default function UserProfile() {
  return (
    <div className="w-full p-6">
      <ProfileInfo />
      <div className="flex justify-end">
        <DeleteUser />
      </div>
    </div>
  );
}
