// Helper function to build filter query
const buildFilterQuery = (req) => {
  const filter = {};
  
  // Filter by status
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // Filter by priority
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }
  
  // Filter by due date
  if (req.query.dueDateBefore) {
    filter.dueDate = { ...filter.dueDate, $lte: new Date(req.query.dueDateBefore) };
  }
  
  if (req.query.dueDateAfter) {
    filter.dueDate = { ...filter.dueDate, $gte: new Date(req.query.dueDateAfter) };
  }
  
  return filter;
};

module.exports = { buildFilterQuery };
