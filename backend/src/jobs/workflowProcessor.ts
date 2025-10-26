import cron from 'node-cron';
import workflowExecutor from '../services/workflowExecutor';

class WorkflowProcessor {
  private interval: NodeJS.Timeout | null = null;

  start() {
    // Process active workflow executions every 5 minutes
    this.interval = setInterval(async () => {
      console.log('[Workflow Processor] Processing active executions...');
      await workflowExecutor.processActiveExecutions();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('[Workflow Processor] Started - checking every 5 minutes');
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[Workflow Processor] Stopped');
    }
  }
}

export default new WorkflowProcessor();

