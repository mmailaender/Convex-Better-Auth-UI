import { useState } from "react";
import { Tabs } from "@skeletonlabs/skeleton-react";
import { MembersList } from "@/components/organizations/ui/widget/MembersList";

export default function Members() {
  const [group, setGroup] = useState("members");
  return (
    <Tabs value={group} onValueChange={(e) => setGroup(e.value!)}>
      <Tabs.List>
        <Tabs.Control value="members">Members</Tabs.Control>
        <Tabs.Control value="invitations">Invitations</Tabs.Control>
      </Tabs.List>
      <Tabs.Content>
        <Tabs.Panel value="members">
          <MembersList />
        </Tabs.Panel>
        <Tabs.Panel value="invitations">Invitations Panel</Tabs.Panel>
      </Tabs.Content>
    </Tabs>
  );
}
