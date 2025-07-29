import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const formId = params.id;
  
  // Mock form data that matches the client answers
  const mockForm = {
    id: formId,
    name: "New Client Registration Form",
    questions: [
      {
        id: "1",
        label: "Full Name",
        type: "text",
        required: true
      },
      {
        id: "2", 
        label: "Email Address",
        type: "email",
        required: true
      },
      {
        id: "3",
        label: "Mobile Number", 
        type: "tel",
        required: true
      },
      {
        id: "4",
        label: "Gender",
        type: "select",
        required: true,
        options: ["Male", "Female", "Other"]
      },
      {
        id: "5",
        label: "Age",
        type: "number",
        required: true
      },
      {
        id: "6",
        label: "How did you hear about us?",
        type: "select",
        required: true,
        options: ["Facebook Ads", "Instagram", "Google Search", "Friend Referral", "Other"]
      },
      {
        id: "7",
        label: "What is your primary fitness goal?",
        type: "select",
        required: true,
        options: ["Fat Loss", "Muscle Gain", "General Fitness", "Sports Performance", "Rehabilitation"]
      },
      {
        id: "8",
        label: "Where do you prefer to work out?",
        type: "select",
        required: true,
        options: ["Gym", "Home", "Outdoors", "Mixed"]
      },
      {
        id: "9",
        label: "Height (cm)",
        type: "number",
        required: true
      },
      {
        id: "10",
        label: "Weight (kg)",
        type: "number",
        required: true
      },
      {
        id: "11",
        label: "Preferred Training Days",
        type: "multiselect",
        required: true,
        options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      },
      {
        id: "12",
        label: "Preferred Training Time",
        type: "select",
        required: true,
        options: ["Morning (6-10 AM)", "Afternoon (12-4 PM)", "Evening (5-9 PM)", "Late Night (9-11 PM)"]
      },
      {
        id: "13",
        label: "What equipment do you have access to?",
        type: "multiselect",
        required: true,
        options: ["Gym Access", "Dumbbells", "Resistance Bands", "Pull-up Bar", "Treadmill", "None"]
      },
      {
        id: "14",
        label: "What training styles do you enjoy?",
        type: "multiselect",
        required: true,
        options: ["Strength", "Cardio", "HIIT", "Yoga", "Pilates", "CrossFit", "Bodyweight"]
      },
      {
        id: "15",
        label: "What are your weak areas?",
        type: "multiselect",
        required: false,
        options: ["Core", "Upper Body", "Lower Body", "Cardiovascular", "Flexibility", "Balance", "Lower Back"]
      },
      {
        id: "16",
        label: "What is your nutrition goal?",
        type: "select",
        required: true,
        options: ["Fat Loss", "Muscle Gain", "Maintenance", "Performance", "Health Improvement"]
      },
      {
        id: "17",
        label: "What is your diet preference?",
        type: "select",
        required: true,
        options: ["Regular", "Vegetarian", "Vegan", "Keto", "Paleo", "Mediterranean"]
      },
      {
        id: "18",
        label: "How many meals do you eat per day?",
        type: "number",
        required: true
      },
      {
        id: "19",
        label: "Do you have any food allergies?",
        type: "text",
        required: false
      },
      {
        id: "20",
        label: "Are there any ingredients you dislike?",
        type: "text",
        required: false
      },
      {
        id: "21",
        label: "What is your current nutrition plan?",
        type: "text",
        required: false
      }
    ]
  };

  return NextResponse.json(mockForm);
} 