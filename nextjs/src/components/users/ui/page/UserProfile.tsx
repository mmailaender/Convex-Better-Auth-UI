import ProfileInfo from "@/components/users/ui/widget/ProfileInfo";
import DeleteUser from "@/components/users/ui/widget/DeleteUser";

export default function UserProfile() {
  return (
    <div className="md:w-120 w-full ">
      <ProfileInfo />
      <div className="flex pt-10">
        <DeleteUser />
      </div>
    </div>
  );
}
