import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StepConfig {
  repeat?: 'once' | 'until_subscription_ends' | 'custom';
  repeatCount?: number;
  [key: string]: any;
}

class WorkflowExecutor {
  // Process a single workflow execution
  async processExecution(executionId: number): Promise<void> {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' }
            }
          }
        },
        client: true,
        currentStep: true
      }
    });

    if (!execution || execution.status !== 'active') {
      return;
    }

    const { workflow, client, currentStep } = execution;

    if (!currentStep) {
      // Execution completed
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });
      return;
    }

    const config: StepConfig = JSON.parse(currentStep.config);

    // Check if step should be executed based on timing configuration
    const shouldExecute = await this.shouldExecuteStep(config, client, execution);
    if (!shouldExecute) {
      console.log(`Step ${currentStep.id} waiting for timing condition`);
      return; // Don't execute yet, wait for the right time
    }

    // Execute the current step
    await this.executeStep(currentStep, config, client);

    // Check if this step should repeat
    if (await this.shouldRepeat(config, execution)) {
      // Keep at current step for repeat
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { lastStepAt: new Date() }
      });
      return;
    }

    // Move to next step
    const currentStepIndex = workflow.steps.findIndex(s => s.id === currentStep.id);
    const nextStep = workflow.steps[currentStepIndex + 1];

    if (nextStep) {
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          currentStepId: nextStep.id,
          lastStepAt: new Date()
        }
      });
      
    } else {
      // No more steps - complete the execution
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });
    }
  }

  // Execute a single step based on its type
  private async executeStep(step: any, config: StepConfig, client: any): Promise<void> {
    switch (step.stepType) {
      case 'audience':
        // Audience step is informational only - no action needed
        break;

      case 'form':
        await this.sendForm(client, config);
        break;

      case 'notification':
        await this.sendNotification(client, config);
        break;

      case 'wait':
        // Wait steps are handled separately by the scheduler
        break;

      case 'condition':
        // Conditions would be evaluated here
        break;

      default:
        console.warn(`Unknown step type: ${step.stepType}`);
    }
  }

  // Send a form to the client
  private async sendForm(client: any, config: StepConfig): Promise<void> {
    try {
      const formId = config.formId;
      if (!formId) {
        console.warn('No form ID specified in configuration');
        return;
      }

      // Check if form exists
      const form = await prisma.checkIn.findUnique({
        where: { id: Number(formId) }
      });

      if (!form) {
        console.warn(`Form ${formId} not found`);
        return;
      }

      // Create a notification to tell the client to complete the form
      const message = config.message || `Please complete the form: ${form.name}`;
      
      const notification = await prisma.notification.create({
        data: {
          trainerId: client.trainerId,
          title: 'New Form Available',
          message: message,
          type: 'workflow'
        }
      });

      // Create notification recipient
      await prisma.notificationRecipient.create({
        data: {
          notificationId: notification.id,
          clientId: client.id,
          status: 'sent'
        }
      });

      console.log(`Form ${formId} notification sent to client ${client.id}`);
    } catch (error) {
      console.error('Error sending form:', error);
    }
  }

  // Send a notification to the client
  private async sendNotification(client: any, config: StepConfig): Promise<void> {
    try {
      // Create notification
      const notification = await prisma.notification.create({
        data: {
          trainerId: client.trainerId,
          title: config.title || 'Workflow Notification',
          message: config.message || '',
          type: 'workflow'
        }
      });

      // Create notification recipient
      await prisma.notificationRecipient.create({
        data: {
          notificationId: notification.id,
          clientId: client.id,
          status: 'sent'
        }
      });

      console.log(`Sent notification to client ${client.id}:`, notification.id);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Check if step should execute based on timing configuration
  private async shouldExecuteStep(config: StepConfig, client: any, execution: any): Promise<boolean> {
    const sendTiming = config.sendTiming || 'immediate';

    // Immediate steps always execute
    if (sendTiming === 'immediate') {
      return true;
    }

    // After X days - check if enough time has passed
    if (sendTiming === 'delay_days') {
      const delayDays = config.delayDays || 0;
      const startDate = execution.startedAt;
      const daysSinceStart = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceStart >= delayDays;
    }

    // After form submission - check if the trigger form has been submitted and delay passed
    if (sendTiming === 'after_form_submission') {
      const triggerFormId = config.triggerFormId;
      if (!triggerFormId) return true; // No form specified, allow execution

      const submissionDelayDays = config.submissionDelayDays || 0;

      // Check if client has submitted this form
      const submission = await prisma.checkInSubmission.findFirst({
        where: {
          clientId: client.id,
          formId: Number(triggerFormId)
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });

      // Only execute if form has been submitted after workflow started
      if (submission) {
        const submissionTime = new Date(submission.submittedAt).getTime();
        const workflowStartTime = new Date(execution.startedAt).getTime();
        
        if (submissionTime >= workflowStartTime) {
          // Check if delay period has passed
          const timeSinceSubmission = Date.now() - submissionTime;
          const daysSinceSubmission = timeSinceSubmission / (1000 * 60 * 60 * 24);
          return daysSinceSubmission >= submissionDelayDays;
        }
      }

      return false; // Form not submitted yet or delay not passed
    }

    // Before subscription ends - check if we're at the right time
    if (sendTiming === 'before_subscription_end') {
      const daysBefore = config.daysBeforeEnd || 7;
      
      // Get client's subscription
      const subscription = await prisma.subscription.findFirst({
        where: {
          clientId: client.id,
          isCanceled: false
        },
        orderBy: {
          endDate: 'desc'
        }
      });

      if (!subscription || !subscription.endDate) {
        return false; // No subscription found
      }

      const endDate = new Date(subscription.endDate);
      const targetDate = new Date(endDate.getTime() - (daysBefore * 24 * 60 * 60 * 1000));
      const now = new Date();

      // Execute if we're at or past the target date
      return now >= targetDate;
    }

    // Specific day/time - handled separately by scheduler
    if (sendTiming === 'specific_day' || sendTiming === 'specific_time') {
      // For now, allow execution - these should be handled by a separate scheduler
      return true;
    }

    return true; // Default: allow execution
  }

  // Check if step should repeat
  private async shouldRepeat(config: StepConfig, execution: any): Promise<boolean> {
    const repeat = config.repeat || 'once';

    if (repeat === 'once') {
      return false;
    }

    if (repeat === 'until_subscription_ends') {
      // Check if subscription is still active
      // TODO: Implement subscription check
      return true;
    }

    if (repeat === 'custom') {
      const repeatCount = config.repeatCount || 1;
      
      // Get current repeat count from execution data
      const executionData = execution.data ? JSON.parse(execution.data) : {};
      const stepRepeatKey = `step_${execution.currentStepId}_repeat`;
      const currentRepeatCount = executionData[stepRepeatKey] || 0;
      
      // Check if we've reached the repeat limit
      if (currentRepeatCount >= repeatCount) {
        return false; // Stop repeating, move to next step
      }
      
      // Increment repeat count in execution data
      const updatedData = { 
        ...executionData, 
        [stepRepeatKey]: currentRepeatCount + 1 
      };
      
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          data: JSON.stringify(updatedData)
        }
      });
      
      return true; // Continue repeating at current step
    }

    return false;
  }

  // Process all active executions that need action
  async processActiveExecutions(): Promise<void> {
    try {
      const executions = await prisma.workflowExecution.findMany({
        where: {
          status: 'active'
        },
        include: {
          workflow: {
            include: {
              steps: {
                orderBy: { stepOrder: 'asc' }
              }
            }
          },
          client: true,
          currentStep: true
        }
      });

      for (const execution of executions) {
        if (!execution.currentStep) continue;

        const config: StepConfig = JSON.parse(execution.currentStep.config);

        // Check if current step is a "wait" step that needs to be processed
        if (execution.currentStep.stepType === 'wait') {
          const waitTime = config.days || 0;
          const lastStepTime = execution.lastStepAt;

          if (lastStepTime) {
            const timeElapsed = Date.now() - new Date(lastStepTime).getTime();
            const daysElapsed = timeElapsed / (1000 * 60 * 60 * 24);

            if (daysElapsed >= waitTime) {
              // Wait period complete - move to next step
              await this.processExecution(execution.id);
            }
          }
        } else {
          // Process non-wait steps immediately
          await this.processExecution(execution.id);
        }
      }
    } catch (error) {
      console.error('Error processing active executions:', error);
    }
  }
}

export default new WorkflowExecutor();

