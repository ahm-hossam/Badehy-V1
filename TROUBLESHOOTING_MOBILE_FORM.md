# Troubleshooting: Mobile Form Not Appearing

## Problem
After creating a client and assigning a form in the dashboard, the client logs into the mobile app and sets their password, but the form doesn't appear.

## Root Causes & Solutions

### 1. ✅ Form Not Marked as "Main Form"

**Problem**: The check-in form created from the dashboard needs to be marked as the "Main Form" for it to be assigned to new clients.

**Solution**:
1. Go to Dashboard → Check-ins
2. Find your form
3. Click "Edit"
4. Toggle **"Main Form"** to ON (blue)
5. Click "Save & Publish"

### 2. ✅ Form Not Published

**Problem**: Only published forms are visible to clients in the mobile app. If the "Published" toggle is OFF, the form won't appear.

**Solution**:
1. Go to Dashboard → Check-ins
2. Find your form
3. Click "Edit"
4. Toggle **"Published"** to ON (green)
5. Click "Save & Publish"

**Visual Indicators**:
- ✅ **Published**: Badge shows "Visible to clients" (green)
- ❌ **Draft**: Badge shows "Draft - not visible" (gray)

### 3. ✅ Form Doesn't Have Any Questions

**Problem**: A form without questions cannot be displayed or submitted.

**Solution**:
1. Go to Dashboard → Check-ins
2. Click "Edit" on your form
3. Add at least one question using "Add Question"
4. Fill in the question details
5. Click "Save & Publish"

## How to Verify the Setup

### Dashboard Checklist

1. **Navigate to Check-ins page** (`/check-ins`)
   - You should see your form in the list

2. **Check form settings**:
   - ✅ Form name is filled
   - ✅ At least one question exists
   - ✅ "Main Form" badge is visible (blue)
   - ✅ Form status shows as published

3. **Edit the form** to verify:
   - ✅ "Main Form" toggle is ON (blue background)
   - ✅ "Published" toggle is ON (green background)

### Mobile App Testing

1. **Create a test client**:
   ```
   Name: Test Client
   Email: test@example.com
   Phone: 1234567890
   ```

2. **Note the temporary password** shown in the success message

3. **Open mobile app**:
   - Enter the client's email
   - Click "Next"
   - You should be redirected to "Set Password"

4. **Set password**:
   - Enter a new password (min 8 characters)
   - Confirm the password
   - Click "Save password"

5. **Expected behavior**:
   - If form exists and is published → Redirects to Form screen
   - If form is missing/not published → Shows error with instructions
   - If form already completed → Redirects to Home screen

### Improved Error Messages (Now Implemented)

The mobile app now shows helpful error messages:

**If form is not found:**
```
No main form found for this trainer

What does this mean?
Your trainer needs to create and publish a check-in form for you. 
Please contact your trainer to:
• Create a check-in form
• Mark it as "Main Form"
• Enable "Published" toggle

[Retry] [Skip for now]
```

## API Endpoints for Testing

### 1. Check if form exists

```bash
# Get all forms for a trainer
curl -X GET "http://localhost:4000/api/checkins?trainerId=1"
```

**Look for**:
- `isMainForm: true`
- `published: true`
- `questions: [...]` (not empty)

### 2. Check mobile forms API

```bash
# First, get a client auth token
# (You'll need to login with the client's email and password first)

# Then check the main form
curl -X GET "http://localhost:4000/mobile/forms/main" \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"
```

**Expected responses**:

**Success (form not completed)**:
```json
{
  "form": {
    "id": 1,
    "name": "Client Onboarding Form",
    "questions": [...]
  },
  "completed": false
}
```

**Success (form already completed)**:
```json
{
  "form": {...},
  "completed": true,
  "submission": {...}
}
```

**Error (no form found)**:
```json
{
  "error": "No main form found for this trainer"
}
```

## Common Issues & Quick Fixes

### Issue: "Client goes directly to Home screen"

**Possible causes**:
1. ✅ Form is not published → Enable "Published" toggle
2. ✅ Form is not marked as Main Form → Enable "Main Form" toggle
3. ✅ Client already completed the form → Check "Responses" page
4. ✅ API error → Check browser console for error details

### Issue: "Form appears but questions are missing"

**Possible causes**:
1. ✅ Form has no questions → Add questions in the form builder
2. ✅ Questions were not saved → Edit and re-save the form

### Issue: "Cannot submit form - validation error"

**Possible causes**:
1. ✅ Required questions not answered → Fill all required fields (marked with *)
2. ✅ Invalid data format → Check date/time fields

## Database Queries (via Prisma Studio)

Open Prisma Studio:
```bash
cd backend
npx prisma studio
```

### Check CheckInForm table:
- Filter by `trainerId` = your trainer ID
- Look for:
  - `isMainForm = true`
  - `published = true`
  - `questions` relationship has entries

### Check CheckInQuestion table:
- Filter by `formId` = your form ID
- Verify questions exist with:
  - `label` (question text)
  - `type` (question type)
  - `order` (question order)

### Check CheckInSubmission table:
- Filter by `clientId` = your client ID
- If a submission exists, the form is already completed

## Step-by-Step Fix Guide

### If you just created a form:

1. **Go to Dashboard → Check-ins**
2. **Find your newly created form**
3. **Click "Edit"**
4. **Verify settings**:
   - [ ] "Main Form" toggle is ON (blue)
   - [ ] "Published" toggle is ON (green)
   - [ ] At least one question exists
5. **Click "Save & Publish"**
6. **Test in mobile app**:
   - Create a new test client
   - Login with test client
   - Set password
   - Form should appear

### If form still doesn't appear:

1. **Check browser console** (F12) for errors
2. **Check mobile app logs** (Metro bundler terminal)
3. **Check backend logs** (backend terminal)
4. **Test API directly** using curl commands above
5. **Verify database** using Prisma Studio

## Code Changes Made (for reference)

### 1. Improved error handling in mobile app

**Files updated**:
- `mobile/app/login.tsx`
- `mobile/app/set-password.tsx`

**Change**: Now redirects to form screen even when form is not found (404), allowing the form screen to display a helpful error message.

### 2. Enhanced error UI in form screen

**File updated**:
- `mobile/app/form.tsx`

**Change**: Added detailed instructions when form is not found, including "Skip for now" option.

### 3. Added "Published" toggle to dashboard

**Files updated**:
- `frontend/app/(main)/check-ins/create/page.tsx`
- `frontend/app/(main)/check-ins/[id]/edit/page.tsx`
- `backend/src/routes/checkins.ts`

**Change**: Trainers can now explicitly control whether a form is visible to clients.

## Testing Checklist

- [ ] Form is created
- [ ] Form is marked as "Main Form"
- [ ] Form is marked as "Published"
- [ ] Form has at least one question
- [ ] Client is created and assigned the form
- [ ] Client can login to mobile app
- [ ] Client can set password
- [ ] Client is redirected to form screen
- [ ] Client can see all questions
- [ ] Client can navigate between questions
- [ ] Client can submit the form
- [ ] Submission appears in Dashboard → Check-ins → Responses

## Need More Help?

If the form still doesn't appear after following all these steps:

1. **Share the error message** from the mobile app
2. **Check browser console** for any errors
3. **Check API response** using curl commands
4. **Verify database state** using Prisma Studio
5. **Share backend logs** if there are 500 errors

---

**Last Updated**: October 21, 2025
**Status**: ✅ Fixed - Better error handling and instructions added

