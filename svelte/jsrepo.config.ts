import { defineConfig } from 'jsrepo';
import { repository } from 'jsrepo/outputs';
import { fs } from 'jsrepo/providers';

export default defineConfig({
	providers: [fs()],
	registry: {
		name: '@auth/svelte',
		description: 'Plug & Play Auth Widgets for your application',
		homepage: 'https://etesie.dev/docs/auth',
		authors: undefined,
		bugs: 'https://github.com/mmailaender/auth/issues',
		repository: 'https://github.com/mmailaender/auth',
		tags: ['auth', 'svelte', 'ui', 'convex', 'better-auth'],
		version: 'package',
		access: undefined,
		defaultPaths: {
			convex: './src/convex',
			lib: './src/lib',
			routes: './src/routes',
			themes: './src/themes'
		},
		excludeDeps: ['svelte', '@sveltejs/kit'],
		outputs: [repository({ format: true })],
		items: [
			{
				name: '_generated',
				add: 'when-needed',
				type: 'convex',
				files: [
					{
						path: 'src/convex/_generated',
						files: [
							{
								path: 'api.d.ts'
							},
							{
								path: 'api.js'
							},
							{
								path: 'dataModel.d.ts'
							},
							{
								path: 'server.d.ts'
							},
							{
								path: 'server.js'
							}
						]
					}
				]
			},
			{
				name: 'auth.config',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/auth.config.ts'
					}
				]
			},
			{
				name: 'auth.constants',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/auth.constants.ts'
					}
				]
			},
			{
				name: 'auth.constants.types',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/auth.constants.types.ts'
					}
				]
			},
			{
				name: 'convex-auth',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/auth.ts'
					}
				]
			},
			{
				name: 'betterAuth',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/betterAuth',
						files: [
							{
								path: '_generated/api.ts'
							},
							{
								path: '_generated/component.ts'
							},
							{
								path: '_generated/dataModel.ts'
							},
							{
								path: '_generated/server.ts'
							},
							{
								path: 'adapter.ts'
							},
							{
								path: 'auth.ts'
							},
							{
								path: 'convex.config.ts'
							},
							{
								path: 'organization.ts'
							},
							{
								path: 'schema.ts'
							},
							{
								path: 'user.ts'
							}
						]
					}
				]
			},
			{
				name: 'convex.config',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/convex.config.ts'
					}
				]
			},
			{
				name: 'deviceAuthorization',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/deviceAuthorization.ts'
					}
				]
			},
			{
				name: 'email',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/email.ts'
					}
				]
			},
			{
				name: 'http',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/http.ts'
					}
				]
			},
			{
				name: 'model',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/model',
						files: [
							{
								path: 'emails/templates/baseEmail.ts'
							},
							{
								path: 'emails/templates/emailTemplates.ts'
							},
							{
								path: 'emails/validateEmail.ts'
							},
							{
								path: 'organizations/index.ts'
							}
						]
					}
				]
			},
			{
				name: 'convex-organizations',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/organizations',
						files: [
							{
								path: 'invitations/queries.ts'
							},
							{
								path: 'members/mutations.ts'
							},
							{
								path: 'mutations.ts'
							},
							{
								path: 'queries.ts'
							}
						]
					}
				]
			},
			{
				name: 'polyfills',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/polyfills.ts'
					}
				]
			},
			{
				name: 'schema',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/schema.ts'
					}
				]
			},
			{
				name: 'storage',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/storage.ts'
					}
				]
			},
			{
				name: 'tsconfig',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/tsconfig.json'
					}
				]
			},
			{
				name: 'convex-users',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/users',
						files: [
							{
								path: 'actions.ts'
							},
							{
								path: 'mutations.ts'
							},
							{
								path: 'queries.ts'
							}
						]
					}
				]
			},
			{
				name: 'auth',
				add: 'when-added',
				type: 'lib',
				files: [
					{
						path: 'src/lib/auth',
						files: [
							{
								path: 'api/auth-client.ts'
							},
							{
								path: 'ui/AuthDialogProvider.svelte'
							},
							{
								path: 'ui/EmailOtpFlow.svelte'
							},
							{
								path: 'ui/EmailStep.svelte'
							},
							{
								path: 'ui/MagicLinkFlow.svelte'
							},
							{
								path: 'ui/PasswordFlow.svelte'
							},
							{
								path: 'ui/SignIn.svelte'
							},
							{
								path: 'ui/SignOutButton.svelte'
							},
							{
								path: 'ui/SocialFlow.svelte'
							}
						]
					}
				]
			},
			{
				name: 'organizations',
				add: 'when-added',
				type: 'lib',
				files: [
					{
						path: 'src/lib/organizations',
						files: [
							{
								path: 'api/roles.svelte.ts'
							},
							{
								path: 'ui/CreateOrganization.svelte'
							},
							{
								path: 'ui/DeleteOrganization.svelte'
							},
							{
								path: 'ui/GeneralSettings.svelte'
							},
							{
								path: 'ui/Invitations.svelte'
							},
							{
								path: 'ui/InviteMembers.svelte'
							},
							{
								path: 'ui/LeaveOrganization.svelte'
							},
							{
								path: 'ui/Members.svelte'
							},
							{
								path: 'ui/MembersAndInvitations.svelte'
							},
							{
								path: 'ui/OrganizationProfile.svelte'
							},
							{
								path: 'ui/OrganizationProfileHost.svelte'
							},
							{
								path: 'ui/OrganizationSwitcher.svelte'
							},
							{
								path: 'utils/organization.constants.ts'
							}
						]
					}
				]
			},
			{
				name: 'primitives',
				add: 'when-needed',
				type: 'lib',
				files: [
					{
						path: 'src/lib/primitives',
						files: [
							{
								path: 'hooks/use-clipboard.svelte.ts'
							},
							{
								path: 'ui/FeedbackMessage.svelte'
							},
							{
								path: 'ui/Sidebar.svelte'
							},
							{
								path: 'ui/avatar/avatar-fallback.svelte'
							},
							{
								path: 'ui/avatar/avatar-image.svelte'
							},
							{
								path: 'ui/avatar/avatar-marble.svelte'
							},
							{
								path: 'ui/avatar/avatar.svelte'
							},
							{
								path: 'ui/avatar/index.ts'
							},
							{
								path: 'ui/combobox/combobox-clear-trigger.svelte'
							},
							{
								path: 'ui/combobox/combobox-content.svelte'
							},
							{
								path: 'ui/combobox/combobox-control.svelte'
							},
							{
								path: 'ui/combobox/combobox-input.svelte'
							},
							{
								path: 'ui/combobox/combobox-item-group-label.svelte'
							},
							{
								path: 'ui/combobox/combobox-item-group.svelte'
							},
							{
								path: 'ui/combobox/combobox-item-indicator.svelte'
							},
							{
								path: 'ui/combobox/combobox-item-text.svelte'
							},
							{
								path: 'ui/combobox/combobox-item.svelte'
							},
							{
								path: 'ui/combobox/combobox-label.svelte'
							},
							{
								path: 'ui/combobox/combobox-positioner.svelte'
							},
							{
								path: 'ui/combobox/combobox-root.svelte'
							},
							{
								path: 'ui/combobox/combobox-trigger.svelte'
							},
							{
								path: 'ui/combobox/index.ts'
							},
							{
								path: 'ui/copy-button/copy-button.svelte'
							},
							{
								path: 'ui/copy-button/index.ts'
							},
							{
								path: 'ui/copy-button/types.ts'
							},
							{
								path: 'ui/dialog/dialog-backdrop.svelte'
							},
							{
								path: 'ui/dialog/dialog-close-x.svelte'
							},
							{
								path: 'ui/dialog/dialog-close.svelte'
							},
							{
								path: 'ui/dialog/dialog-content.svelte'
							},
							{
								path: 'ui/dialog/dialog-description.svelte'
							},
							{
								path: 'ui/dialog/dialog-footer.svelte'
							},
							{
								path: 'ui/dialog/dialog-header.svelte'
							},
							{
								path: 'ui/dialog/dialog-root.svelte'
							},
							{
								path: 'ui/dialog/dialog-title.svelte'
							},
							{
								path: 'ui/dialog/dialog-trigger.svelte'
							},
							{
								path: 'ui/dialog/index.ts'
							},
							{
								path: 'ui/drawer/drawer-backdrop.svelte'
							},
							{
								path: 'ui/drawer/drawer-close-x.svelte'
							},
							{
								path: 'ui/drawer/drawer-close.svelte'
							},
							{
								path: 'ui/drawer/drawer-content.svelte'
							},
							{
								path: 'ui/drawer/drawer-description.svelte'
							},
							{
								path: 'ui/drawer/drawer-footer.svelte'
							},
							{
								path: 'ui/drawer/drawer-header.svelte'
							},
							{
								path: 'ui/drawer/drawer-nested.svelte'
							},
							{
								path: 'ui/drawer/drawer-title.svelte'
							},
							{
								path: 'ui/drawer/drawer-trigger.svelte'
							},
							{
								path: 'ui/drawer/drawer.svelte'
							},
							{
								path: 'ui/drawer/index.ts'
							},
							{
								path: 'ui/image-cropper/image-cropper-cancel.svelte'
							},
							{
								path: 'ui/image-cropper/image-cropper-controls.svelte'
							},
							{
								path: 'ui/image-cropper/image-cropper-crop.svelte'
							},
							{
								path: 'ui/image-cropper/image-cropper-cropper.svelte'
							},
							{
								path: 'ui/image-cropper/image-cropper-dialog.svelte'
							},
							{
								path: 'ui/image-cropper/image-cropper-preview.svelte'
							},
							{
								path: 'ui/image-cropper/image-cropper-upload-trigger.svelte'
							},
							{
								path: 'ui/image-cropper/image-cropper.svelte'
							},
							{
								path: 'ui/image-cropper/image-cropper.svelte.ts'
							},
							{
								path: 'ui/image-cropper/index.ts'
							},
							{
								path: 'ui/image-cropper/types.ts'
							},
							{
								path: 'ui/image-cropper/utils.ts'
							},
							{
								path: 'ui/menu/dropdown-menu-shortcut.svelte'
							},
							{
								path: 'ui/menu/index.ts'
							},
							{
								path: 'ui/menu/menu-checkbox-item.svelte'
							},
							{
								path: 'ui/menu/menu-content.svelte'
							},
							{
								path: 'ui/menu/menu-item-group-label.svelte'
							},
							{
								path: 'ui/menu/menu-item-group.svelte'
							},
							{
								path: 'ui/menu/menu-item.svelte'
							},
							{
								path: 'ui/menu/menu-label.svelte'
							},
							{
								path: 'ui/menu/menu-radio-item-group.svelte'
							},
							{
								path: 'ui/menu/menu-radio-item.svelte'
							},
							{
								path: 'ui/menu/menu-separator.svelte'
							},
							{
								path: 'ui/menu/menu-trigger-item.svelte'
							},
							{
								path: 'ui/menu/menu-trigger.svelte'
							},
							{
								path: 'ui/password/index.ts'
							},
							{
								path: 'ui/password/password-copy.svelte'
							},
							{
								path: 'ui/password/password-error.svelte'
							},
							{
								path: 'ui/password/password-input.svelte'
							},
							{
								path: 'ui/password/password-strength.svelte'
							},
							{
								path: 'ui/password/password-toggle-visibility.svelte'
							},
							{
								path: 'ui/password/password.svelte'
							},
							{
								path: 'ui/password/password.svelte.ts'
							},
							{
								path: 'ui/password/types.ts'
							},
							{
								path: 'ui/popover/index.ts'
							},
							{
								path: 'ui/popover/popover-content.svelte'
							},
							{
								path: 'ui/popover/popover-trigger.svelte'
							},
							{
								path: 'ui/select/index.ts'
							},
							{
								path: 'ui/select/select-content.svelte'
							},
							{
								path: 'ui/select/select-group-heading.svelte'
							},
							{
								path: 'ui/select/select-group.svelte'
							},
							{
								path: 'ui/select/select-item.svelte'
							},
							{
								path: 'ui/select/select-label.svelte'
							},
							{
								path: 'ui/select/select-scroll-down-button.svelte'
							},
							{
								path: 'ui/select/select-scroll-up-button.svelte'
							},
							{
								path: 'ui/select/select-separator.svelte'
							},
							{
								path: 'ui/select/select-trigger.svelte'
							},
							{
								path: 'ui/separator/index.ts'
							},
							{
								path: 'ui/separator/separator.svelte'
							},
							{
								path: 'ui/sonner/index.ts'
							},
							{
								path: 'ui/sonner/sonner.svelte'
							},
							{
								path: 'ui/tabs/index.ts'
							},
							{
								path: 'ui/tabs/tabs-content.svelte'
							},
							{
								path: 'ui/tabs/tabs-list.svelte'
							},
							{
								path: 'ui/tabs/tabs-trigger.svelte'
							},
							{
								path: 'ui/tabs/tabs.svelte'
							},
							{
								path: 'ui/toggle/index.ts'
							},
							{
								path: 'ui/toggle/toggle.svelte'
							},
							{
								path: 'utils/dragState.svelte.ts'
							},
							{
								path: 'utils/focusScroll.ts'
							},
							{
								path: 'utils/mobileState.svelte.ts'
							},
							{
								path: 'utils/optimizeImage.ts'
							},
							{
								path: 'utils/routeMatcher.ts'
							},
							{
								path: 'utils.ts'
							}
						]
					}
				]
			},
			{
				name: 'users',
				add: 'when-added',
				type: 'lib',
				files: [
					{
						path: 'src/lib/users',
						files: [
							{
								path: 'ui/Accounts.svelte'
							},
							{
								path: 'ui/ApiKeys.svelte'
							},
							{
								path: 'ui/DeleteUser.svelte'
							},
							{
								path: 'ui/Emails.svelte'
							},
							{
								path: 'ui/ProfileInfo.svelte'
							},
							{
								path: 'ui/UserButton.svelte'
							},
							{
								path: 'ui/UserProfile.svelte'
							},
							{
								path: 'ui/UserProfileHost.svelte'
							},
							{
								path: 'utils/user.constants.ts'
							},
							{
								path: 'utils/userProfile.ts'
							}
						]
					}
				]
			},
			{
				name: 'api',
				add: 'when-added',
				type: 'routes',
				files: [
					{
						path: 'src/routes/api',
						files: [
							{
								path: 'auth/[...all]/+server.ts'
							},
							{
								path: 'organization/accept-invitation/[invitationId]/+page.svelte'
							}
						]
					}
				]
			},
			{
				name: 'device-authorization',
				add: 'when-added',
				type: 'routes',
				files: [
					{
						path: 'src/routes/device-authorization',
						files: [
							{
								path: '[code]/+page.svelte'
							}
						]
					}
				]
			},
			{
				name: 'reset-password',
				add: 'when-added',
				type: 'routes',
				files: [
					{
						path: 'src/routes/reset-password',
						files: [
							{
								path: '+page.svelte'
							}
						]
					}
				]
			},
			{
				name: 'signin',
				add: 'when-added',
				type: 'routes',
				files: [
					{
						path: 'src/routes/signin',
						files: [
							{
								path: '+page.svelte'
							}
						]
					}
				]
			},
			{
				name: 'auth-theme',
				add: 'when-added',
				type: 'themes',
				files: [
					{
						path: 'src/themes/auth.css'
					}
				]
			}
		]
	}
});
