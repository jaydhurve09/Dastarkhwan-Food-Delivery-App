import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

/**
 * Utility functions for calling Firebase Cloud Functions
 */

/**
 * Update driver position using Cloud Function
 * @param {string} orderId - The order ID
 * @param {number} latitude - Driver's latitude
 * @param {number} longitude - Driver's longitude
 * @returns {Promise} Response from the Cloud Function
 */
export const updateDriverPosition = async (orderId, latitude, longitude) => {
  try {
    const updatePosition = httpsCallable(functions, 'updateDriverPosition');
    const result = await updatePosition({ orderId, latitude, longitude });
    return result.data;
  } catch (error) {
    console.error('Error updating driver position:', error);
    throw error;
  }
};

/**
 * Get driver position using Cloud Function
 * @param {string} orderId - The order ID
 * @returns {Promise} Driver position data
 */
export const getDriverPosition = async (orderId) => {
  try {
    const getPosition = httpsCallable(functions, 'getDriverPosition');
    const result = await getPosition({ orderId });
    return result.data;
  } catch (error) {
    console.error('Error getting driver position:', error);
    throw error;
  }
};

/**
 * Mark order as prepared and notify delivery partner
 * @param {Object} orderData - Order data including orderId, deliveryPartnerId, etc.
 * @returns {Promise} Response from the Cloud Function
 */
export const markOrderPrepared = async (orderData) => {
  try {
    const markPrepared = httpsCallable(functions, 'markOrderPreparedTrigger');
    const result = await markPrepared(orderData);
    return result.data;
  } catch (error) {
    console.error('Error marking order as prepared:', error);
    throw error;
  }
};

/**
 * Assign delivery partner to order
 * @param {Object} assignmentData - Assignment data including orderId, deliveryPartnerId, etc.
 * @returns {Promise} Response from the Cloud Function
 */
export const assignDeliveryPartner = async (assignmentData) => {
  try {
    const assignPartner = httpsCallable(functions, 'assignDeliveryPartnerTrigger');
    const result = await assignPartner(assignmentData);
    return result.data;
  } catch (error) {
    console.error('Error assigning delivery partner:', error);
    throw error;
  }
};

/**
 * Send test notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise} Response from the Cloud Function
 */
export const sendTestNotification = async (notificationData) => {
  try {
    const testNotif = httpsCallable(functions, 'testNotification');
    const result = await testNotif(notificationData);
    return result.data;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};
