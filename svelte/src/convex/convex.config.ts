import { defineApp } from 'convex/server';
import resend from '@convex-dev/resend/convex.config';
import betterAuth from './betterAuth/convex.config';
import migrations from '@convex-dev/migrations/convex.config.js';

const app = defineApp();
app.use(resend);
app.use(betterAuth);
app.use(migrations);

export default app;
