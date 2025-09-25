import { defineApp } from 'convex/server';
import resend from '@convex-dev/resend/convex.config';
import betterAuth from './betterAuth/convex.config';

const app = defineApp();
app.use(resend);
app.use(betterAuth);

export default app;
