import ProfileInfo from '@/components/users/ui/ProfileInfo';
import DeleteUser from '@/components/users/ui/DeleteUser';


export default function UserProfile() {
	return (
		
		<div className="w-full">
			<ProfileInfo />
			<div className="flex pt-10">
				<DeleteUser />
			</div>
		</div>
	
	);
}
