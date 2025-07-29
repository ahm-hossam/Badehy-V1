import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  
  // Mock client data based on the actual form structure
  const mockClient = {
    id: parseInt(clientId),
    fullName: "Ahmed Hossam",
    phone: "+201234567890",
    email: "ahmed.hossam@example.com",
    gender: "Male",
    age: 28,
    source: "Facebook Ads",
    level: "Intermediate",
    registrationDate: "2025-01-15T00:00:00.000Z",
    goal: "Fat Loss",
    workoutPlace: "Gym",
    height: 175,
    weight: 80,
    preferredTrainingDays: "Monday, Wednesday, Friday",
    preferredTrainingTime: "Evening (5-9 PM)",
    equipmentAvailability: "Gym Access, Dumbbells, Resistance Bands",
    favoriteTrainingStyle: "Strength, HIIT",
    weakAreas: "Core, Lower Back",
    nutritionGoal: "Fat Loss",
    dietPreference: "Regular",
    mealCount: 3,
    foodAllergies: "None",
    dislikedIngredients: "None",
    currentNutritionPlan: "Following trainer's meal plan",
    injuriesHealthNotes: ["Knee Pain", "Lower Back Pain"],
    goals: ["Fat Loss", "Muscle Gain"],
    profileCompletion: "Completed",
    selectedFormId: "1", // ID of the form used when creating this client
    answers: {
      "1": "Ahmed Hossam", // Full Name
      "2": "ahmed.hossam@example.com", // Email
      "3": "+201234567890", // Mobile Number
      "4": "Male", // Gender
      "5": 28, // Age
      "6": "Facebook Ads", // Source
      "7": "Fat Loss", // Goal
      "8": "Gym", // Workout Place
      "9": 175, // Height
      "10": 80, // Weight
      "11": ["Monday", "Wednesday", "Friday"], // Preferred Training Days
      "12": "Evening (5-9 PM)", // Preferred Training Time
      "13": ["Gym Access", "Dumbbells", "Resistance Bands"], // Equipment Availability
      "14": ["Strength", "HIIT"], // Favorite Training Style
      "15": ["Core", "Lower Back"], // Weak Areas
      "16": "Fat Loss", // Nutrition Goal
      "17": "Regular", // Diet Preference
      "18": 3, // Meal Count
      "19": "None", // Food Allergies
      "20": "None", // Disliked Ingredients
      "21": "Following trainer's meal plan" // Current Nutrition Plan
    },
    notes: [
      {
        id: "1",
        content: "Client is very motivated and follows the program well. Shows good progress in strength training.",
        createdAt: "2025-01-15T10:00:00.000Z",
        updatedAt: "2025-01-15T10:00:00.000Z"
      },
      {
        id: "2", 
        content: "Discussed nutrition plan today. Client wants to focus on protein intake for muscle building.",
        createdAt: "2025-01-20T14:30:00.000Z",
        updatedAt: "2025-01-20T14:30:00.000Z"
      }
    ],
    subscriptions: [
      {
        id: 1,
        paymentStatus: 'PAID',
        priceAfterDisc: 299.99,
        startDate: '2025-07-10T00:00:00.000Z',
        endDate: '2025-08-10T00:00:00.000Z',
        durationValue: 1,
        durationUnit: 'month',
        paymentMethod: 'Cash',
        priceBeforeDisc: 350.00,
        discountApplied: true,
        discountType: 'percentage',
        discountValue: 15,
        installments: [
          {
            id: 1,
            amount: 299.99,
            status: 'PAID',
            paidDate: '2025-07-10T00:00:00.000Z',
            remaining: 0,
            nextInstallment: null,
            transactionImages: [
              {
                id: 1,
                filename: 'payment1.jpg',
                originalName: 'payment_receipt.jpg',
                uploadedAt: '2025-07-10T10:00:00Z'
              }
            ]
          }
        ]
      }
    ]
  };

  return NextResponse.json(mockClient);
} 