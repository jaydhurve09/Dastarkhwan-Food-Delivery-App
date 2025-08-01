import axios from "axios";
const url = 'http://localhost:5000/api'; // Adjust the URL as needed

const sendReply = async (feedbackId, reply) => {
  try {
    const token = localStorage.getItem('adminToken'); // Assuming you store the token in localStorage
    const response = await axios.put(
      `${url}/feedback/reply`,
      { feedbackId, reply },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('Send reply error:', error.response?.data?.message || error.message);
    throw error.response?.data?.message || 'Failed to send reply';
  }
};
const updateStatus = async (id, status) => {
  try {
    const token = localStorage.getItem('adminToken'); // Assuming you store the token in localStorage
    const response = await axios.put(
      `${url}/complaints/status/${id}`,
      { status },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('Update feedback status error:', error.response?.data?.message || error.message);
    throw error.response?.data?.message || 'Failed to update feedback status';
  }
};
export { sendReply , updateStatus };