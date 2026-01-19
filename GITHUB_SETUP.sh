#!/bin/bash
# GitHub Repository Setup Guide
# Run these commands from the project root directory

# ============================================================================
# STEP 1: Initialize Git Repository (if not already initialized)
# ============================================================================

# If you don't have git initialized yet:
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: Complete monorepo setup for DCMS Dental Clinic Management System"

# ============================================================================
# STEP 2: Create Repository on GitHub
# ============================================================================

# Visit https://github.com/new and create a new repository
# Name: dcms-dental-clinic (or your preferred name)
# Description: Full-stack Dental Clinic Management System
# Make it PUBLIC or PRIVATE based on your preference
# Do NOT initialize with README, .gitignore, or license
# Click "Create repository"

# ============================================================================
# STEP 3: Connect Local Repository to GitHub
# ============================================================================

# Replace <USERNAME> with your GitHub username and adjust URL if needed
git remote add origin https://github.com/<USERNAME>/dcms-dental-clinic.git

# Verify the remote was added
git remote -v

# ============================================================================
# STEP 4: Rename Branch to 'main' (if needed)
# ============================================================================

# Check current branch
git branch

# If on 'master', rename to 'main'
git branch -M main

# ============================================================================
# STEP 5: Push to GitHub
# ============================================================================

# Push the main branch to GitHub
git push -u origin main

# This will prompt you for GitHub credentials (or use SSH key)

# ============================================================================
# STEP 6: (OPTIONAL) Set Up GitHub Branch Protection
# ============================================================================

# On GitHub:
# 1. Go to Settings → Branches
# 2. Add rule for 'main' branch
# 3. Check:
#    - Require a pull request before merging
#    - Require status checks to pass before merging
#    - Include administrators in restrictions

# ============================================================================
# STEP 7: (OPTIONAL) Set Up Additional Branches
# ============================================================================

# Create and push 'develop' branch
git checkout -b develop
git push -u origin develop

# Go back to main
git checkout main

# ============================================================================
# STEP 8: Create First Feature Branch
# ============================================================================

# Create a feature branch for your next feature
git checkout -b feature/your-feature-name

# Make your changes, then:
git add .
git commit -m "feat: Add your feature description"
git push -u origin feature/your-feature-name

# Then create a Pull Request on GitHub

# ============================================================================
# USEFUL GIT COMMANDS
# ============================================================================

# Check status
git status

# View commit history
git log --oneline

# View branches
git branch -a

# Switch branches
git checkout branch-name

# Update from remote
git pull origin main

# Push changes
git push origin branch-name

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name

# ============================================================================
# COMMON GIT WORKFLOWS
# ============================================================================

# Start a new feature:
git checkout -b feature/feature-name
# ... make changes ...
git add .
git commit -m "feat: Add feature description"
git push -u origin feature/feature-name
# Create PR on GitHub

# Update from main:
git fetch origin
git rebase origin/main
# or
git merge origin/main

# Fix commit message:
git commit --amend -m "new message"

# Undo last commit (keep changes):
git reset --soft HEAD~1

# Undo last commit (discard changes):
git reset --hard HEAD~1

# ============================================================================
# GITHUB ACTIONS CI/CD
# ============================================================================

# The .github/workflows/ci.yml file is already set up
# It will automatically run when you push code
# Check the "Actions" tab on GitHub to see build status

# ============================================================================
# DEPLOYMENT SETUP (Optional)
# ============================================================================

# For frontend (Vercel):
# 1. Go to https://vercel.com
# 2. Import project from GitHub
# 3. Set build command: npm run build:frontend
# 4. Set publish directory: frontend/dist
# 5. Add environment variables

# For backend (Railway/Render):
# 1. Go to https://railway.app or https://render.com
# 2. Create new service
# 3. Connect GitHub repository
# 4. Add environment variables
# 5. Deploy

# ============================================================================
# CLONING THE REPOSITORY (For other team members)
# ============================================================================

# Clone the repository
git clone https://github.com/<USERNAME>/dcms-dental-clinic.git
cd dcms-dental-clinic

# Install dependencies
npm run install-all

# Create .env files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Edit .env files with your configuration

# Start development
npm run dev

# ============================================================================
