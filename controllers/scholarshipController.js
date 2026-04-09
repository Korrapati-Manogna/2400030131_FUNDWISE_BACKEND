const db = require("../config/db");

// Get all scholarships
exports.getAllScholarships = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM scholarships ORDER BY created_at DESC");
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching scholarships:", error);
        res.status(500).json({ success: false, message: "Error fetching scholarships" });
    }
};

// Create new scholarship (Admin only)
exports.createScholarship = async (req, res) => {
    const { title, amount, deadline, category, eligibility, description, match_percentage } = req.body;
    
    if (!title || !amount || !deadline) {
        return res.status(400).json({ success: false, message: "Title, amount and deadline are required" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO scholarships (title, amount, deadline, category, eligibility, description, match_percentage) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [title, amount, deadline, category, eligibility, description, match_percentage || 0]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, ...req.body } });
    } catch (error) {
        console.error("Error creating scholarship:", error);
        res.status(500).json({ success: false, message: "Error creating scholarship" });
    }
};

// Update scholarship (Admin only)
exports.updateScholarship = async (req, res) => {
    const { id } = req.params;
    const { title, amount, deadline, category, eligibility, description, match_percentage } = req.body;

    try {
        await db.query(
            "UPDATE scholarships SET title=?, amount=?, deadline=?, category=?, eligibility=?, description=?, match_percentage=? WHERE id=?",
            [title, amount, deadline, category, eligibility, description, match_percentage, id]
        );
        res.status(200).json({ success: true, message: "Scholarship updated successfully" });
    } catch (error) {
        console.error("Error updating scholarship:", error);
        res.status(500).json({ success: false, message: "Error updating scholarship" });
    }
};

// Delete scholarship (Admin only)
exports.deleteScholarship = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM scholarships WHERE id=?", [id]);
        res.status(200).json({ success: true, message: "Scholarship deleted successfully" });
    } catch (error) {
        console.error("Error deleting scholarship:", error);
        res.status(500).json({ success: false, message: "Error deleting scholarship" });
    }
};
