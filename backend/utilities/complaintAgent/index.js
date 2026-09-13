/**
 * index.js — Orchestrator for the Complaint Case-Builder Agent.
 *
 * Coordinates the two-agent flow:
 * 1. Investigator gathers evidence and produces case file
 * 2. Judge evaluates confidence and satisfaction
 * 3. Routes based on confidence threshold (0.85) AND Judge satisfaction
 * 4. Stores case file in complaints.ai_case_file
 * 5. Logs entire investigation to admin_action_logs
 * 6. Sends notifications (complainant or admin based on routing)
 */

import { query } from '../../config/db.js';
import { investigate } from './investigator.js';
import { judge } from './judge.js';
import { createNotification } from '../../controller/notificationController.js';

const CONFIDENCE_THRESHOLD = 0.85;

/**
 * Run the full complaint investigation flow.
 * @param {string} complaintId - UUID of the complaint to investigate
 * @returns {Promise<object>} complete case file with Judge assessment and routing decision
 */
export async function processComplaint(complaintId) {
  const startTime = Date.now();

  try {
    console.log(`[Complaint Agent] Starting investigation for complaint ${complaintId}`);

    // Step 1: Run Investigator
    console.log(`[Complaint Agent] Running Investigator...`);
    const caseFile = await investigate(complaintId);
    console.log(`[Complaint Agent] Investigator completed in ${caseFile.investigation_metadata.investigation_duration_ms}ms`);

    // Step 2: Run Judge
    console.log(`[Complaint Agent] Running Judge...`);
    const judgeAssessment = await judge(caseFile);
    console.log(`[Complaint Agent] Judge completed in ${judgeAssessment.judge_metadata.judgment_duration_ms}ms`);

    // Step 3: Combine case file with Judge assessment
    const completeCaseFile = {
      ...caseFile,
      judge_assessment: judgeAssessment,
    };

    // Step 4: Route based on confidence AND Judge satisfaction
    const routingDecision = judgeAssessment.routing_decision;
    const status = routingDecision === 'auto_respond' ? 'ai_resolved' : 'needs_human_review';

    console.log(`[Complaint Agent] Routing decision: ${routingDecision} (confidence: ${judgeAssessment.confidence_score}, satisfied: ${judgeAssessment.judge_satisfied})`);

    // Step 5: Update complaint status and store case file
    await query(
      `UPDATE complaints
       SET status = $1,
           ai_case_file = $2,
           ai_summary = $3,
           ai_suggested_priority = $4,
           user_facing_summary = $6
       WHERE id = $5`,
      [
        status,
        JSON.stringify(completeCaseFile),
        caseFile.case_summary,
        caseFile.recommended_priority,
        complaintId,
        caseFile.user_facing_summary || caseFile.case_summary,
      ]
    );

    // Step 6: Log to admin_action_logs (audit trail)
    await logAdminAction(
      null, // SYSTEM-initiated, no admin UUID
      'AI_COMPLAINT_INVESTIGATION',
      'complaint',
      complaintId,
      {
        confidence_score: judgeAssessment.confidence_score,
        judge_satisfied: judgeAssessment.judge_satisfied,
        routing_decision: routingDecision,
        recommended_action: caseFile.recommended_action,
        contradictions_count: caseFile.contradictions?.length || 0,
        evidence_count: caseFile.evidence_trail?.length || 0,
      }
    );

    // Step 7: Send notifications based on routing
    if (routingDecision === 'auto_respond') {
      // Notify complainant with auto-resolution
      const complaint = await query(
        `SELECT filed_by, accused_user_id, committee_id FROM complaints WHERE id = $1`,
        [complaintId]
      );

      if (complaint.rows.length > 0) {
        const { filed_by, accused_user_id, committee_id } = complaint.rows[0];

        // Notify complainant
        await createNotification(
          filed_by,
          'complaint_update',
          'in_app',
          caseFile.user_facing_summary || caseFile.case_summary,
          committee_id
        );

        // Notify accused
        if (accused_user_id) {
          await createNotification(
            accused_user_id,
            'complaint_update',
            'in_app',
            `A complaint filed against you has been investigated. Recommended action: ${caseFile.recommended_action}. ${caseFile.case_summary}`,
            committee_id
          );
        }
      }

      console.log(`[Complaint Agent] Auto-responded to complaint ${complaintId}`);
    } else {
      // Notify admin for human review
      const admins = await query(
        `SELECT u.id FROM users u JOIN admins a ON a.user_id = u.id WHERE u.is_suspended = false`
      );

      const complaint = await query(
        `SELECT filed_by, committee_id FROM complaints WHERE id = $1`,
        [complaintId]
      );

      if (complaint.rows.length > 0 && admins.rows.length > 0) {
        const { committee_id } = complaint.rows[0];
        const concerns = judgeAssessment.concerns || [];
        const concernsText = concerns.length > 0 ? ` Judge's concerns: ${concerns.join('; ')}` : '';

        for (const admin of admins.rows) {
          await createNotification(
            admin.id,
            'complaint_update',
            'in_app',
            `Complaint ${complaintId} needs human review. Confidence: ${(judgeAssessment.confidence_score * 100).toFixed(0)}%. Recommended action: ${caseFile.recommended_action}.${concernsText}`,
            committee_id
          );
        }
      }

      console.log(`[Complaint Agent] Flagged complaint ${complaintId} for human review`);
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[Complaint Agent] Completed processing in ${totalDuration}ms`);

    return {
      complaintId,
      caseFile: completeCaseFile,
      routingDecision,
      status,
      processingDurationMs: totalDuration,
    };
  } catch (err) {
    console.error(`[Complaint Agent] Error processing complaint ${complaintId}:`, err);

    // Log error to admin_action_logs
    await logAdminAction(
      null,
      'AI_COMPLAINT_INVESTIGATION_FAILED',
      'complaint',
      complaintId,
      {
        error: err.message,
        stack: err.stack,
      }
    );

    throw err;
  }
}

/**
 * Log an admin action to the audit log.
 * This is a simplified version of the adminController's logAdminAction.
 * @param {string|null} adminId - UUID of the admin (null for SYSTEM)
 * @param {string} actionType - Type of action
 * @param {string} targetType - Type of target entity
 * @param {string} targetId - UUID of target entity
 * @param {object} details - Additional details to log
 */
async function logAdminAction(adminId, actionType, targetType, targetId, details) {
  try {
    await query(
      `INSERT INTO admin_action_logs (admin_id, action_type, target_type, target_id, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [adminId, actionType, targetType, targetId, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Error logging admin action:', err.message);
  }
}

// Re-export the main functions for external use
export { investigate } from './investigator.js';
export { judge } from './judge.js';
export { fetchComplaintDetails, fetchPaymentLedger, fetchTrustProfiles, fetchCommitteeContext } from './tools.js';
