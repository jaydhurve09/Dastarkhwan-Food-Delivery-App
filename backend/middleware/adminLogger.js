import { AdminLog } from '../models/AdminLog.js';

/**
 * Middleware to log admin actions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const adminLogger = async (req, res, next) => {
  // Skip logging for GET requests or if no admin is logged in
  if (req.method === 'GET' || !req.user) {
    return next();
  }

  // Get the admin ID from the request user
  const adminId = req.user.id;
  const action = `${req.method} ${req.originalUrl}`;
  
  // Log the action after the response is sent
  res.on('finish', async () => {
    try {
      await AdminLog.create({
        adminId,
        action,
        route: req.originalUrl,
        details: {
          method: req.method,
          params: req.params,
          query: req.query,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          // Don't log sensitive data like passwords
          body: req.body && req.body.password ? 
            { ...req.body, password: '***' } : 
            req.body
        }
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't fail the request if logging fails
    }
  });

  next();
};

export default adminLogger;
