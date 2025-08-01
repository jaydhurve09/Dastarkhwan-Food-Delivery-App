import { admin,db } from "../config/firebase.js";
import Complaints from "../models/Complaints.js";

const createComplaint = async (req, res) => {
  try {
    const complaintData = req.body;
    const complaint = new Complaints(complaintData);
    await db.collection('complaints').add(complaint.toFirestore());
    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
const getComplaints = async (req, res) => {
  try {
    const complaintsSnapshot = await db.collection('complaints').get();
    const complaints = complaintsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const updateStatus = async (req, res) => {
  const { id } = req.params;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
    }
    try {
        const complaintRef = db.collection('complaints').doc(id);
        const complaintDoc = await complaintRef.get();
        if (!complaintDoc.exists) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }
        await complaintRef.update({ status });
        res.status(200).json({ success: true, message: 'Complaint status updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }     }
    

export { createComplaint, getComplaints, updateStatus };