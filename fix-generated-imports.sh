#!/bin/bash
# Fix generated TypeScript imports to include .js extension

echo "Fixing imports in generated files..."

find src/generated -name "*.ts" -type f -exec sed -i \
  -e "s|from '\./\([^']*\)'|from './\1.js'|g" \
  -e "s|from '\.\./\([^']*\)'|from '../\1.js'|g" \
  {} +

echo "Done! All imports now have .js extensions."
