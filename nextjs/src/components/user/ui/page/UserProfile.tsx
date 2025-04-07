import ProfileInfo from "@/components/user/ui/widget/ProfileInfo";
import DeleteUser from "@/components/user/ui/widget/DeleteUser";

export default function UserProfile() {
  return (
    <div className="w-full p-6 md:w-3/4">
      <ProfileInfo />
      <div className="flex justify-end">
        <DeleteUser />
      </div>
    </div>
  );
}
