import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar } from "@skeletonlabs/skeleton-react";

import type { Id } from "@/convex/_generated/dataModel";

/**
 * Component that displays organization information and allows editing
 * for users with owner or admin roles
 */
export default function OrganizationInfo() {
  const user = useQuery(api.users.getUser);
  const activeOrganization = useQuery(api.organizations.getActiveOrganization);
  // Organization update mutation
  const updateOrganization = useMutation(
    api.organizations.updateOrganizationProfile
  );

  if (!user || !activeOrganization) {
    return null;
  }
  // Component state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [profileData, setProfileData] = useState<{
    organizationId: Id<"organizations">;
    name: string;
    slug: string;
    logo?: string;
  }>({
    organizationId: activeOrganization._id,
    name: activeOrganization.name,
    slug: activeOrganization.slug,
    logo: activeOrganization.logo,
  });

  // Check if user is owner or admin
  const isOwnerOrAdmin = [
    "role_organization_owner",
    "role_organization_admin",
  ].includes(activeOrganization.role);

  /**
   * Toggles edit mode for organization profile
   */
  const toggleEdit = (): void => {
    if (!isOwnerOrAdmin) return;
    setIsEditing(true);
    setSuccess("");
    setError("");
  };

  /**
   * Cancels edit mode without saving changes
   */
  const cancelEdit = (): void => {
    setIsEditing(false);
    setSuccess("");
    setError("");
  };

  /**
   * Handles form submission to update organization profile
   */
  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    try {
      // Call the Convex mutation to update the organization
      await updateOrganization({
        organizationId: profileData.organizationId,
        name: profileData.name,
        slug: profileData.slug,
      });

      // Update the local state
      setIsEditing(false);
      setSuccess("Profile updated successfully!");
      setError("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Failed to update profile: ${errorMessage}`);
    }
  };

  return (
    <div className="mb-6 flex items-center gap-4">
      <Avatar src={activeOrganization.logo} name={activeOrganization.name} />

      {!isEditing ? (
        <>
          <span className="text-surface-800-200 font-medium">
            {activeOrganization.name}
          </span>
          {isOwnerOrAdmin && (
            <button onClick={toggleEdit} className="btn">
              Edit
            </button>
          )}
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              name="name"
              className="input"
              value={profileData.name}
              onChange={(e) =>
                setProfileData({ ...profileData, name: e.target.value })
              }
            />
            <label htmlFor="slug">Slug URL</label>
            <input
              type="text"
              name="slug"
              className="input"
              value={profileData.slug}
              onChange={(e) =>
                setProfileData({ ...profileData, slug: e.target.value })
              }
            />
            <div className="flex gap-2">
              <button type="submit" className="variant-filled btn">
                Save
              </button>
              <button
                type="button"
                className="variant-ghost btn"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {success && <p className="text-success-600-400">{success}</p>}
      {error && <p className="text-error-600-400">{error}</p>}
    </div>
  );
}
