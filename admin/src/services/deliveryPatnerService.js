import axios from "axios";

const url = 'http://localhost:5000/api'; // Adjust the URL as needed

const updateDeliveryPartner = async (id, partnerData) => {
    try {
        const response = await axios.put(`${url}/delivery-partners/${id}`, partnerData);
        return response.data;
    } catch (error) {
        console.error('Update delivery partner error:', error.response?.data?.message || error.message);
        throw error.response?.data?.message || 'Failed to update delivery partner';
    }
};

const blockDeliveryPartner = async (id) => {
    try {
        const response = await axios.put(`${url}/delivery-partners/block/${id}`);
        return response.data;
    } catch (error) {
        console.error('Block delivery partner error:', error.response?.data?.message || error.message);
        throw error.response?.data?.message || 'Failed to block delivery partner';
    }
};

const resetPassword = async (id, password) => {
    try {
        const response = await axios.post(`${url}/delivery-partners/resetpassword`, { id, password });
        return response.data;
    } catch (error) {
        console.error('Reset delivery partner password error:', error.response?.data?.message || error.message);
        throw error.response?.data?.message || 'Failed to reset delivery partner password';
    }
};

const approveDeliveryPartner = async (id) => {
    try {
        const response = await axios.put(`${url}/delivery-partners/approve/${id}`);
        return response.data;
    } catch (error) {
        console.error('Approve delivery partner error:', error.response?.data?.message || error.message);
        throw error.response?.data?.message || 'Failed to approve delivery partner';
    }
};
export { updateDeliveryPartner, blockDeliveryPartner , resetPassword , approveDeliveryPartner };
