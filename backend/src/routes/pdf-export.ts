import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
// import puppeteer from 'puppeteer'; // Temporarily commented out

const prisma = new PrismaClient();
const router = Router();

// POST /api/programs/:id/export-pdf - Export program as PDF
router.post('/:id/export-pdf', async (req: Request, res: Response) => {
  try {
    const programId = parseInt(req.params.id);
    
    // Fetch program with all related data
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                exercises: {
                  include: {
                    exercise: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Generate HTML content for the PDF
    const htmlContent = generateProgramHTML(program);

    // Generate PDF using a simple approach without puppeteer
    // For now, we'll return the HTML content with proper PDF headers
    // This will open in browser and can be printed to PDF
    
    // Set response headers for HTML content that can be printed to PDF
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${program.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_workout_program.html"`);
    
    res.send(htmlContent);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Helper function to generate HTML content
function generateProgramHTML(program: any): string {
  const currentDate = new Date().toLocaleDateString();
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${program.name} - Workout Program</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #fff;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 0;
          text-align: center;
          margin-bottom: 40px;
        }
        
        .header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .header .subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
        }
        
        .program-info {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 10px;
          margin-bottom: 40px;
          border-left: 5px solid #667eea;
        }
        
        .program-info h2 {
          color: #667eea;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }
        
        .program-info p {
          font-size: 1.1rem;
          line-height: 1.8;
        }
        
        .week-section {
          margin-bottom: 50px;
          page-break-inside: avoid;
        }
        
        .week-header {
          background: #667eea;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          font-size: 1.3rem;
          font-weight: 600;
        }
        
        .day-section {
          border: 1px solid #e9ecef;
          border-top: none;
          margin-bottom: 20px;
        }
        
        .day-header {
          background: #f8f9fa;
          padding: 15px 20px;
          font-weight: 600;
          font-size: 1.1rem;
          color: #495057;
          border-bottom: 1px solid #e9ecef;
        }
        
        .exercises-list {
          padding: 20px;
        }
        
        .exercise-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid #f1f3f4;
        }
        
        .exercise-item:last-child {
          border-bottom: none;
        }
        
        .exercise-name {
          font-weight: 600;
          font-size: 1.1rem;
          color: #2c3e50;
          flex: 1;
        }
        
        .exercise-details {
          display: flex;
          gap: 30px;
          font-size: 0.95rem;
          color: #6c757d;
        }
        
        .detail-item {
          text-align: center;
          min-width: 60px;
        }
        
        .detail-label {
          font-size: 0.8rem;
          color: #adb5bd;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        
        .detail-value {
          font-weight: 600;
          color: #495057;
        }
        
        .rest-day {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          color: #856404;
          font-weight: 600;
          font-size: 1.1rem;
        }
        
        .footer {
          margin-top: 50px;
          padding: 20px;
          text-align: center;
          color: #6c757d;
          font-size: 0.9rem;
          border-top: 1px solid #e9ecef;
        }
        
        .badge {
          display: inline-block;
          background: #28a745;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-left: 10px;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .header {
            background: #667eea !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            page-break-inside: avoid;
          }
          
          .week-header {
            background: #667eea !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            page-break-inside: avoid;
          }
          
          .week-section {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          
          .day-section {
            page-break-inside: avoid;
            margin-bottom: 15px;
          }
          
          .exercise-item {
            page-break-inside: avoid;
            padding: 8px 0;
          }
          
          .footer {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${program.name}</h1>
        <div class="subtitle">Professional Workout Program</div>
      </div>
      
      <div class="program-info">
        <h2>Program Overview</h2>
        <p>${program.description || 'A comprehensive workout program designed to help you achieve your fitness goals.'}</p>
        <p><strong>Duration:</strong> ${program.weeks.length} weeks | <strong>Total Exercises:</strong> ${program.weeks.reduce((total: number, week: any) => total + week.days.reduce((dayTotal: number, day: any) => dayTotal + day.exercises.length, 0), 0)} exercises</p>
      </div>
      
      ${program.weeks.map((week: any, weekIndex: number) => `
        <div class="week-section">
          <div class="week-header">
            Week ${weekIndex + 1} - ${week.name}
          </div>
          
          ${week.days.map((day: any, dayIndex: number) => `
            <div class="day-section">
              <div class="day-header">
                ${day.name}
                ${day.dayType === 'off' ? '<span class="badge">Rest Day</span>' : ''}
              </div>
              
              ${day.dayType === 'off' ? `
                <div class="rest-day">
                  🧘‍♂️ Rest and Recovery Day
                </div>
              ` : `
                <div class="exercises-list">
                  ${day.exercises.map((exercise: any) => `
                    <div class="exercise-item">
                      <div class="exercise-name">${exercise.exercise.name}</div>
                      <div class="exercise-details">
                        <div class="detail-item">
                          <div class="detail-label">Sets</div>
                          <div class="detail-value">${exercise.sets ? (Array.isArray(exercise.sets) ? exercise.sets.length : exercise.sets) : '1'}</div>
                        </div>
                        <div class="detail-item">
                          <div class="detail-label">Reps</div>
                          <div class="detail-value">${exercise.sets && Array.isArray(exercise.sets) ? exercise.sets.map((set: any) => set.reps || '?').join(', ') : (exercise.duration || '8-12')}</div>
                        </div>
                        <div class="detail-item">
                          <div class="detail-label">Rest</div>
                          <div class="detail-value">${exercise.sets && Array.isArray(exercise.sets) ? exercise.sets.map((set: any) => `${set.rest || '60'}s`).join(', ') : '60s'}</div>
                        </div>
                        <div class="detail-item">
                          <div class="detail-label">Tempo</div>
                          <div class="detail-value">${exercise.sets && Array.isArray(exercise.sets) ? exercise.sets.map((set: any) => set.tempo || '2-1-2').join(', ') : '2-1-2'}</div>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          `).join('')}
        </div>
      `).join('')}
      
      <div class="footer">
        <p>Generated on ${currentDate} | TRAINZY Workout Program Builder</p>
        <p>For personal use only. Professional training programs.</p>
      </div>
    </body>
    </html>
  `;
}

// POST /api/nutrition-programs/:id/export-pdf - Export nutrition program as PDF
router.post('/nutrition-programs/:id/export-pdf', async (req: Request, res: Response) => {
  try {
    const programId = parseInt(req.params.id);
    
    console.log('Exporting nutrition program PDF for ID:', programId);
    
    // Fetch nutrition program with all related data
    const program = await prisma.nutritionProgram.findUnique({
      where: { id: programId },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                meals: {
                  include: {
                    meal: {
                      include: {
                        mealIngredients: {
                          include: {
                            ingredient: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log('Found nutrition program:', program ? program.name : 'null');

    if (!program) {
      return res.status(404).json({ error: 'Nutrition program not found' });
    }

    // Generate HTML content for the PDF
    const htmlContent = generateNutritionProgramHTML(program);

    // Set response headers for HTML content that can be printed to PDF
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${program.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_nutrition_program.html"`);
    
    res.send(htmlContent);

  } catch (error) {
    console.error('Error generating nutrition program PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Helper function to generate HTML content for nutrition programs
function generateNutritionProgramHTML(program: any): string {
  const currentDate = new Date().toLocaleDateString();
  
  // Calculate program totals
  let totalMeals = 0;
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;

  program.weeks.forEach((week: any) => {
    week.days.forEach((day: any) => {
      day.meals.forEach((programMeal: any) => {
        totalMeals++;
        if (programMeal.meal && !programMeal.isCheatMeal) {
          const quantity = programMeal.customQuantity || 1;
          totalCalories += (programMeal.meal.totalCalories || 0) * quantity;
          totalProtein += (programMeal.meal.totalProtein || 0) * quantity;
          totalCarbs += (programMeal.meal.totalCarbs || 0) * quantity;
          totalFats += (programMeal.meal.totalFats || 0) * quantity;
        }
      });
    });
  });
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${program.name} - Nutrition Program</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #fff;
        }
        
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 40px 0;
          text-align: center;
          margin-bottom: 40px;
        }
        
        .header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .header .subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
        }
        
        .program-info {
          background: #f0fdf4;
          padding: 30px;
          border-radius: 10px;
          margin-bottom: 40px;
          border-left: 5px solid #10b981;
        }
        
        .program-info h2 {
          color: #059669;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }
        
        .program-info p {
          font-size: 1.1rem;
          line-height: 1.8;
          margin-bottom: 10px;
        }
        
        .program-goals {
          background: #fef3c7;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #f59e0b;
        }
        
        .program-goals h3 {
          color: #92400e;
          margin-bottom: 10px;
          font-size: 1.2rem;
        }
        
        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        
        .goal-item {
          text-align: center;
          background: white;
          padding: 15px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .goal-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: #059669;
        }
        
        .goal-label {
          font-size: 0.9rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .week-section {
          margin-bottom: 50px;
          page-break-inside: avoid;
        }
        
        .week-header {
          background: #10b981;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          font-size: 1.3rem;
          font-weight: 600;
        }
        
        .day-section {
          border: 1px solid #e5e7eb;
          border-top: none;
          margin-bottom: 20px;
        }
        
        .day-header {
          background: #f9fafb;
          padding: 15px 20px;
          font-weight: 600;
          font-size: 1.1rem;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .day-nutrition {
          display: flex;
          gap: 20px;
          font-size: 0.9rem;
          color: #6b7280;
        }
        
        .meals-list {
          padding: 20px;
        }
        
        .meal-item {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #f3f4f6;
          border-radius: 8px;
          background: #fefefe;
        }
        
        .meal-item:last-child {
          margin-bottom: 0;
        }
        
        .meal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .meal-name {
          font-weight: 600;
          font-size: 1.2rem;
          color: #1f2937;
        }
        
        .meal-type {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .cheat-meal {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          color: #92400e;
        }
        
        .cheat-meal .meal-type {
          background: #f59e0b;
          color: white;
        }
        
        .meal-nutrition {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
          font-size: 0.9rem;
        }
        
        .nutrition-item {
          text-align: center;
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 6px;
          min-width: 70px;
        }
        
        .nutrition-value {
          font-weight: 600;
          color: #059669;
          display: block;
        }
        
        .nutrition-label {
          color: #6b7280;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .ingredients-list {
          margin-top: 15px;
        }
        
        .ingredients-title {
          font-weight: 600;
          color: #374151;
          margin-bottom: 10px;
          font-size: 1rem;
        }
        
        .ingredient-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f9fafb;
        }
        
        .ingredient-item:last-child {
          border-bottom: none;
        }
        
        .ingredient-name {
          font-weight: 500;
          color: #374151;
        }
        
        .ingredient-amount {
          color: #6b7280;
          font-size: 0.9rem;
        }
        
        .cheat-description {
          color: #92400e;
          font-style: italic;
          margin-top: 10px;
          padding: 15px;
          background: #fffbeb;
          border-radius: 6px;
          border-left: 3px solid #f59e0b;
        }
        
        .footer {
          margin-top: 50px;
          padding: 20px;
          text-align: center;
          color: #6b7280;
          font-size: 0.9rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-left: 10px;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .header {
            background: #10b981 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            page-break-inside: avoid;
          }
          
          .week-header {
            background: #10b981 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            page-break-inside: avoid;
          }
          
          .week-section {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          
          .day-section {
            page-break-inside: avoid;
            margin-bottom: 15px;
          }
          
          .meal-item {
            page-break-inside: avoid;
            margin-bottom: 15px;
          }
          
          .footer {
            page-break-inside: avoid;
          }
          
          .program-goals {
            background: #fef3c7 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .cheat-meal {
            background: #fef3c7 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${program.name}</h1>
        <div class="subtitle">Professional Nutrition Program</div>
      </div>
      
      <div class="program-info">
        <h2>Program Overview</h2>
        <p>${program.description || 'A comprehensive nutrition program designed to help you achieve your health and fitness goals.'}</p>
        <p><strong>Duration:</strong> ${program.weeks.length} weeks | <strong>Total Meals:</strong> ${totalMeals} meals</p>
        
        ${program.calorieGoal || program.proteinGoal || program.carbGoal || program.fatGoal ? `
          <div class="program-goals">
            <h3>Daily Nutrition Goals</h3>
            <div class="goals-grid">
              ${program.calorieGoal ? `
                <div class="goal-item">
                  <div class="goal-value">${program.calorieGoal}</div>
                  <div class="goal-label">Calories</div>
                </div>
              ` : ''}
              ${program.proteinGoal ? `
                <div class="goal-item">
                  <div class="goal-value">${program.proteinGoal}g</div>
                  <div class="goal-label">Protein</div>
                </div>
              ` : ''}
              ${program.carbGoal ? `
                <div class="goal-item">
                  <div class="goal-value">${program.carbGoal}g</div>
                  <div class="goal-label">Carbs</div>
                </div>
              ` : ''}
              ${program.fatGoal ? `
                <div class="goal-item">
                  <div class="goal-value">${program.fatGoal}g</div>
                  <div class="goal-label">Fats</div>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
      </div>
      
      ${program.weeks.map((week: any, weekIndex: number) => `
        <div class="week-section">
          <div class="week-header">
            Week ${weekIndex + 1} - ${week.name || `Week ${weekIndex + 1}`}
          </div>
          
          ${week.days.map((day: any, dayIndex: number) => {
            // Calculate day nutrition totals
            let dayCalories = 0;
            let dayProtein = 0;
            let dayCarbs = 0;
            let dayFats = 0;
            
            day.meals.forEach((programMeal: any) => {
              if (programMeal.meal && !programMeal.isCheatMeal) {
                const quantity = programMeal.customQuantity || 1;
                dayCalories += (programMeal.meal.totalCalories || 0) * quantity;
                dayProtein += (programMeal.meal.totalProtein || 0) * quantity;
                dayCarbs += (programMeal.meal.totalCarbs || 0) * quantity;
                dayFats += (programMeal.meal.totalFats || 0) * quantity;
              }
            });
            
            return `
              <div class="day-section">
                <div class="day-header">
                  <span>${day.name || `Day ${dayIndex + 1}`}</span>
                  <div class="day-nutrition">
                    <span>${Math.round(dayCalories)} cal</span>
                    <span>${Math.round(dayProtein)}g protein</span>
                    <span>${Math.round(dayCarbs)}g carbs</span>
                    <span>${Math.round(dayFats)}g fats</span>
                  </div>
                </div>
                
                <div class="meals-list">
                  ${day.meals.map((programMeal: any) => {
                    if (programMeal.isCheatMeal) {
                      return `
                        <div class="meal-item cheat-meal">
                          <div class="meal-header">
                            <div class="meal-name">Cheat Meal</div>
                            <div class="meal-type">Cheat</div>
                          </div>
                          ${programMeal.cheatDescription ? `
                            <div class="cheat-description">
                              ${programMeal.cheatDescription}
                            </div>
                          ` : ''}
                        </div>
                      `;
                    }
                    
                    const meal = programMeal.meal;
                    const quantity = programMeal.customQuantity || 1;
                    
                    if (!meal) return '';
                    
                    return `
                      <div class="meal-item">
                        <div class="meal-header">
                          <div class="meal-name">${meal.name}</div>
                          <div class="meal-type">${programMeal.mealType || 'Meal'}</div>
                        </div>
                        
                        <div class="meal-nutrition">
                          <div class="nutrition-item">
                            <span class="nutrition-value">${Math.round((meal.totalCalories || 0) * quantity)}</span>
                            <span class="nutrition-label">Calories</span>
                          </div>
                          <div class="nutrition-item">
                            <span class="nutrition-value">${Math.round((meal.totalProtein || 0) * quantity)}g</span>
                            <span class="nutrition-label">Protein</span>
                          </div>
                          <div class="nutrition-item">
                            <span class="nutrition-value">${Math.round((meal.totalCarbs || 0) * quantity)}g</span>
                            <span class="nutrition-label">Carbs</span>
                          </div>
                          <div class="nutrition-item">
                            <span class="nutrition-value">${Math.round((meal.totalFats || 0) * quantity)}g</span>
                            <span class="nutrition-label">Fats</span>
                          </div>
                        </div>
                        
                        ${meal.mealIngredients && meal.mealIngredients.length > 0 ? `
                          <div class="ingredients-list">
                            <div class="ingredients-title">Ingredients:</div>
                            ${meal.mealIngredients.map((mealIngredient: any) => `
                              <div class="ingredient-item">
                                <span class="ingredient-name">${mealIngredient.ingredient.name}</span>
                                <span class="ingredient-amount">${mealIngredient.quantity * quantity} ${mealIngredient.ingredient.unitType}</span>
                              </div>
                            `).join('')}
                          </div>
                        ` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `).join('')}
      
      <div class="footer">
        <p>Generated on ${currentDate} | TRAINZY Nutrition Program Builder</p>
        <p>For personal use only. Professional nutrition programs.</p>
      </div>
    </body>
    </html>
  `;
}

export default router;
