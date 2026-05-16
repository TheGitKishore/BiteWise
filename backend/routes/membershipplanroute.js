import express from "express";
import db from "../db_sql/db.js";

const router = express.Router();

// GET all membership plans

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM membershipplan ORDER BY plan_id ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error("GET /membership-plans error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET active plans

router.get("/active", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM membershipplan WHERE is_active = 1 ORDER BY price ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error("GET /membership-plans/active error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET plan by ID

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM membershipplan WHERE plan_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("GET /membership-plans/:id error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;