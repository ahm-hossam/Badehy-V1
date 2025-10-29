import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/dashboard/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { trainerId } = req.query;
    
    if (!trainerId) {
      return res.status(400).json({ error: 'trainerId is required' });
    }

    const id = Number(trainerId);

    // Get current month dates
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all client IDs for this trainer first
    const trainerClients = await prisma.trainerClient.findMany({
      where: { trainerId: id },
      select: { id: true }
    });
    const clientIds = trainerClients.map(c => c.id);

    // Parallel queries for all stats
    const [
      totalClients,
      activeSubscriptions,
      pendingTasks,
      monthlyRevenue,
      clientsByGender,
      packagesWithClients,
      recentCheckins,
      recentLeads,
      recentTasks,
      upcomingRenewals,
      clientsNeedingFollowup,
      uncompletedTasks,
      newLeads,
      totalLeads,
      totalCheckins,
      totalTeamMembers,
      activePrograms,
      activeForms,
      clientGrowthData,
      subscriptionStatusBreakdown,
      revenueComparison,
      totalWorkflows,
      recentWorkflowExecutions,
      mostActiveWorkouts,
      mostActiveMeals,
      inactiveClients,
      programsFinishingSoon,
      clientActivities
    ] = await Promise.all([
      // Total clients
      trainerClients.length,
      
      // Active subscriptions (for this trainer's clients)
      prisma.subscription.count({
        where: {
          clientId: { in: clientIds },
          paymentStatus: 'paid',
          endDate: { gte: new Date() },
          isCanceled: false,
          isOnHold: false
        }
      }),
      
      // Pending tasks
      prisma.task.count({
        where: {
          trainerId: id,
          status: 'open'
        }
      }),
      
      // Monthly revenue (sum of all income records including refunds for this month)
      prisma.financialRecord.aggregate({
        where: {
          trainerId: id,
          type: 'income',
          date: { 
            gte: firstDayOfMonth, 
            lte: lastDayOfMonth 
          }
        },
        _sum: { amount: true }
      }).then(result => {
        const total = result._sum.amount || 0;
        // Return 0 if negative (refunds exceed income)
        return Math.max(0, total);
      }),
      
      // Clients by gender
      prisma.trainerClient.groupBy({
        by: ['gender'],
        where: {
          trainerId: id,
          gender: { not: null }
        },
        _count: { gender: true }
      }),
      
      // Packages with client counts
      (async () => {
        const subs = await prisma.subscription.groupBy({
          by: ['packageId'],
          where: {
            clientId: { in: clientIds },
            isCanceled: false
          },
          _count: { packageId: true }
        });

        const packageDetails = await Promise.all(
          subs.map(async (sub) => {
            if (!sub.packageId) return null;
            const pkg = await prisma.package.findUnique({
              where: { id: sub.packageId },
              select: { id: true, name: true }
            });
            return {
              packageId: sub.packageId,
              packageName: pkg?.name || 'Unknown Package',
              clientCount: sub._count?.packageId || 0
            };
          })
        );
        return packageDetails.filter(Boolean);
      })(),
      
      // Recent check-ins (last 5)
      prisma.checkInSubmission.findMany({
        where: {
          form: { trainerId: id }
        },
        orderBy: { submittedAt: 'desc' },
        take: 5,
        include: {
          client: { select: { id: true, fullName: true } },
          form: { select: { id: true, name: true } }
        }
      }),
      
      // Recent leads (last 5)
      prisma.lead.findMany({
        where: { trainerId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, fullName: true, email: true, phone: true, createdAt: true }
      }),
      
      // Recent tasks (last 5)
      prisma.task.findMany({
        where: { trainerId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: { select: { id: true, fullName: true } },
          assignedTeamMember: { select: { id: true, fullName: true, role: true } }
        }
      }),
      
      // Upcoming renewals (next 30 days) for trainer's clients
      prisma.subscription.findMany({
        where: {
          clientId: { in: clientIds },
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          isCanceled: false,
          isOnHold: false
        },
        include: {
          client: { select: { id: true, fullName: true } },
          package: { select: { id: true, name: true } }
        }
      }),
      
      // Clients needing follow-up (no check-in in 30 days)
      prisma.trainerClient.findMany({
        where: {
          trainerId: id,
          submissions: {
            none: {
              submittedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        },
        select: { id: true, fullName: true, email: true },
        take: 10
      }),
      
      // Uncompleted tasks
      prisma.task.findMany({
        where: {
          trainerId: id,
          status: 'open'
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
        include: {
          client: { select: { id: true, fullName: true } },
          assignedTeamMember: { select: { id: true, fullName: true } }
        }
      }),
      
      // New leads (last 7 days) - removed status filter
      prisma.lead.findMany({
        where: {
          trainerId: id,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, fullName: true, email: true, phone: true, createdAt: true }
      }),
      
      // Total leads
      prisma.lead.count({ where: { trainerId: id } }),
      
      // Total check-ins this week
      prisma.checkInSubmission.count({
        where: {
          form: { trainerId: id },
          submittedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      
      // Total team members
      prisma.teamMember.count({ where: { trainerId: id } }),
      
      // Active programs
      prisma.program.count({ where: { trainerId: id } }),
      
      // Active forms
      prisma.checkInForm.count({ where: { trainerId: id } }),
      
      // Client growth data (last 6 months)
      (async () => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          const count = await prisma.trainerClient.count({
            where: {
              trainerId: id,
              createdAt: { gte: date, lt: nextMonth }
            }
          });
          months.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            count
          });
        }
        return months;
      })(),
      
      // Subscription status breakdown (for trainer's clients)
      prisma.subscription.groupBy({
        by: ['paymentStatus'],
        where: { clientId: { in: clientIds } },
        _count: { paymentStatus: true }
      }),
      
      // Revenue comparison (this month vs last month) for trainer's clients
      Promise.all([
        prisma.subscription.aggregate({
          where: {
            clientId: { in: clientIds },
            startDate: { gte: firstDayOfMonth, lte: lastDayOfMonth }
          },
          _sum: { priceAfterDisc: true }
        }),
        prisma.subscription.aggregate({
          where: {
            clientId: { in: clientIds },
            startDate: {
              gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
              lt: firstDayOfMonth
            }
          },
          _sum: { priceAfterDisc: true }
        })
      ]).then(([current, previous]) => ({
        current: current._sum?.priceAfterDisc || 0,
        previous: previous._sum?.priceAfterDisc || 0
      })),
      
      // Total workflows
      prisma.workflow.count({ where: { trainerId: id } }),
      
      // Recent workflow executions - fixed the query
      prisma.workflowExecution.findMany({
        where: {
          client: {
            trainerId: id
          }
        },
        orderBy: { id: 'desc' },
        take: 5,
        include: {
          workflow: { select: { id: true, name: true } }
        }
      }),
      
      // Most active clients (who complete workouts) - last 7 days
      (async () => {
        const workoutSessions = await prisma.workoutSession.groupBy({
          by: ['clientId'],
          where: {
            clientId: { in: clientIds },
            completedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          _count: { clientId: true },
          orderBy: { _count: { clientId: 'desc' } },
          take: 5
        });
        
        const clientDetails = await Promise.all(
          workoutSessions.map(async (session) => {
            const client = await prisma.trainerClient.findUnique({
              where: { id: session.clientId },
              select: { id: true, fullName: true }
            });
            return {
              client: client,
              workoutCount: session._count.clientId
            };
          })
        );
        return clientDetails;
      })(),
      
      // Most active clients (who have active nutrition programs) - showing engagement
      (async () => {
        // Get clients with active nutrition program assignments
        const activeNutritionAssignments = await prisma.clientNutritionAssignment.findMany({
          where: {
            trainerId: id,
            isActive: true,
            clientId: { in: clientIds }
          },
          include: {
            client: { select: { id: true, fullName: true } },
            nutritionProgram: { select: { id: true, name: true } }
          },
          orderBy: { assignedAt: 'desc' },
          take: 5
        });
        
        // Return clients with their nutrition program info
        return activeNutritionAssignments.map(assignment => ({
          client: assignment.client,
          nutritionProgramName: assignment.nutritionProgram?.name || 'Nutrition Program',
          mealCount: 1 // Placeholder - actual meal completion tracking would require backend sync
        }));
      })(),
      
      // InhibitedClients who haven't opened the app - no push token or last active > 30 days ago
      (async () => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const clientsWithoutTokens = await prisma.trainerClient.findMany({
          where: {
            trainerId: id,
            pushToken: null
          },
          select: { id: true, fullName: true, email: true },
          take: 10
        });
        
        return clientsWithoutTokens;
      })(),
      
      // Clients whose programs finish soon (within 7 days)
      (async () => {
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        const [workoutPrograms, nutritionPrograms] = await Promise.all([
          prisma.clientProgramAssignment.findMany({
            where: {
              trainerId: id,
              endDate: {
                lte: sevenDaysFromNow,
                gte: new Date()
              },
              isActive: true
            },
            include: {
              client: { select: { id: true, fullName: true } },
              program: { select: { id: true, name: true } }
            },
            orderBy: { endDate: 'asc' },
            take: 10
          }),
          prisma.clientNutritionAssignment.findMany({
            where: {
              trainerId: id,
              endDate: {
                lte: sevenDaysFromNow,
                gte: new Date()
              },
              isActive: true
            },
            include: {
              client: { select: { id: true, fullName: true } },
              nutritionProgram: { select: { id: true, name: true } }
            },
            orderBy: { endDate: 'asc' },
            take: 10
          })
        ]);
        
        const programs = [
          ...workoutPrograms.map(w => ({
            client: w.client,
            program: { id: w.program.id, name: w.program.name, type: 'workout' },
            endDate: w.endDate
          })),
          ...nutritionPrograms.map(n => ({
            client: n.client,
            program: { id: n.nutritionProgram.id, name: n.nutritionProgram.name, type: 'nutrition' },
            endDate: n.endDate
          }))
        ].sort((a, b) => (a.endDate?.getTime() || 0) - (b.endDate?.getTime() || 0)).slice(0, 10);
        
        return programs;
      })(),
      
      // Client Activities (recent activities from last 24 hours)
      (async () => {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activities: Array<{
          type: string;
          client: any;
          timestamp: Date;
          details: string;
        }> = [];
        
        // Get recent workout completions
        const recentWorkouts = await prisma.workoutSession.findMany({
          where: {
            clientId: { in: clientIds },
            completedAt: { gte: last24Hours }
          },
          orderBy: { completedAt: 'desc' },
          take: 10,
          include: {
            client: { select: { id: true, fullName: true } }
          }
        });
        
        // Get recent form submissions
        const recentForms = await prisma.checkInSubmission.findMany({
          where: {
            clientId: { in: clientIds },
            submittedAt: { gte: last24Hours }
          },
          orderBy: { submittedAt: 'desc' },
          take: 10,
          include: {
            client: { select: { id: true, fullName: true } },
            form: { select: { id: true, name: true } }
          }
        });
        
        // Combine and format activities
        recentWorkouts.forEach(workout => {
          if (workout.completedAt) {
            activities.push({
              type: 'workout_completed',
              client: workout.client,
              timestamp: workout.completedAt,
              details: 'completed workout'
            });
          }
        });
        
        recentForms.forEach(form => {
          if (form.submittedAt) {
            activities.push({
              type: 'form_submitted',
              client: form.client,
              timestamp: form.submittedAt,
              details: form.form?.name || 'check-in form'
            });
          }
        });
        
        // Sort by timestamp and return latest 15
        return activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 15);
      })()
    ]);

    res.json({
      keyMetrics: {
        totalClients,
        activeSubscriptions,
        pendingTasks,
        monthlyRevenue
      },
      genderDistribution: clientsByGender,
      packagesOverview: packagesWithClients,
      recentActivity: {
        checkins: recentCheckins,
        leads: recentLeads,
        tasks: recentTasks
      },
      upcomingAlerts: {
        renewals: upcomingRenewals,
        clientsNeedingFollowup,
        uncompletedTasks,
        newLeads
      },
      quickStats: {
        totalLeads,
        checkinsThisWeek: totalCheckins,
        totalTeamMembers,
        activePrograms,
        activeForms
      },
      analytics: {
        clientGrowth: clientGrowthData,
        subscriptionStatus: subscriptionStatusBreakdown,
        revenueComparison
      },
      workflowStats: {
        totalWorkflows,
        recentExecutions: recentWorkflowExecutions
      },
      clientActivity: {
        mostActiveWorkouts,
        mostActiveMeals,
        inactiveClients,
        programsFinishingSoon
      },
      clientActivities
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;
