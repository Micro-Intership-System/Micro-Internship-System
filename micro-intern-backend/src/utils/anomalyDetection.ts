import { Anomaly, IAnomaly } from "../models/anomaly";
import { Internship } from "../models/internship";
import { Application } from "../models/application";
import { Payment } from "../models/payment";
import { User } from "../models/user";

/**
 * Check for employer inactivity (no response to applications for > 7 days)
 */
export async function detectEmployerInactivity(): Promise<IAnomaly[]> {
  const anomalies: IAnomaly[] = [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find applications that are pending for more than 7 days
  const staleApplications = await Application.find({
    status: "evaluating",
    createdAt: { $lt: sevenDaysAgo },
  }).populate("internshipId");

  for (const app of staleApplications) {
    const internship = app.internshipId as any;
    if (!internship) continue;

    // Check if anomaly already exists
    const existing = await Anomaly.findOne({
      type: "employer_inactivity",
      taskId: internship._id,
      status: { $in: ["open", "investigating"] },
    });

    if (!existing) {
      const anomaly = await Anomaly.create({
        type: "employer_inactivity",
        severity: "medium",
        taskId: internship._id,
        employerId: internship.employerId,
        description: `Employer has not responded to applications for task "${internship.title}" for over 7 days`,
        detectedAt: new Date(),
      });
      anomalies.push(anomaly);
    }
  }

  return anomalies;
}

/**
 * Check for student overwork (too many active tasks)
 */
export async function detectStudentOverwork(): Promise<IAnomaly[]> {
  const anomalies: IAnomaly[] = [];
  const maxActiveTasks = 5; // Threshold

  const students = await User.find({ role: "student" });

  for (const student of students) {
    const activeTasks = await Internship.countDocuments({
      acceptedStudentId: student._id,
      status: "in_progress",
    });

    if (activeTasks > maxActiveTasks) {
      const existing = await Anomaly.findOne({
        type: "student_overwork",
        studentId: student._id,
        status: { $in: ["open", "investigating"] },
      });

      if (!existing) {
        const severity = activeTasks > 10 ? "critical" : activeTasks > 7 ? "high" : "medium";
        const anomaly = await Anomaly.create({
          type: "student_overwork",
          severity,
          studentId: student._id,
          userId: student._id,
          description: `Student has ${activeTasks} active tasks, exceeding the recommended limit of ${maxActiveTasks}`,
          detectedAt: new Date(),
        });
        anomalies.push(anomaly);
      }
    }
  }

  return anomalies;
}

/**
 * Check for missed deadlines
 */
export async function detectMissedDeadlines(): Promise<IAnomaly[]> {
  const anomalies: IAnomaly[] = [];
  const now = new Date();

  const overdueTasks = await Internship.find({
    status: "in_progress",
    deadline: { $lt: now },
  });

  for (const task of overdueTasks) {
    const existing = await Anomaly.findOne({
      type: "missed_deadline",
      taskId: task._id,
      status: { $in: ["open", "investigating"] },
    });

    if (!existing) {
      const daysOverdue = Math.floor((now.getTime() - task.deadline!.getTime()) / (24 * 60 * 60 * 1000));
      const severity = daysOverdue > 7 ? "critical" : daysOverdue > 3 ? "high" : "medium";
      
      const anomaly = await Anomaly.create({
        type: "missed_deadline",
        severity,
        taskId: task._id,
        studentId: task.acceptedStudentId,
        employerId: task.employerId,
        description: `Task "${task.title}" deadline was missed ${daysOverdue} day(s) ago`,
        detectedAt: new Date(),
      });
      anomalies.push(anomaly);
    }
  }

  return anomalies;
}

/**
 * Check for delayed payments (task completed but payment not released after 3 days)
 */
export async function detectDelayedPayments(): Promise<IAnomaly[]> {
  const anomalies: IAnomaly[] = [];
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const completedTasks = await Internship.find({
    status: "completed",
    completedAt: { $lt: threeDaysAgo },
  });

  for (const task of completedTasks) {
    const payment = await Payment.findOne({
      taskId: task._id,
      status: { $in: ["pending", "escrowed"] },
    });

    if (payment) {
      const existing = await Anomaly.findOne({
        type: "delayed_payment",
        taskId: task._id,
        status: { $in: ["open", "investigating"] },
      });

      if (!existing) {
        const daysSinceCompletion = Math.floor(
          (Date.now() - task.completedAt!.getTime()) / (24 * 60 * 60 * 1000)
        );
        const severity = daysSinceCompletion > 7 ? "critical" : "high";
        
        const anomaly = await Anomaly.create({
          type: "delayed_payment",
          severity,
          taskId: task._id,
          employerId: task.employerId,
          studentId: task.acceptedStudentId,
          description: `Payment for completed task "${task.title}" has been delayed for ${daysSinceCompletion} day(s)`,
          detectedAt: new Date(),
        });
        anomalies.push(anomaly);
      }
    }
  }

  return anomalies;
}

/**
 * Run all anomaly detection checks
 */
export async function runAnomalyDetection(): Promise<IAnomaly[]> {
  const allAnomalies: IAnomaly[] = [];

  const [
    inactivityAnomalies,
    overworkAnomalies,
    deadlineAnomalies,
    paymentAnomalies,
  ] = await Promise.all([
    detectEmployerInactivity(),
    detectStudentOverwork(),
    detectMissedDeadlines(),
    detectDelayedPayments(),
  ]);

  allAnomalies.push(
    ...inactivityAnomalies,
    ...overworkAnomalies,
    ...deadlineAnomalies,
    ...paymentAnomalies
  );

  return allAnomalies;
}

