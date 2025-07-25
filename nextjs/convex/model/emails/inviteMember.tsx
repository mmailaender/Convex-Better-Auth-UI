import { Button, Column, Heading, Img, Row, Section, Text } from '@react-email/components';
import { BaseEmail, styles } from './components/BaseEmail';

interface InviteMemberProps {
	url: string;
	inviter: {
		name: string;
		email: string;
		image?: string;
	};
	organization: {
		name: string;
		logo?: string;
	};
	brandName?: string;
	brandTagline?: string;
	brandLogoUrl?: string;
}

export default function InviteMember({
	url,
	inviter,
	organization,
	brandName,
	brandTagline,
	brandLogoUrl
}: InviteMemberProps) {
	return (
		<BaseEmail
			previewText={`Join ${organization.name} on ${brandName}`}
			brandName={brandName}
			brandTagline={brandTagline}
			brandLogoUrl={brandLogoUrl}
		>
			<Heading style={styles.h1}>
				Join {organization.name} on {brandName}
			</Heading>
			<Text style={styles.text}>
				<b>{inviter.name}</b> has invited you to join <b>{organization.name}</b> on{' '}
				<b>{brandName}</b>
			</Text>
			{/* Visual Flow: Inviter → Organization */}
			<Section className="mb-[32px]">
				<Row>
					<Column className="w-[120px] text-center">
						{inviter.image ? (
							<Img
								src={inviter.image}
								alt={inviter.name}
								className="mx-auto mb-[8px] h-[80px] w-[80px] rounded-full object-cover"
							/>
						) : (
							<div className="mx-auto mb-[8px] flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[#E5E7EB]">
								<Text className="mb-0 text-[32px] font-bold text-[#6B7280]">
									{inviter.name.charAt(0).toUpperCase()}
								</Text>
							</div>
						)}
						<Text className="mb-0 text-[14px] font-medium text-[#6B7280]">{inviter.name}</Text>
					</Column>

					<Column className="w-[80px] text-center">
						<div className="mb-[8px] flex h-[80px] items-center justify-center">
							<Text className="mb-0 text-[32px] text-[#3B82F6]">→</Text>
						</div>
						<Text className="mb-0 text-[14px] text-[#6B7280]">invites you</Text>
					</Column>

					<Column className="w-[120px] text-center">
						{organization.logo ? (
							<Img
								src={organization.logo}
								alt={organization.name}
								className="mx-auto mb-[8px] h-[80px] w-[80px] rounded-[8px] object-cover"
							/>
						) : (
							<div className="mx-auto mb-[8px] flex h-[80px] w-[80px] items-center justify-center rounded-[8px] bg-[#3B82F6]">
								<Text className="mb-0 text-[32px] font-bold text-white">
									{organization.name.charAt(0).toUpperCase()}
								</Text>
							</div>
						)}
						<Text className="mb-0 text-[14px] font-medium text-[#6B7280]">{organization.name}</Text>
					</Column>
				</Row>
			</Section>
			{/* Call to Action */}
			<Section className="mb-[32px] text-center">
				<Button
					href={url}
					className="box-border rounded-[8px] bg-[#3B82F6] px-[32px] py-[16px] text-[16px] font-semibold text-white no-underline"
				>
					Accept Invitation
				</Button>
			</Section>
		</BaseEmail>
	);
}
