// src/utils/errors.ts

/**
 * Thrown when a patient is not found in the system
 */
export class PatientNotFoundError extends Error {
    constructor(message: string = 'Patient not found') {
      super(message);
      this.name = 'PatientNotFoundError';
      Object.setPrototypeOf(this, PatientNotFoundError.prototype);
    }
  }
  
  /**
   * Thrown when a user is not authorized to perform an action
   */
  export class UnauthorizedError extends Error {
    constructor(message: string = 'Unauthorized access') {
      super(message);
      this.name = 'UnauthorizedError';
      Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
  }
  
  /**
   * Thrown when validation fails for input data
   */
  export class ValidationError extends Error {
    constructor(message: string = 'Validation failed') {
      super(message);
      this.name = 'ValidationError';
      Object.setPrototypeOf(this, ValidationError.prototype);
    }
  }
  
  /**
   * Thrown when a resource is not found
   */
  export class NotFoundError extends Error {
    constructor(message: string = 'Resource not found') {
      super(message);
      this.name = 'NotFoundError';
      Object.setPrototypeOf(this, NotFoundError.prototype);
    }
  }
  