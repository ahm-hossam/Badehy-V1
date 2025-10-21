# Form Pre-Fill Feature Documentation

## Overview

The mobile check-in form now automatically pre-fills with any information the trainer entered when creating the client. This provides a better user experience by:
- Reducing redundant data entry for clients
- Ensuring consistency between trainer-entered data and form submissions
- Allowing clients to verify and edit trainer-entered information

## How It Works

### 1. **Trainer Creates Client** (Dashboard)

When a trainer creates a client from the dashboard (`/clients/create`), they can enter:

**Basic Information:**
- Full Name
- Email
- Phone Number

**Additional Information** (if entered in future):
- Gender
- Age
- Source (referral source)
- Height
- Weight
- Fitness Goals
- Training preferences
- And more...

### 2. **Client Logs In** (Mobile App)

When the client logs into the mobile app and opens the check-in form, the system:

1. **Fetches the form** from `/mobile/forms/main` API
2. **Receives pre-filled data** alongside the form
3. **Automatically fills matching questions** with trainer-entered data
4. **Shows visual indicators** for pre-filled fields

### 3. **Client Can Edit** (Mobile App)

- All pre-filled fields are **editable**
- Client sees a blue badge: **"✓ Pre-filled by your trainer (you can edit)"**
- Client can change any pre-filled value
- Client can leave pre-filled values as-is

## Field Mapping

The system automatically matches form questions to client data based on question labels. Here's how it works:

### Question Label Matching

The system uses **fuzzy matching** that:
- Ignores case (uppercase/lowercase)
- Ignores special characters and spaces
- Matches common variations of the same field

### Supported Field Mappings

| Question Label Examples | Maps To Client Field |
|------------------------|---------------------|
| "Full Name", "Name", "Your Name" | `fullName` |
| "Email", "Email Address", "Your Email" | `email` |
| "Phone", "Phone Number", "Mobile", "Contact" | `phone` |
| "Gender", "Sex" | `gender` |
| "Age", "Your Age" | `age` |
| "Source", "Referral Source", "How did you hear" | `source` |
| "Height", "Your Height" | `height` |
| "Weight", "Your Weight", "Current Weight" | `weight` |
| "Goal", "Goals", "Fitness Goal" | `goal` or `goals` |
| "Workout Place", "Training Location" | `workoutPlace` |
| "Level", "Fitness Level", "Experience Level" | `level` |
| "Injuries", "Health Notes", "Medical Conditions" | `injuriesHealthNotes` |
| "Preferred Training Days", "Training Days" | `preferredTrainingDays` |
| "Preferred Training Time", "Training Time" | `preferredTrainingTime` |
| "Equipment", "Equipment Availability" | `equipmentAvailability` |
| "Training Style", "Favorite Training Style" | `favoriteTrainingStyle` |
| "Weak Areas", "Areas to Improve" | `weakAreas` |
| "Nutrition Goal", "Diet Goal" | `nutritionGoal` |
| "Diet Preference", "Diet Type" | `dietPreference` |
| "Meal Count", "Meals Per Day" | `mealCount` |
| "Food Allergies", "Allergies" | `foodAllergies` |
| "Disliked Ingredients", "Foods Dislike" | `dislikedIngredients` |
| "Current Nutrition Plan", "Nutrition Plan" | `currentNutritionPlan` |

### Examples

**Trainer enters:**
- Full Name: "John Doe"
- Email: "john@example.com"
- Phone: "1234567890"

**Form has questions:**
1. "What is your full name?" → Pre-filled with "John Doe"
2. "Your email address" → Pre-filled with "john@example.com"
3. "Mobile number" → Pre-filled with "1234567890"
4. "What is your fitness goal?" → Empty (not entered by trainer)

## Visual Indicators

### Blue Badge

When a field is pre-filled, the client sees a blue badge above the input:

```
┌─────────────────────────────────────────┐
│ What is your full name? *               │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Pre-filled by your trainer (you   │ │
│ │   can edit)                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ John Doe                            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Badge Styling:**
- Light blue background (#DBEAFE)
- Blue border (#93C5FD)
- Blue text (#1E40AF)
- Checkmark icon for visual confirmation

## API Response Format

### GET `/mobile/forms/main`

**Response with pre-fill data:**

```json
{
  "form": {
    "id": 1,
    "name": "Client Onboarding Form",
    "questions": [
      {
        "id": 1,
        "label": "Full Name",
        "type": "short",
        "required": true,
        "order": 0
      },
      {
        "id": 2,
        "label": "Email",
        "type": "short",
        "required": true,
        "order": 1
      },
      {
        "id": 3,
        "label": "What is your fitness goal?",
        "type": "long",
        "required": false,
        "order": 2
      }
    ]
  },
  "completed": false,
  "preFillData": {
    "1": "John Doe",
    "2": "john@example.com"
  }
}
```

**Key fields:**
- `form`: The check-in form with all questions
- `completed`: Whether the client has already submitted this form
- `preFillData`: Object mapping question IDs to pre-filled values

## Implementation Details

### Backend Logic (`backend/src/routes/mobile-forms.ts`)

1. **Fetch client data** including all profile fields
2. **Create field mapping** of common question labels to client fields
3. **Normalize question labels** by removing special characters and lowercasing
4. **Match questions to client data** using normalized labels
5. **Handle different field types**:
   - Single-select questions → string value
   - Multi-select questions → array value
   - Text questions → string value
   - Number questions → converted to string

### Frontend Logic (`mobile/app/form.tsx`)

1. **Receive pre-fill data** from API response
2. **Initialize answers state** with pre-filled values
3. **Store pre-fill metadata** separately to show badges
4. **Render pre-fill badges** for questions with pre-filled data
5. **Allow editing** - client can change any pre-filled value
6. **Submit final answers** including any edits

## Edge Cases Handled

### 1. **Question Type Mismatch**

**Scenario:** Question expects multi-select but client has single value

**Solution:** Automatically convert single value to array
```javascript
if (question.type === 'multi' && typeof value === 'string') {
  preFillData[question.id] = [value];
}
```

### 2. **Empty Client Fields**

**Scenario:** Client field is null, undefined, or empty string

**Solution:** Skip pre-filling for that question
```javascript
if (value !== null && value !== undefined && value !== '') {
  preFillData[question.id] = value;
}
```

### 3. **Array Fields (e.g., goals, injuries)**

**Scenario:** Client has multiple values in an array

**Solution:** 
- For multi-select questions: Use array directly
- For text questions: Join with commas
```javascript
'injuries': client.injuriesHealthNotes.length > 0 
  ? client.injuriesHealthNotes.join(', ') 
  : null
```

### 4. **No Matching Questions**

**Scenario:** Trainer entered data but no form questions match

**Solution:** Return empty `preFillData` object, form works normally

### 5. **Form Already Completed**

**Scenario:** Client already submitted the form

**Solution:** Don't show form at all, redirect to home screen

## User Experience Flow

### Happy Path

1. ✅ Trainer creates client with full name "John Doe"
2. ✅ Client logs in and sets password
3. ✅ Client is redirected to form
4. ✅ Question "Full Name" is pre-filled with "John Doe"
5. ✅ Blue badge shows "✓ Pre-filled by your trainer"
6. ✅ Client can edit or keep the value
7. ✅ Client completes remaining questions
8. ✅ Client submits form

### Edit Pre-filled Value

1. ✅ Client sees pre-filled name "John Doe"
2. ✅ Client taps on the field
3. ✅ Client edits to "John Smith"
4. ✅ Auto-save updates the value
5. ✅ Client continues to next question
6. ✅ Edited value is submitted

### Mixed Pre-filled and Empty

1. ✅ Questions 1-3 are pre-filled (name, email, phone)
2. ✅ Questions 4-10 are empty (goals, preferences, etc.)
3. ✅ Client sees badges on questions 1-3
4. ✅ Client verifies/edits pre-filled data
5. ✅ Client fills in remaining questions
6. ✅ All data is submitted together

## Testing Checklist

### Backend Testing

- [ ] Create client with full name, email, phone
- [ ] GET `/mobile/forms/main` returns `preFillData` object
- [ ] Pre-fill data includes correct question IDs
- [ ] Pre-fill data includes correct values
- [ ] Empty client fields are excluded from pre-fill data
- [ ] Array fields are properly formatted
- [ ] Field matching works with various question label formats

### Frontend Testing

- [ ] Form loads with pre-filled data
- [ ] Pre-filled fields show blue badge
- [ ] Badge text is correct: "✓ Pre-filled by your trainer (you can edit)"
- [ ] Pre-filled values appear in input fields
- [ ] Client can edit pre-filled values
- [ ] Edited values are saved (auto-save)
- [ ] Form validation works with pre-filled data
- [ ] Form submission includes all values (pre-filled and new)
- [ ] Empty questions don't show badges

### Integration Testing

- [ ] End-to-end: Create client → Login → See pre-filled form
- [ ] Edit pre-filled value → Submit → Verify in dashboard responses
- [ ] Create client with minimal data → Only those fields pre-filled
- [ ] Create client with maximum data → All matching fields pre-filled
- [ ] Multiple clients with different data → Each sees their own data

## Benefits

### For Trainers
- ✅ Faster client onboarding
- ✅ Ensure clients see consistent information
- ✅ Reduce data entry errors
- ✅ Can partially fill forms for clients

### For Clients
- ✅ Less typing required
- ✅ Can verify trainer-entered information
- ✅ Can correct any mistakes
- ✅ Clear indication of pre-filled fields
- ✅ Faster form completion

### For the System
- ✅ Better data consistency
- ✅ Reduced support requests
- ✅ Improved user experience
- ✅ Flexible field matching

## Future Enhancements

### Potential Improvements

1. **Smart Suggestions**: Show suggestions based on partial matches
2. **Confidence Scoring**: Indicate confidence level of field matches
3. **Manual Mapping**: Allow trainers to manually map fields
4. **Partial Pre-fill**: Pre-fill some options in multi-select
5. **Conditional Pre-fill**: Pre-fill based on conditional logic
6. **History Tracking**: Show when/who pre-filled each field
7. **Bulk Pre-fill**: Pre-fill multiple clients at once
8. **Import from CSV**: Pre-fill from imported client data

## Troubleshooting

### Issue: Fields not pre-filling

**Check:**
1. ✅ Trainer entered data when creating client
2. ✅ Question label matches one of the supported patterns
3. ✅ Client field has a non-empty value
4. ✅ Form question type matches data type

**Solution:**
- Add custom field mapping in backend
- Adjust question labels to match patterns
- Verify client data in database

### Issue: Wrong data in pre-filled field

**Check:**
1. ✅ Correct client is logged in
2. ✅ Question label matches intended field
3. ✅ Data type conversion is correct

**Solution:**
- Update field mapping in backend
- Verify client data in database
- Check normalization logic

### Issue: Badge not showing

**Check:**
1. ✅ Pre-fill data exists in API response
2. ✅ Question ID matches pre-fill data key
3. ✅ Mobile app received the data

**Solution:**
- Check API response in network tab
- Verify `preFillData` state in mobile app
- Check conditional rendering logic

---

**Last Updated**: October 21, 2025
**Status**: ✅ Implemented and Working
**Version**: 1.0

