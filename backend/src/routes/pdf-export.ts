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

export default router;
