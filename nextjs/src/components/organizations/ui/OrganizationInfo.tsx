import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Pencil, UploadCloud } from 'lucide-react';
import { Avatar, FileUpload, ProgressRing } from '@skeletonlabs/skeleton-react';
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';
import type { Id } from '@/convex/_generated/dataModel';
import type { FileChangeDetails } from '@zag-js/file-upload';
import { useIsOwnerOrAdmin } from '@/components/organizations/api/hooks';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/primitives/ui/dialog';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from '@/components/primitives/ui/drawer';

export default function OrganizationInfo() {
  const user = useQuery(api.users.getUser);
  const activeOrganization = useQuery(api.organizations.getActiveOrganization);
  const isOwnerOrAdmin = useIsOwnerOrAdmin();
  const updateOrganization = useMutation(api.organizations.updateOrganizationProfile);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleChange = () => setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [manualSlugEdit, setManualSlugEdit] = useState(false);
  const [newLogoUploaded, setNewLogoUploaded] = useState(false);

  const [formState, setFormState] = useState({
    name: '',
    slug: ''
  });

  const [orgData, setOrgData] = useState({
    organizationId: '' as Id<'organizations'>,
    name: '',
    slug: '',
    logo: '',
    logoId: '' as Id<'_storage'> | undefined
  });

  useEffect(() => {
    if (activeOrganization) {
      setOrgData({
        organizationId: activeOrganization._id,
        name: activeOrganization.name,
        slug: activeOrganization.slug || '',
        logo: activeOrganization.logo || '',
        logoId: activeOrganization.logoId
      });
      setFormState({
        name: activeOrganization.name,
        slug: activeOrganization.slug || ''
      });
      setLogoPreview(activeOrganization.logo || '');
    }
  }, [activeOrganization]);

  useEffect(() => {
    if (!manualSlugEdit) {
      const formattedSlug = formState.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormState((prev) => ({ ...prev, slug: formattedSlug }));
    }
  }, [formState.name, manualSlugEdit]);

  if (!user || !activeOrganization) return null;

  const toggleEdit = () => {
    if (!isOwnerOrAdmin) return;
    setIsEditing(true);
    setSuccess('');
    setError('');
    setManualSlugEdit(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSuccess('');
    setError('');
    setLogoFile(null);
    setLogoPreview(orgData.logo || '');
    setFormState({ name: orgData.name, slug: orgData.slug });
    setManualSlugEdit(false);
    setNewLogoUploaded(false);
  };

  const handleFileChange = async (details: FileChangeDetails) => {
    const file = details.acceptedFiles.at(0);
    if (!file) return;
    try {
      setIsUploading(true);
      setError('');
      setSuccess('');
      const optimizedFile = await optimizeImage(file, {
        maxWidth: 512,
        maxHeight: 512,
        maxSizeKB: 500,
        quality: 0.85,
        format: 'webp',
        forceConvert: true
      });
      setLogoFile(optimizedFile);
      setLogoPreview(URL.createObjectURL(optimizedFile));
      setSuccess('Logo ready for upload!');
      setNewLogoUploaded(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to process logo: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsUploading(true);
      setSuccess('');
      setError('');
      let logoStorageId = orgData.logoId;
      if (logoFile) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': logoFile.type },
          body: logoFile
        });
        if (!response.ok) throw new Error('Failed to upload file');
        const result = await response.json();
        logoStorageId = result.storageId as Id<'_storage'>;
      }
      await updateOrganization({
        organizationId: orgData.organizationId,
        name: formState.name,
        slug: formState.slug,
        logoId: logoStorageId
      });
      setOrgData((prev) => ({ ...prev, name: formState.name, slug: formState.slug, logoId: logoStorageId, logo: logoPreview }));
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setError('');
      setLogoFile(null);
      setNewLogoUploaded(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to update profile: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const form = (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-4">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          name="name"
          className="input"
          value={formState.name}
          onChange={(e) => setFormState({ ...formState, name: e.target.value })}
        />

        <label htmlFor="slug">Slug URL</label>
        <input
          type="text"
          name="slug"
          className="input"
          value={formState.slug}
          onChange={(e) => {
            setManualSlugEdit(true);
            setFormState({ ...formState, slug: e.target.value });
          }}
        />

        <DialogFooter>
          <button type="button" className="btn preset-tonal w-full md:w-fit" onClick={cancelEdit}>
            Cancel
          </button>
          <button type="submit" className="btn preset-filled-primary-500 w-full md:w-fit" disabled={isUploading}>
            Save
          </button>
        </DialogFooter>
      </div>
    </form>
  );

  return (
    <div className="mb-6 flex flex-col w-full items-start gap-4">
      <FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
        <div className="group relative flex cursor-pointer flex-col items-center justify-center gap-2">
          <Avatar
            src={logoPreview || orgData.logo}
            name={orgData.logo || newLogoUploaded ? orgData.name : orgData.name || 'Organization'}
            size="size-16"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <UploadCloud className="size-6 text-white" />
          </div>
          {isUploading && (
            <ProgressRing
              value={null}
              size="size-14"
              meterStroke="stroke-primary-600-400"
              trackStroke="stroke-primary-50-950"
            />
          )}
        </div>
      </FileUpload>

      {isDesktop ? (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger
            className="border border-surface-300-700 hidden w-full flex-row content-center items-center rounded-xl py-2 pr-3 pl-4 md:flex hover:bg-surface-50-950 hover:border-surface-50-950 ease-in-out duration-300"
            onClick={toggleEdit}
          >
            <div className="flex w-full flex-col gap-1 text-left">
              <span className="text-surface-600-400 text-xs">Organization name</span>
              <span className="text-surface-800-200 font-medium">{orgData.name}</span>
            </div>
            <div className="btn preset-filled-surface-200-800 p-2">
              <Pencil size={16} color="currentColor" />
            </div>
          </DialogTrigger>
          <DialogContent className="md:max-w-108">
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
            </DialogHeader>
            <DialogDescription>{form}</DialogDescription>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isEditing} onOpenChange={setIsEditing}>
          <DrawerTrigger
            onClick={toggleEdit}
            className="flex w-full flex-row content-center items-center rounded-xl py-2 pr-3 pl-4 md:hidden border border-surface-300-700"
          >
            <div className="flex w-full flex-col gap-1 text-left">
              <span className="text-surface-600-400 text-xs">Organization name</span>
              <span className="text-surface-800-200 font-medium">{orgData.name}</span>
            </div>
            <div className="btn-icon preset-filled-surface-200-800">
              <Pencil size={16} color="currentColor" />
            </div>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Edit Organization</DrawerTitle>
            </DrawerHeader>
            <DrawerDescription>{form}</DrawerDescription>
          </DrawerContent>
        </Drawer>
      )}
      {success && <p className="text-success-600-400 mt-2">{success}</p>}
      {error && <p className="text-error-600-400 mt-2">{error}</p>}
    </div>
  );
}
