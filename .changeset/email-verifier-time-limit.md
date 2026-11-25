---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix(emails): The email check now gives the external email verifier 8 seconds. Before, its request had no time limit, so one slow answer kept the sign-in or sign-up screen waiting with no feedback. When the limit passes, the check reports its existing "Error processing email verification" result, and the person sees the existing error state and can try again. Results, messages and the behaviour without a verifier token are unchanged.
