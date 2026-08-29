import { TradePosition } from '../types';

/**
 * Clean initial state: Starts from 0.
 * New trades will appear here dynamically as the autonomous 5-bot fleet scans and executes entries.
 */
export const INITIAL_ACTIVE_TRADES: TradePosition[] = [];

/**
 * Clean audit history: Starts from 0.
 * Closed trades (TP, SL, Manual) will populate dynamically as they occur in real-time.
 */
export const INITIAL_AUDIT_LOGS: TradePosition[] = [];

