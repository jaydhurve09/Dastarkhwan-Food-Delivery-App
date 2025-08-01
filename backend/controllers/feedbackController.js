import Feedback from "../models/Feedback.js";
import { admin, db } from '../config/firebase.js';
const createFeedback = async (req, res) => {
    try {
        const feedbackData = req.body;
        const feedback = new Feedback(feedbackData);
        await db.collection('feedbacks').add(feedback.toFirestore());
        res.status(201).json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const sendReply = async (req, res) => {
    try {
        const { feedbackId, reply } = req.body;
        if (!feedbackId || !reply) {
            return res.status(400).json({ success: false, message: "Feedback ID and reply are required" });
        }
        const feedbackRef = db.collection('feedbacks').doc(feedbackId);
        const feedbackDoc = await feedbackRef.get();
        if (!feedbackDoc.exists) {
            return res.status(404).json({ success: false, message: "Feedback not found" });
        }
        await feedbackRef.update({ adminResponse: { comment: reply, respondedAt: new Date() } });
        res.status(200).json({ success: true, message: "Reply sent successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find();
        res.status(200).json({ success: true, data: feedbacks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateFeedback = async (req, res) => {
    try {
        const feedbackId = req.params.id;
        const feedbackData = req.body;
        const feedback = await Feedback.findByIdAndUpdate(feedbackId, feedbackData, { new: true });
        if (!feedback) {
            return res.status(404).json({ success: false, message: "Feedback not found" });
        }
        res.status(200).json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteFeedback = async (req, res) => {
    try {
        const feedbackId = req.params.id;
        const feedback = await Feedback.findByIdAndDelete(feedbackId);
        if (!feedback) {
            return res.status(404).json({ success: false, message: "Feedback not found" });
        }
        res.status(200).json({ success: true, message: "Feedback deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export { createFeedback, getFeedbacks, updateFeedback, deleteFeedback, sendReply };