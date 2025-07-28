import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    
    // For now, return mock data until backend is implemented
    // This will be replaced with actual database query
    const mockClient = {
      id: parseInt(clientId),
      fullName: "John Doe",
      phone: "+1234567890",
      email: "john.doe@example.com",
      gender: "Male",
      age: 28,
      source: "Website",
      level: "Intermediate",
      registrationDate: "2024-01-15T00:00:00.000Z",
      goal: "Build muscle and improve strength",
      workoutPlace: "Home gym",
      height: 175,
      weight: 70,
      preferredTrainingDays: "Monday, Wednesday, Friday",
      preferredTrainingTime: "Morning",
      equipmentAvailability: "Full gym equipment",
      favoriteTrainingStyle: "Strength training",
      weakAreas: "Core and flexibility",
      nutritionGoal: "Muscle building",
      dietPreference: "High protein",
      mealCount: 5,
      foodAllergies: "None",
      dislikedIngredients: "None",
      currentNutritionPlan: "High protein diet with supplements",
      injuriesHealthNotes: ["Minor back pain", "Recovered from knee injury"],
      goals: ["Build muscle", "Improve strength", "Lose fat"],
      profileCompletion: "Completed",
      subscriptions: [
        {
          id: 1,
          paymentStatus: "PAID",
          priceAfterDisc: 299.99,
          installments: [
            {
              id: 1,
              amount: 149.99,
              status: "PAID",
              transactionImages: [
                {
                  id: 1,
                  filename: "payment1.jpg",
                  originalName: "payment_proof.jpg",
                  uploadedAt: "2024-01-15T00:00:00.000Z"
                }
              ]
            },
            {
              id: 2,
              amount: 150.00,
              status: "PAID",
              transactionImages: [
                {
                  id: 2,
                  filename: "payment2.jpg",
                  originalName: "payment_proof2.jpg",
                  uploadedAt: "2024-02-15T00:00:00.000Z"
                }
              ]
            }
          ]
        }
      ]
    };

    return NextResponse.json(mockClient);
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client details' },
      { status: 500 }
    );
  }
} 