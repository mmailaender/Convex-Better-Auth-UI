import { useState } from "react";
import { Tabs } from "@skeletonlabs/skeleton-react";
import { MembersList } from "@/components/organizations/ui/widget/MembersList";
import { InvitationList } from "@/components/organizations/ui/widget/InvitationList";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useIsOwnerOrAdmin } from "@/components/organizations/api/hooks";

export default function Members() {
  const [group, setGroup] = useState("members");
  const members = useQuery(api.organizations.members.getOrganizationMembers);
  const invitations = useQuery(
    api.organizations.invitations.getOrganizationInvitations
  );
  const isOwnerOrAdmin = useIsOwnerOrAdmin();

  return (
    <Tabs value={group} onValueChange={(e) => setGroup(e.value!)}>
      <Tabs.List>
        <Tabs.Control value="members">
          Members {members && `(${members.length})`}
        </Tabs.Control>
        {isOwnerOrAdmin && (
          <Tabs.Control value="invitations">
            Invitations {invitations && `(${invitations.length})`}
          </Tabs.Control>
        )}
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Panel value="members">
          <MembersList />
        </Tabs.Panel>
        {isOwnerOrAdmin && (
          <Tabs.Panel value="invitations">
            <InvitationList />
          </Tabs.Panel>
        )}
      </Tabs.Content>
    </Tabs>
  );
}
