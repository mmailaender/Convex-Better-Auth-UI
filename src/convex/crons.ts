import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

// Register all cron jobs for the application
const crons = cronJobs();

// Clean up expired verifications - runs every hour
crons.interval(
	'clean-up-expired-verifications',
	{ hours: 1 },
	internal.cleanups.cleanExpiredVerifications
);

// Clean up expired invitations - runs every hour
crons.interval(
	'clean-up-expired-invitations',
	{ hours: 1 },
	internal.cleanups.cleanExpiredInvitations
);

// Clean up expired access tokens - runs every 5 minutes
crons.interval(
	'clean-up-expired-access-tokens',
	{ minutes: 5 },
	internal.cleanups.cleanExpiredAccessTokens
);

// Clean up expired refresh tokens - runs every hour
crons.interval(
	'clean-up-expired-refresh-tokens',
	{ hours: 1 },
	internal.cleanups.cleanExpiredRefreshTokens
);

export default crons;
