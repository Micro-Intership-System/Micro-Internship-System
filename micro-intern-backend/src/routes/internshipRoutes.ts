import { Router } from "express";
import { Internship } from "../models/internship";
import { Application } from "../models/application";
import { requireAuth } from "../middleware/requireAuth";
import { User } from "../models/user";
import { createNotification } from "../utils/notifications";
import { Anomaly } from "../models/anomaly";

const router = Router();

/**
 * Middleware: require employer role
 */
async function requireEmployer(req: any, res: any, next: any) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Access denied — employer account required",
      });
    }

    req.employer = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * F2-1: Get Internship Details
 * GET /api/internships/:id
 * Used on the Internship Details Page main content.
 */
router.get("/:id", async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate("acceptedStudentId", "name email")
      .populate("employerId", "name email companyName");

    if (!internship) {
      return res
        .status(404)
        .json({ success: false, message: "Internship not found" });
    }

    res.json({ success: true, data: internship });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ success: false, message: "Invalid internship ID format" });
  }
});

/**
 * F2-2: Get Related Internships
 * GET /api/internships/:id/related
 * Used in the "Related job posts" section at the bottom of the page.
 */
router.get("/:id/related", async (req, res) => {
  try {
    const base = await Internship.findById(req.params.id);
    if (!base) {
      return res
        .status(404)
        .json({ success: false, message: "Internship not found" });
    }

    const related = await Internship.find({
      _id: { $ne: base._id },
      tags: { $in: base.tags }
    }).limit(3);

    res.json({ success: true, data: related });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ success: false, message: "Invalid internship ID format" });
  }
});

/**
 * POST /api/internships
 * ✅ STEP 5: must be employer + must have company profile + attach employerId + companyName
 */
router.post("/", requireAuth, requireEmployer, async (req, res) => {
  try {
    // 1. Get employer from token
    const employer = await User.findById(req.user!.id);
    if (!employer || !employer.companyName) {
      return res.status(400).json({
        success: false,
        message: "Employer company profile required",
      });
    }

    // Check if employer has restriction (can only post low priority jobs)
    const now = new Date();
    
    // Check restriction - ensure we're using the actual date object
    if (employer.restrictionUntil && employer.canOnlyPostLowPriority) {
      const restrictionDate = employer.restrictionUntil instanceof Date 
        ? employer.restrictionUntil 
        : new Date(employer.restrictionUntil);
      
      // Check if restriction has expired
      if (restrictionDate <= now) {
        // Restriction expired, remove it
        employer.restrictionUntil = undefined;
        employer.canOnlyPostLowPriority = false;
        await employer.save();
      } else {
        // Still restricted - enforce low priority only
        if (req.body.priorityLevel && req.body.priorityLevel !== "low") {
          return res.status(403).json({
            success: false,
            message: `You are restricted to posting only low priority jobs until ${restrictionDate.toLocaleDateString()}. Please select "low" priority.`,
          });
        }
        // Force low priority if not specified or if trying to set a different priority
        req.body.priorityLevel = "low";
      }
    }

    // 2. Whitelist allowed fields ONLY
    const {
      title,
      location,
      duration,
      gold, // Changed from budget to gold
      description,
      skills,
      tags,
      bannerUrl,
      priorityLevel,
      isFeatured,
      deadline,
    } = req.body;

    // Get employer rating stats
    const { TaskReview } = await import("../models/taskReview");
    const reviews = await TaskReview.find({
      reviewedId: employer._id,
      reviewType: "student_to_employer",
      isVisible: true,
    });
    const averageRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.starRating, 0) / reviews.length) * 10) / 10
        : 0;
    const completedJobsCount = await Internship.countDocuments({
      employerId: employer._id,
      status: "completed",
    });

    // 3. Create internship (companyName + employerId + employerRating injected)
    const internship = await Internship.create({
      title,
      location,
      duration,
      gold, // Changed from budget to gold
      description,
      skills,
      tags,
      bannerUrl,
      priorityLevel,
      isFeatured,
      deadline,

      employerId: employer._id,
      companyName: employer.companyName,
      employerRating: averageRating,
      employerCompletedJobs: completedJobsCount,
    });

    return res.status(201).json({ success: true, data: internship });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      message: "Failed to create internship",
    });
  }
});

/**
 * PUT /api/internships/:id
 * employer can edit ONLY their own post
 */
router.put("/:id", requireAuth, requireEmployer, async (req, res) => {
  try {
    // Check if employer has restriction (can only post low priority jobs)
    const employer = await User.findById(req.user!.id);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    const now = new Date();
    if (employer.restrictionUntil && employer.canOnlyPostLowPriority) {
      // Check if restriction has expired
      const restrictionDate = employer.restrictionUntil instanceof Date 
        ? employer.restrictionUntil 
        : new Date(employer.restrictionUntil);
      
      if (restrictionDate <= now) {
        // Restriction expired, remove it
        employer.restrictionUntil = undefined;
        employer.canOnlyPostLowPriority = false;
        await employer.save();
      } else {
        // Still restricted - enforce low priority only
        if (req.body.priorityLevel && req.body.priorityLevel !== "low") {
          return res.status(403).json({
            success: false,
            message: `You are restricted to posting only low priority jobs until ${restrictionDate.toLocaleDateString()}. Please select "low" priority.`,
          });
        }
        // Force low priority if not specified or if trying to set a different priority
        req.body.priorityLevel = "low";
      }
    }

    const allowed = [
      "title",
      "location",
      "duration",
      "gold", // Changed from budget to gold
      "description",
      "priorityLevel",
      "skills",
      "tags",
      "bannerUrl",
      "isFeatured",
      "deadline",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const oldJob = await Internship.findById(req.params.id);
    if (!oldJob) {
      return res.status(404).json({
        success: false,
        message: "Internship not found",
      });
    }

    if (oldJob.employerId.toString() !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: "Not your job",
      });
    }

    const updated = await Internship.findOneAndUpdate(
      { _id: req.params.id, employerId: req.user!.id }, // ownership check
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Internship not found",
      });
    }

    // If student is accepted, create anomaly and notify student and admin about job changes
    if (oldJob.acceptedStudentId) {
      // Create anomaly for editing job with accepted student
      const { Anomaly } = await import("../models/anomaly");
      const { createNotification } = await import("../utils/notifications");
      
      // Check if changes were made (compare old vs new)
      const hasChanges = 
        oldJob.title !== updated.title ||
        oldJob.location !== updated.location ||
        oldJob.duration !== updated.duration ||
        oldJob.gold !== updated.gold ||
        oldJob.description !== updated.description ||
        JSON.stringify(oldJob.skills || []) !== JSON.stringify(updated.skills || []) ||
        JSON.stringify(oldJob.tags || []) !== JSON.stringify(updated.tags || []) ||
        oldJob.priorityLevel !== updated.priorityLevel ||
        (oldJob.deadline?.toString() || "") !== (updated.deadline?.toString() || "");

      if (hasChanges) {
        // Build change description
        const changes: string[] = [];
        if (oldJob.title !== updated.title) changes.push(`Title: "${oldJob.title}" → "${updated.title}"`);
        if (oldJob.location !== updated.location) changes.push(`Location: "${oldJob.location}" → "${updated.location}"`);
        if (oldJob.duration !== updated.duration) changes.push(`Duration: "${oldJob.duration}" → "${updated.duration}"`);
        if (oldJob.gold !== updated.gold) changes.push(`Gold: ${oldJob.gold} → ${updated.gold}`);
        if (oldJob.description !== updated.description) changes.push(`Description changed`);
        if (JSON.stringify(oldJob.skills || []) !== JSON.stringify(updated.skills || [])) changes.push(`Skills changed`);
        if (JSON.stringify(oldJob.tags || []) !== JSON.stringify(updated.tags || [])) changes.push(`Tags changed`);
        if (oldJob.priorityLevel !== updated.priorityLevel) changes.push(`Priority: ${oldJob.priorityLevel} → ${updated.priorityLevel}`);
        if ((oldJob.deadline?.toString() || "") !== (updated.deadline?.toString() || "")) changes.push(`Deadline changed`);

        // Create anomaly
        const anomaly = await Anomaly.create({
          type: "task_stalled",
          severity: "high",
          taskId: updated._id,
          employerId: updated.employerId,
          studentId: updated.acceptedStudentId,
          description: `Employer edited job "${updated.title}" while a student is actively working on it. Job status: ${oldJob.status || "unknown"}. Changes made: ${changes.join("; ")}`,
          detectedAt: new Date(),
        });

        // Notify student
        await createNotification(
          updated.acceptedStudentId.toString(),
          "task_assigned",
          "Job Updated",
          `The job "${updated.title}" has been updated by the employer. Please review the changes.`,
          updated._id.toString(),
          req.user!.id
        );

        // Notify all admins about the anomaly
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          await createNotification(
            admin._id.toString(),
            "anomaly_detected",
            "Job Edited with Active Student",
            `Job "${updated.title}" was edited by employer while a student is working on it. Changes: ${changes.join("; ")}. Anomaly created for review.`,
            updated._id.toString(),
            req.user!.id,
            { anomalyId: anomaly._id.toString() }
          );
        }
      }
    }

    // updatedAt auto-changes here
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      message: "Failed to update internship",
    });
  }
});

/**
 * DEBUG / helper: list all internships
 * GET /api/internships
 * Lets us see exactly what IDs the backend can find.
 */
router.get("/", async (req, res) => {
  try {
    // Build filter query
    const filter: any = {};
    
    // Status filter
    if (req.query.status && req.query.status !== "") {
      filter.status = req.query.status;
    }
    // If no status filter, show all (including cancelled)
    
    // Priority level filter
    if (req.query.priorityLevel && req.query.priorityLevel !== "") {
      filter.priorityLevel = req.query.priorityLevel;
    }
    
    const items = await Internship.find(filter)
      .populate("employerId", "name email companyName")
      .sort({ createdAt: -1 })
      .lean();

    // For each internship, ensure employer rating is up-to-date
    const { TaskReview } = await import("../models/taskReview");
    const enrichedInternships = await Promise.all(
      items.map(async (internship: any) => {
        const employerId = internship.employerId?._id || internship.employerId;
        if (!employerId) return internship;

        // Calculate rating if not set
        const reviews = await TaskReview.find({
          reviewedId: employerId,
          reviewType: "student_to_employer",
          isVisible: true,
        });
        const averageRating =
          reviews.length > 0
            ? Math.round((reviews.reduce((sum: number, r: any) => sum + r.starRating, 0) / reviews.length) * 10) / 10
            : 0;
        const completedJobsCount = await Internship.countDocuments({
          employerId: employerId,
          status: "completed",
        });
        
        // Update the internship document if rating changed
        if (internship.employerRating !== averageRating || internship.employerCompletedJobs !== completedJobsCount) {
          await Internship.findByIdAndUpdate(internship._id, {
            employerRating: averageRating,
            employerCompletedJobs: completedJobsCount,
          });
        }
        
        return {
          ...internship,
          employerRating: averageRating,
          employerCompletedJobs: completedJobsCount,
        };
      })
    );

    res.json({ success: true, data: enrichedInternships });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * DELETE /api/internships/delete-all
 * Delete all internships (for resetting with new structure)
 * WARNING: Admin only or use with caution
 */
router.delete("/delete-all", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }
    const result = await Internship.deleteMany({});
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} internships`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete internships" });
  }
});

/**
 * F2-3: Apply for Internship
 * POST /api/internships/:id/apply
 * Triggered by "Apply Now" button on details page.
 * NOTE: This is kept for backward compatibility, but the main application flow
 * is now handled in /api/applications
 */
router.post("/:id/apply", async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res
        .status(404)
        .json({ success: false, message: "Internship not found" });
    }

    const application = await Application.create({
      internshipId: internship._id,
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
      cvUrl: req.body.cvUrl
    });

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ success: false, message: "Invalid application data" });
  }
});

/**
 * F2-4: Save Internship (Save for later)
 * POST /api/internships/:id/save
 * For now we just return a success JSON; a Saved model can be added later.
 */
router.post("/:id/save", async (req, res) => {
  res.status(201).json({
    success: true,
    saved: true,
    internshipId: req.params.id,
    userId: req.body?.userId ?? "demo-user"
  });
});

export default router;
