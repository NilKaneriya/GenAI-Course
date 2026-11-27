import { vercelHandler } from '../lib/accounts.js';

// GET → saved progress, PUT { state } → save progress (Bearer token required).
export default vercelHandler('progress');
