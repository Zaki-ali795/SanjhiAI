/**
 * src/services/index.js — Barrel export for all API services.
 *
 * Usage in components:
 *   import { authService, committeeService } from '../services';
 *   const user = await authService.getProfile();
 *
 * Or import individual functions:
 *   import { sendOTP, getMyCommittees } from '../services';
 */

export { default as api, setToken, clearToken } from '../api';

export * as authService from './authService';
export * as assistantService from './assistantService';
export * as dashboardService from './dashboardService';
export * as committeeService from './committeeService';
export * as memberService from './memberService';
export * as paymentService from './paymentService';
export * as supportService from './supportService';
export * as notificationService from './notificationService';
export * as adminService from './adminService';

