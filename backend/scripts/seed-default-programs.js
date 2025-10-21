const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Default exercises with REAL YouTube Shorts videos (mobile-optimized)
const defaultExercises = [
  // Chest
  { name: 'Barbell Bench Press', category: 'Chest', videoUrl: 'https://www.youtube.com/shorts/8iPEnov-lmU' },
  { name: 'Incline Dumbbell Press', category: 'Chest', videoUrl: 'https://www.youtube.com/shorts/eozdVDA78K0' },
  { name: 'Dumbbell Flyes', category: 'Chest', videoUrl: 'https://www.youtube.com/shorts/IODxDxX7oi4' },
  { name: 'Push-ups', category: 'Chest', videoUrl: 'https://www.youtube.com/shorts/rT7DgCr-3pg' },
  
  // Back
  { name: 'Pull-ups', category: 'Back', videoUrl: 'https://www.youtube.com/shorts/eGo4IYlbE5g' },
  { name: 'Barbell Rows', category: 'Back', videoUrl: 'https://www.youtube.com/shorts/paCfxQZqZ0k' },
  { name: 'Lat Pulldown', category: 'Back', videoUrl: 'https://www.youtube.com/shorts/CAwf7n6Luuc' },
  { name: 'Seated Cable Rows', category: 'Back', videoUrl: 'https://www.youtube.com/shorts/GZbfZ033f74' },
  
  // Shoulders
  { name: 'Overhead Press', category: 'Shoulders', videoUrl: 'https://www.youtube.com/shorts/QAy8dM2p4BI' },
  { name: 'Lateral Raises', category: 'Shoulders', videoUrl: 'https://www.youtube.com/shorts/3VcKXNN1LtA' },
  { name: 'Rear Delt Flyes', category: 'Shoulders', videoUrl: 'https://www.youtube.com/shorts/rep-qVOkqkI' },
  { name: 'Face Pulls', category: 'Shoulders', videoUrl: 'https://www.youtube.com/shorts/rep-qVOkqkI' },
  
  // Arms
  { name: 'Barbell Bicep Curls', category: 'Arms', videoUrl: 'https://www.youtube.com/shorts/ykJmrZ5v0Oo' },
  { name: 'Hammer Curls', category: 'Arms', videoUrl: 'https://www.youtube.com/shorts/TwD-YGVP4Bk' },
  { name: 'Tricep Dips', category: 'Arms', videoUrl: 'https://www.youtube.com/shorts/6kALZikXxLc' },
  { name: 'Close-Grip Bench Press', category: 'Arms', videoUrl: 'https://www.youtube.com/shorts/nEF0bv2FW94' },
  
  // Legs
  { name: 'Squats', category: 'Legs', videoUrl: 'https://www.youtube.com/shorts/YaXPRqUwItQ' },
  { name: 'Romanian Deadlifts', category: 'Legs', videoUrl: 'https://www.youtube.com/shorts/op9kVnSso6Q' },
  { name: 'Bulgarian Split Squats', category: 'Legs', videoUrl: 'https://www.youtube.com/shorts/2C-uNgKwPLE' },
  { name: 'Leg Press', category: 'Legs', videoUrl: 'https://www.youtube.com/shorts/IZxyjW7MPJQ' },
  { name: 'Walking Lunges', category: 'Legs', videoUrl: 'https://www.youtube.com/shorts/L8fvypPrzzs' },
  { name: 'Calf Raises', category: 'Legs', videoUrl: 'https://www.youtube.com/shorts/3VcKXNN1LtA' },
  
  // Core
  { name: 'Plank', category: 'Core', videoUrl: 'https://www.youtube.com/shorts/pSHjTRCQxIw' },
  { name: 'Russian Twists', category: 'Core', videoUrl: 'https://www.youtube.com/shorts/wkD8rjkodUI' },
  { name: 'Mountain Climbers', category: 'Core', videoUrl: 'https://www.youtube.com/shorts/nmwgirgXLYM' },
  { name: 'Dead Bug', category: 'Core', videoUrl: 'https://www.youtube.com/shorts/g_BYB0R-4Ws' }
];

// PPL Program (Push, Pull, Legs)
const pplProgram = {
  name: 'PPL (Push, Pull, Legs)',
  description: 'A classic 6-day split focusing on push movements, pull movements, and legs. Perfect for intermediate to advanced lifters looking to build muscle and strength.',
  weeks: [
    {
      name: 'Week 1 - Foundation',
      days: [
        {
          name: 'Push Day 1',
          dayType: 'workout',
          exercises: [
            { name: 'Barbell Bench Press', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '10-12', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dumbbell Flyes', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Overhead Press', sets: [{ reps: '8-10', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lateral Raises', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Tricep Dips', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Pull Day 1',
          dayType: 'workout',
          exercises: [
            { name: 'Pull-ups', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Rows', sets: [{ reps: '8-10', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lat Pulldown', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Seated Cable Rows', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Rear Delt Flyes', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Bicep Curls', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Legs Day 1',
          dayType: 'workout',
          exercises: [
            { name: 'Squats', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Romanian Deadlifts', sets: [{ reps: '8-10', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Push Day 2',
          dayType: 'workout',
          exercises: [
            { name: 'Overhead Press', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '10-12', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dumbbell Flyes', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lateral Raises', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Face Pulls', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Close-Grip Bench Press', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Pull Day 2',
          dayType: 'workout',
          exercises: [
            { name: 'Barbell Rows', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Pull-ups', sets: [{ reps: '6-8', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Seated Cable Rows', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lat Pulldown', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Rear Delt Flyes', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Hammer Curls', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Legs Day 2',
          dayType: 'workout',
          exercises: [
            { name: 'Romanian Deadlifts', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Squats', sets: [{ reps: '8-10', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        }
      ]
    },
    {
      name: 'Week 2 - Progression',
      days: [
        {
          name: 'Push Day 1',
          dayType: 'workout',
          exercises: [
            { name: 'Barbell Bench Press', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '8-10', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dumbbell Flyes', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Overhead Press', sets: [{ reps: '6-8', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lateral Raises', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Tricep Dips', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Pull Day 1',
          dayType: 'workout',
          exercises: [
            { name: 'Pull-ups', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Rows', sets: [{ reps: '6-8', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lat Pulldown', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Seated Cable Rows', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Rear Delt Flyes', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Bicep Curls', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Legs Day 1',
          dayType: 'workout',
          exercises: [
            { name: 'Squats', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Romanian Deadlifts', sets: [{ reps: '6-8', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Push Day 2',
          dayType: 'workout',
          exercises: [
            { name: 'Overhead Press', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '8-10', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dumbbell Flyes', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lateral Raises', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Face Pulls', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Close-Grip Bench Press', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Pull Day 2',
          dayType: 'workout',
          exercises: [
            { name: 'Barbell Rows', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Pull-ups', sets: [{ reps: '8-10', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Seated Cable Rows', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lat Pulldown', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Rear Delt Flyes', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Hammer Curls', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Legs Day 2',
          dayType: 'workout',
          exercises: [
            { name: 'Romanian Deadlifts', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Squats', sets: [{ reps: '6-8', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        }
      ]
    },
    {
      name: 'Week 3 - Intensity',
      days: [
        {
          name: 'Push Day 1',
          dayType: 'workout',
          exercises: [
            { name: 'Barbell Bench Press', sets: [{ reps: '4-6', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '6-8', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dumbbell Flyes', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Overhead Press', sets: [{ reps: '4-6', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lateral Raises', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Tricep Dips', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Pull Day 1',
          dayType: 'workout',
          exercises: [
            { name: 'Pull-ups', sets: [{ reps: '10-12', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Rows', sets: [{ reps: '4-6', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lat Pulldown', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Seated Cable Rows', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Rear Delt Flyes', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Bicep Curls', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Legs Day 1',
          dayType: 'workout',
          exercises: [
            { name: 'Squats', sets: [{ reps: '4-6', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Romanian Deadlifts', sets: [{ reps: '4-6', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '10-12', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Push Day 2',
          dayType: 'workout',
          exercises: [
            { name: 'Overhead Press', sets: [{ reps: '4-6', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '6-8', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dumbbell Flyes', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lateral Raises', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Face Pulls', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Close-Grip Bench Press', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Pull Day 2',
          dayType: 'workout',
          exercises: [
            { name: 'Barbell Rows', sets: [{ reps: '4-6', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Pull-ups', sets: [{ reps: '10-12', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Seated Cable Rows', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lat Pulldown', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Rear Delt Flyes', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Hammer Curls', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Legs Day 2',
          dayType: 'workout',
          exercises: [
            { name: 'Romanian Deadlifts', sets: [{ reps: '4-6', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Squats', sets: [{ reps: '4-6', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '10-12', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        }
      ]
    },
    {
      name: 'Week 4 - Deload',
      days: [
        {
          name: 'Push Day 1',
          dayType: 'workout',
          exercises: [
            { name: 'Barbell Bench Press', sets: [{ reps: '12-15', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dumbbell Flyes', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Overhead Press', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lateral Raises', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Tricep Dips', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Pull Day 1',
          dayType: 'workout',
          exercises: [
            { name: 'Pull-ups', sets: [{ reps: '15-20', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Rows', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lat Pulldown', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Seated Cable Rows', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Rear Delt Flyes', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Bicep Curls', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Legs Day 1',
          dayType: 'workout',
          exercises: [
            { name: 'Squats', sets: [{ reps: '12-15', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Romanian Deadlifts', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '20-25', rest: '30', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Push Day 2',
          dayType: 'workout',
          exercises: [
            { name: 'Overhead Press', sets: [{ reps: '12-15', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dumbbell Flyes', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lateral Raises', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Face Pulls', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Close-Grip Bench Press', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Pull Day 2',
          dayType: 'workout',
          exercises: [
            { name: 'Barbell Rows', sets: [{ reps: '12-15', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Pull-ups', sets: [{ reps: '15-20', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Seated Cable Rows', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lat Pulldown', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Rear Delt Flyes', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Hammer Curls', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Legs Day 2',
          dayType: 'workout',
          exercises: [
            { name: 'Romanian Deadlifts', sets: [{ reps: '12-15', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Squats', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '20-25', rest: '30', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        }
      ]
    }
  ]
};

// Upper/Lower Split Program
const upperLowerProgram = {
  name: 'Upper/Lower Split',
  description: 'A balanced 4-day split focusing on upper body and lower body training. Perfect for intermediate lifters who want to train each muscle group twice per week.',
  weeks: [
    {
      name: 'Week 1 - Foundation',
      days: [
        {
          name: 'Upper Body 1',
          dayType: 'workout',
          exercises: [
            { name: 'Barbell Bench Press', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Pull-ups', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Overhead Press', sets: [{ reps: '8-10', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Rows', sets: [{ reps: '8-10', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lat Pulldown', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lateral Raises', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Bicep Curls', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Tricep Dips', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Lower Body 1',
          dayType: 'workout',
          exercises: [
            { name: 'Squats', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Romanian Deadlifts', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Plank', sets: [{ reps: '30-45', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Russian Twists', sets: [{ reps: '20-25', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        },
        {
          name: 'Upper Body 2',
          dayType: 'workout',
          exercises: [
            { name: 'Overhead Press', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Rows', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '8-10', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Pull-ups', sets: [{ reps: '6-8', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dumbbell Flyes', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Seated Cable Rows', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Rear Delt Flyes', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Hammer Curls', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Close-Grip Bench Press', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Lower Body 2',
          dayType: 'workout',
          exercises: [
            { name: 'Romanian Deadlifts', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Squats', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Mountain Climbers', sets: [{ reps: '20-25', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dead Bug', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        }
      ]
    },
    {
      name: 'Week 2 - Progression',
      days: [
        {
          name: 'Upper Body 1',
          dayType: 'workout',
          exercises: [
            { name: 'Barbell Bench Press', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Pull-ups', sets: [{ reps: '8-10', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Overhead Press', sets: [{ reps: '6-8', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Rows', sets: [{ reps: '6-8', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lat Pulldown', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lateral Raises', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Bicep Curls', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Tricep Dips', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Lower Body 1',
          dayType: 'workout',
          exercises: [
            { name: 'Squats', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Romanian Deadlifts', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Plank', sets: [{ reps: '45-60', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Russian Twists', sets: [{ reps: '25-30', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        },
        {
          name: 'Upper Body 2',
          dayType: 'workout',
          exercises: [
            { name: 'Overhead Press', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Rows', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '6-8', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Pull-ups', sets: [{ reps: '8-10', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dumbbell Flyes', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Seated Cable Rows', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Rear Delt Flyes', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Hammer Curls', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Close-Grip Bench Press', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Lower Body 2',
          dayType: 'workout',
          exercises: [
            { name: 'Romanian Deadlifts', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Squats', sets: [{ reps: '6-8', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '10-12', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Mountain Climbers', sets: [{ reps: '25-30', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dead Bug', sets: [{ reps: '20-25', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        }
      ]
    },
    {
      name: 'Week 3 - Intensity',
      days: [
        {
          name: 'Upper Body 1',
          dayType: 'workout',
          exercises: [
            { name: 'Barbell Bench Press', sets: [{ reps: '4-6', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Pull-ups', sets: [{ reps: '10-12', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Overhead Press', sets: [{ reps: '4-6', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Rows', sets: [{ reps: '4-6', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lat Pulldown', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lateral Raises', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Bicep Curls', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Tricep Dips', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Lower Body 1',
          dayType: 'workout',
          exercises: [
            { name: 'Squats', sets: [{ reps: '4-6', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Romanian Deadlifts', sets: [{ reps: '4-6', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '10-12', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Plank', sets: [{ reps: '60-90', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Russian Twists', sets: [{ reps: '30-40', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        },
        {
          name: 'Upper Body 2',
          dayType: 'workout',
          exercises: [
            { name: 'Overhead Press', sets: [{ reps: '4-6', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Rows', sets: [{ reps: '4-6', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '4-6', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Pull-ups', sets: [{ reps: '10-12', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dumbbell Flyes', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Seated Cable Rows', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Rear Delt Flyes', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Hammer Curls', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Close-Grip Bench Press', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Lower Body 2',
          dayType: 'workout',
          exercises: [
            { name: 'Romanian Deadlifts', sets: [{ reps: '4-6', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Squats', sets: [{ reps: '4-6', rest: '120', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '6-8', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '8-10', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '10-12', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Mountain Climbers', sets: [{ reps: '30-40', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dead Bug', sets: [{ reps: '25-30', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        }
      ]
    },
    {
      name: 'Week 4 - Deload',
      days: [
        {
          name: 'Upper Body 1',
          dayType: 'workout',
          exercises: [
            { name: 'Barbell Bench Press', sets: [{ reps: '12-15', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Pull-ups', sets: [{ reps: '15-20', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Overhead Press', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Rows', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lat Pulldown', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Lateral Raises', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Bicep Curls', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Tricep Dips', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Lower Body 1',
          dayType: 'workout',
          exercises: [
            { name: 'Squats', sets: [{ reps: '12-15', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Romanian Deadlifts', sets: [{ reps: '12-15', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '20-25', rest: '30', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Plank', sets: [{ reps: '90-120', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Russian Twists', sets: [{ reps: '40-50', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        },
        {
          name: 'Upper Body 2',
          dayType: 'workout',
          exercises: [
            { name: 'Overhead Press', sets: [{ reps: '12-15', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Barbell Rows', sets: [{ reps: '12-15', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Incline Dumbbell Press', sets: [{ reps: '12-15', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Pull-ups', sets: [{ reps: '15-20', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dumbbell Flyes', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Seated Cable Rows', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Rear Delt Flyes', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Hammer Curls', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Close-Grip Bench Press', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Lower Body 2',
          dayType: 'workout',
          exercises: [
            { name: 'Romanian Deadlifts', sets: [{ reps: '12-15', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Squats', sets: [{ reps: '12-15', rest: '90', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Walking Lunges', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Bulgarian Split Squats', sets: [{ reps: '12-15', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Leg Press', sets: [{ reps: '15-20', rest: '45', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Calf Raises', sets: [{ reps: '20-25', rest: '30', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Mountain Climbers', sets: [{ reps: '40-50', rest: '60', tempo: '2-1-2' }], groupType: 'none' },
            { name: 'Dead Bug', sets: [{ reps: '30-40', rest: '45', tempo: '2-1-2' }], groupType: 'none' }
          ]
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        },
        {
          name: 'Rest Day',
          dayType: 'off',
          exercises: []
        }
      ]
    }
  ]
};

async function seedDefaultPrograms() {
  try {
    console.log('🌱 Starting to seed default programs...');

    // First, create all the exercises
    console.log('📝 Creating exercises...');
    const exerciseMap = new Map();
    
    for (const exercise of defaultExercises) {
      // Check if exercise already exists
      const existingExercise = await prisma.exercise.findFirst({
        where: {
          name: exercise.name,
          trainerId: 6
        }
      });

      if (existingExercise) {
        console.log(`Exercise "${exercise.name}" already exists, skipping...`);
        exerciseMap.set(exercise.name, existingExercise.id);
      } else {
        const created = await prisma.exercise.create({
          data: {
            trainerId: 6, // Ahmed Hossam's ID
            name: exercise.name,
            category: exercise.category,
            videoUrl: exercise.videoUrl,
            description: `Professional ${exercise.name} exercise`,
            bodyPart: exercise.category,
            equipment: 'Various',
            target: exercise.category,
            secondaryMuscles: [],
            instructions: [
              'Warm up properly before starting',
              'Use proper form throughout the movement',
              'Control the weight on both the concentric and eccentric phases',
              'Breathe properly during the exercise'
            ]
          }
        });
        exerciseMap.set(exercise.name, created.id);
      }
    }

    console.log(`✅ Created ${exerciseMap.size} exercises`);

    // Helper function to create a program (idempotent)
    async function createProgram(programData, trainerId = 6) {
      // Check if program already exists
      const existingProgram = await prisma.program.findFirst({
        where: {
          name: programData.name,
          isDefault: true
        }
      });

      if (existingProgram) {
        console.log(`Program "${programData.name}" already exists, skipping...`);
        return existingProgram;
      }

      const program = await prisma.program.create({
        data: {
          trainerId,
          name: programData.name,
          description: programData.description,
          isDefault: true, // Mark as default program
          weeks: {
            create: programData.weeks.map((week, weekIndex) => ({
              weekNumber: weekIndex + 1,
              name: week.name,
              days: {
                create: week.days.map((day, dayIndex) => ({
                  dayNumber: dayIndex + 1,
                  name: day.name,
                  dayType: day.dayType,
                  exercises: {
                    create: day.exercises.map((exercise, exerciseIndex) => {
                      const exerciseId = exerciseMap.get(exercise.name);
                      if (!exerciseId) {
                        throw new Error(`Exercise not found: ${exercise.name}`);
                      }
                      
                      return {
                        exerciseId,
                        order: exerciseIndex + 1,
                        sets: exercise.sets,
                        duration: null,
                        notes: '',
                        groupId: null,
                        groupType: exercise.groupType || 'none',
                        videoUrl: null,
                        dropset: false,
                        singleLeg: false,
                        failure: false
                      };
                    })
                  }
                }))
              }
            }))
          }
        },
        include: {
          weeks: {
            include: {
              days: {
                include: {
                  exercises: true
                }
              }
            }
          }
        }
      });
      return program;
    }

    // Create PPL Program
    console.log('🏋️ Creating PPL Program...');
    const pplProgramCreated = await createProgram(pplProgram);
    console.log(`✅ Created PPL Program with ID: ${pplProgramCreated.id}`);

    // Create Upper/Lower Program
    console.log('💪 Creating Upper/Lower Program...');
    const upperLowerProgramCreated = await createProgram(upperLowerProgram);
    console.log(`✅ Created Upper/Lower Program with ID: ${upperLowerProgramCreated.id}`);

    console.log('🎉 Successfully seeded default programs!');
    console.log(`📊 Found 2 programs (PPL and Upper/Lower Split)`);
    
  } catch (error) {
    console.error('❌ Error seeding default programs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedDefaultPrograms()
  .then(() => {
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
