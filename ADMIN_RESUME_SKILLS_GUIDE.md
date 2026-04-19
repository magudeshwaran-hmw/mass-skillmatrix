# 🤖 Admin Resume Extracted Skills - How It Works

## Overview

The "Resume Extracted Skills (Select to Import)" feature allows admins to:
1. Upload an employee's resume (PDF)
2. AI extracts skills from the resume
3. Admin reviews extracted skills
4. Admin selects which skills to import into the employee's profile

---

## How It Works

### **Step 1: Upload Resume**
- Admin uploads employee's PDF resume
- System extracts text from PDF
- AI analyzes text and extracts skills with proficiency levels

### **Step 2: View Extracted Skills**
The admin page shows **two columns**:

**LEFT COLUMN: "MY SKILLS (SELECT TO KEEP)"**
- Skills already in employee's profile
- Checkboxes to keep or remove existing skills
- Shows current proficiency level (L1-L3)

**RIGHT COLUMN: "RESUME EXTRACTED SKILLS (SELECT TO IMPORT)"**
- Skills found in the resume by AI
- Checkboxes to select which skills to import
- Shows extracted proficiency level (L1-L3)

### **Step 3: Select Skills to Import**
- Click checkbox on any skill in the right column to select it
- Selected skills show with ✓ checkmark
- Color coding:
  - 🟡 **Yellow**: Resume-only skill (not in employee's profile yet)
  - 🔵 **Blue**: Duplicate skill (already in employee's profile)

### **Step 4: Save**
- Click "Save & Import Selected" button
- Selected skills are added to employee's profile
- Existing skills are updated if needed

---

## Code Implementation

### **State Management**
```typescript
// Track which extracted skills are selected for import
const [selectedSkills, setSelectedSkills] = useState<Record<string, boolean>>({});

// Example: { "Python": true, "Java": false, "Docker": true }
```

### **Skill Selection Logic**
```typescript
// When user clicks checkbox
onChange={(e) => {
  const checked = e.target.checked;
  setSelectedSkills({ ...selectedSkills, [skill]: checked });
  
  // If importing resume skill, deselect conflicting existing skill
  if (checked && myEntry) {
    setExistingSkillsSelected({ ...existingSkillsSelected, [myEntry.skillId]: false });
  }
}}
```

### **Skill Display**
```typescript
{extractedSkillsList.map(([skill, lvl]) => {
  const isSelected = selectedSkills[skill] || false;
  
  // Check if skill already exists in employee's profile
  const myEntry = effectiveExistingSkills.find((e: any) => {
    const eName = (SKILLS.find(s => s.id === e.skillId)?.name || e.skillId || '').toLowerCase();
    return eName === skill.toLowerCase();
  });
  
  // Color: Blue if duplicate, Yellow if resume-only
  const chipColor = myEntry ? '#3B82F6' : '#F59E0B';
  
  return (
    <label key={skill}>
      <input type="checkbox" checked={isSelected} onChange={...} />
      {isSelected && <span>✓</span>}
      {skill} L{lvl}
    </label>
  );
})}
```

### **Save Selected Skills**
```typescript
// When admin clicks "Save & Import Selected"
Object.entries(extractedSkills).forEach(([skillName, level]) => {
  const lvl = level as number;
  
  // Only save if selected
  if (lvl > 0 && selectedSkills[skillName]) {
    const predefinedSkill = SKILLS.find(sk => 
      sk.name.toLowerCase() === skillName.toLowerCase()
    );
    
    if (predefinedSkill) {
      skillsToSave.push({
        skillId: predefinedSkill.id,
        selfRating: Math.min(3, Math.max(0, lvl)) as ProficiencyLevel,
        managerRating: null,
        validated: false,
      });
    }
  }
});
```

---

## Features

### **Smart Conflict Detection**
- If a skill exists in both "My Skills" and "Resume Extracted Skills"
- Shown in **BLUE** (duplicate)
- Selecting resume version automatically deselects existing version
- Prevents duplicate entries

### **Proficiency Levels**
- L1: Beginner
- L2: Intermediate
- L3: Advanced
- AI extracts level based on resume context

### **Bulk Actions**
- "Select All" button: Selects all extracted skills
- "Deselect All" button: Deselects all extracted skills

### **Visual Feedback**
- ✓ Checkmark shows selected skills
- Color changes on selection
- Border highlights selected items

---

## Example Workflow

### **Scenario: Admin uploads John's resume**

**Resume contains:**
- Python (L3)
- Java (L2)
- Docker (L2)
- Kubernetes (L1)

**John's existing skills:**
- Python (L2)
- JavaScript (L1)

**Admin sees:**

**LEFT (My Skills):**
- ☑ Python L2
- ☑ JavaScript L1

**RIGHT (Resume Extracted):**
- ☐ Python L3 (🔵 Blue - duplicate)
- ☐ Java L2 (🟡 Yellow - new)
- ☐ Docker L2 (🟡 Yellow - new)
- ☐ Kubernetes L1 (🟡 Yellow - new)

**Admin selects:**
- ☑ Python L3 (upgrade from L2)
- ☑ Java L2 (new skill)
- ☑ Docker L2 (new skill)
- ☐ Kubernetes L1 (skip this one)

**After saving:**
- Python: L3 (updated)
- Java: L2 (added)
- Docker: L2 (added)
- JavaScript: L1 (kept)
- Kubernetes: Not added

---

## UI Components

### **Skill Chip**
```
┌─────────────────────┐
│ ✓ Python L3         │  ← Selected (blue border)
└─────────────────────┘

┌─────────────────────┐
│   Java L2           │  ← Not selected (light border)
└─────────────────────┘
```

### **Color Coding**
- 🔵 **Blue**: Skill exists in both places (duplicate)
- 🟡 **Yellow**: Skill only in resume (new)
- ✓ **Checkmark**: Skill selected for import

---

## Benefits

✅ **Admin Control**: Choose which skills to import
✅ **Conflict Resolution**: Automatically handles duplicates
✅ **Proficiency Updates**: Can upgrade skill levels from resume
✅ **Selective Import**: Don't import irrelevant skills
✅ **Visual Clarity**: Color coding shows skill status
✅ **Bulk Operations**: Select/deselect all at once

---

## Related Features

- **Resume Upload**: PDF extraction and AI analysis
- **Skill Matrix**: View all employee skills
- **Skill Ratings**: Self-rating and manager-rating
- **Skill Validation**: Manager can validate skills

---

## Technical Details

**File:** `src/pages/AdminResumeUploadPage.tsx`

**Key Functions:**
- `extractTextFromPDF()` - Extract text from PDF
- `extractEverythingFromResume()` - AI skill extraction
- `setSelectedSkills()` - Track selected skills
- `onConfirmAndSave()` - Save selected skills to database

**State Variables:**
- `selectedSkills` - Track which extracted skills are selected
- `extractedData` - AI extracted data from resume
- `extractedSkillsList` - List of extracted skills with levels

---

## Tips for Admins

1. **Review Carefully**: Check if extracted skills are accurate
2. **Update Levels**: If resume shows higher proficiency, import it
3. **Skip Irrelevant**: Don't import skills that don't match job role
4. **Bulk Select**: Use "Select All" for quick import of all skills
5. **Conflict Resolution**: Blue skills show duplicates - choose which version to keep

---

**Status:** ✅ Working perfectly!

This feature makes it easy for admins to quickly populate employee skill profiles from resumes while maintaining control over what gets imported.
