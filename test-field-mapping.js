// Test the field mapping logic with actual data from client 200
const testData = {
  submissions: [
    {
      form: {
        questions: [
          { id: 125, label: "Full Name" },
          { id: 126, label: "Email" },
          { id: 127, label: "Phone" },
          { id: 128, label: "Gender" },
          { id: 129, label: "Age" }
        ]
      },
      answers: {
        "125": "t",
        "126": "t@test.com", 
        "127": "01234567",
        "128": "Male",
        "129": "30"
      }
    }
  ]
};

const normalize = (s) => s.toLowerCase().replace(/[^a-z]/g, '');

const getValue = (field) => {
  let value = undefined;
  
  // If client field is empty, try to find it in any submission
  if (value === undefined || value === null || value === '') {
    // Process all submissions to find the best data for this field
    for (const submission of testData.submissions || []) {
      const answers = submission.answers && typeof submission.answers === 'object' ? submission.answers : {};
      const formQuestions = submission.form?.questions || [];
      
      // Try to find the answer by matching field name to question label
      for (const q of formQuestions) {
        const answer = answers[String(q.id)];
        
        // Skip if no answer
        if (!answer || answer === '') continue;
        
        // Direct field mapping based on question label
        const questionLabel = q.label.toLowerCase();
        
        // More robust field mapping
        if (field === 'email' && (questionLabel.includes('email') || questionLabel.includes('e-mail'))) {
          value = answer;
          break;
        }
        
        if (field === 'gender' && (questionLabel.includes('gender') || questionLabel.includes('sex'))) {
          value = answer;
          break;
        }
        
        if (field === 'age' && (questionLabel.includes('age') || questionLabel.includes('years'))) {
          value = answer;
          break;
        }
        
        if (field === 'source' && (questionLabel.includes('source') || questionLabel.includes('hear') || questionLabel.includes('referral') || questionLabel === 'source')) {
          value = answer;
          break;
        }
        
        if (field === 'phone' && (questionLabel.includes('phone') || questionLabel.includes('mobile') || questionLabel.includes('telephone'))) {
          value = answer;
          break;
        }
        
        if (field === 'fullName' && (questionLabel.includes('name') || questionLabel.includes('full'))) {
          value = answer;
          break;
        }
      }
      
      // If we still don't have a value, try fallback logic for specific fields
      if (!value && field === 'fullName') {
        // Look for any answer that looks like a name
        for (const q of formQuestions) {
          const answer = answers[String(q.id)];
          if (answer && typeof answer === 'string' && answer.length > 1) {
            // Check if this looks like a name (not email, not phone, not gender, etc.)
            if (!answer.includes('@') && !answer.match(/^\d+$/) && !['male', 'female', 'other'].includes(answer.toLowerCase())) {
              value = answer;
              break;
            }
          }
        }
      }
      
      if (!value && field === 'email') {
        // Look for any answer that looks like an email
        for (const q of formQuestions) {
          const answer = answers[String(q.id)];
          if (answer && typeof answer === 'string' && answer.includes('@')) {
            value = answer;
            break;
          }
        }
      }
      
      if (!value && field === 'phone') {
        // Look for any answer that looks like a phone number
        for (const q of formQuestions) {
          const answer = answers[String(q.id)];
          if (answer && typeof answer === 'string' && (answer.match(/^\d+$/) || answer.includes('+'))) {
            value = answer;
            break;
          }
        }
      }
      
      if (!value && field === 'gender') {
        // Look for any answer that looks like a gender
        for (const q of formQuestions) {
          const answer = answers[String(q.id)];
          if (answer && typeof answer === 'string' && ['male', 'female', 'other'].includes(answer.toLowerCase())) {
            value = answer;
            break;
          }
        }
      }
      
      if (!value && field === 'age') {
        // Look for any answer that looks like an age
        for (const q of formQuestions) {
          const answer = answers[String(q.id)];
          if (answer && !isNaN(Number(answer)) && Number(answer) > 0 && Number(answer) < 120) {
            value = answer;
            break;
          }
        }
      }
      
      // If we found a value, break out of submission loop
      if (value !== undefined && value !== null && value !== '') {
        break;
      }
    }
  }
  return value;
};

// Test the logic
console.log('Testing field mapping logic:');
console.log('Full Name:', getValue('fullName'));
console.log('Email:', getValue('email'));
console.log('Phone:', getValue('phone'));
console.log('Gender:', getValue('gender'));
console.log('Age:', getValue('age'));
console.log('Source:', getValue('source')); 