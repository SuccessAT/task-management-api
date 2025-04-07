// Helper function to build sort query
const buildSortQuery = (req) => {
  let sortQuery = '-createdAt'; // Default sort by creation date (newest first)
  
  if (req.query.sort) {
    // Handle predefined sort options
    switch (req.query.sort) {
      case 'dueDate':
        sortQuery = 'dueDate'; // Ascending due date (earliest first)
        break;
      case '-dueDate':
        sortQuery = '-dueDate'; // Descending due date (latest first)
        break;
      case 'priority':
        // Custom priority sort (High > Medium > Low)
        sortQuery = { 
          $function: {
            body: `function(a, b) {
              const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            }`,
            args: [],
            lang: "js"
          }
        };
        break;
      case '-priority':
        // Custom priority sort (Low > Medium > High)
        sortQuery = { 
          $function: {
            body: `function(a, b) {
              const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            }`,
            args: [],
            lang: "js"
          }
        };
        break;
      default:
        // Allow custom sort fields (comma-separated)
        sortQuery = req.query.sort.split(',').join(' ');
    }
  }
  
  return sortQuery;
};

module.exports = { buildSortQuery };
