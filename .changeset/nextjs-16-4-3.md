---
'@auth/nextjs': patch
---

chore: Upgrade Next.js to 16.4.3. 16.4.1 fixes two critical remote code execution vulnerabilities (in `use cache` functions returning typed arrays, and in the Image Optimization API with SVG files) and a denial of service through Server Actions; 16.4.0 is affected.
