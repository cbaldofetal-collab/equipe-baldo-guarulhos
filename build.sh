#!/bin/bash
set -e

echo "Building with VITE_API_URL: $VITE_API_URL"
npm run build
