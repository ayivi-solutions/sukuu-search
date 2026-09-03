#!/usr/bin/env bash
set -euo pipefail

repo_url="${1:-}"
if [[ -z "${repo_url}" ]]; then
  echo "Usage: bash deploy-to-github-pages.sh https://github.com/OWNER/REPOSITORY.git"
  exit 2
fi

if [[ ! "${repo_url}" =~ ^(https://github.com/|git@github.com:).+/.+(.git)?$ ]]; then
  echo "Error: supply a GitHub repository clone URL."
  exit 2
fi

if [[ ! -d .git ]]; then
  git init -b main
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "${repo_url}"
else
  git remote add origin "${repo_url}"
fi

git add -A
if ! git diff --cached --quiet; then
  git commit -m "Deploy Ghana Schools Explorer"
fi
git branch -M main
git push -u origin main

echo
echo "Files pushed. In GitHub: Settings > Pages > Source > GitHub Actions."
echo "Then set the custom domain to search.sukuux.com and enable HTTPS."
