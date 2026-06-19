import LostFound from '../models/LostFound.js';

export const createReport = async (req, res) => {
  try {
    const reportData = req.body;

    const newReport = new LostFound({
      ...reportData,
      id: reportData.id || `LF${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const savedReport = await newReport.save();

    // Optionally emit socket event for real-time dashboard update
    if (req.app.get('io')) {
      req.app.get('io').emit('lostfound_created', savedReport);
    }

    res.status(201).json(savedReport);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create Lost & Found report' });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const reports = await LostFound.find().sort({ createdAt: -1 });
    res.status(200).json({ reports });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const getUserReports = async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = await LostFound.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ reports });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user reports' });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await LostFound.findOneAndUpdate(
      { id },
      { status, updatedAt: new Date().toISOString() },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('lostfound_updated', report);
    }

    res.status(200).json(report);
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
};
