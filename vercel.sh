#!/bin/bash
 
if [[ $VERCEL_ENV == "production"  ]] ; then 
  pnpm build:production
else 
  # pnpm build
  pnpm build:production
fi