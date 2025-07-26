import { validationResult } from 'express-validator';

export const validate = (validations) => {
  return async (req, res, next) => {
    console.log('\n=== [VALIDATION] Starting validation ===');
    console.log(`[VALIDATION] Path: ${req.path}`);
    console.log('[VALIDATION] Request Body:', JSON.stringify(req.body, null, 2));
    console.log(`[VALIDATION] Number of validations: ${validations.length}`);
    
    // Run all validations one by one with logging
    for (let i = 0; i < validations.length; i++) {
      const validation = validations[i];
      console.log(`\n[VALIDATION] Running validation ${i + 1}/${validations.length}`);
      
      try {
        console.log(`[VALIDATION] Running:`, validation.toString().split('\n')[0]);
        await validation.run(req);
        console.log(`[VALIDATION] Validation ${i + 1} completed`);
      } catch (err) {
        console.error(`[VALIDATION] Error in validation ${i + 1}:`, err);
        return res.status(500).json({
          success: false,
          message: 'Error during validation',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[VALIDATION] Validation failed with errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    console.log('\n[VALIDATION] All validations passed!\n');
    return next();
  };
};

export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    console.log(`[VALIDATION] Validating ${paramName} ID:`, id);
    
    if (!id || !/^[a-fA-F0-9]{1,21}$/.test(id)) {
      console.log(`[VALIDATION] Invalid ${paramName} ID format`);
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    console.log(`[VALIDATION] ${paramName} ID is valid`);
    next();
  };
};
