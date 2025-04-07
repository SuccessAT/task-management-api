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
        sortQuery = { 
          $sort: { 
            priority: { 
              $indexOfArray: [['High', 'Medium', 'Low'], '$priority'] 
            } 
          } 
        };
        break;
      case '-priority':
        sortQuery = { 
          $sort: { 
            priority: { 
              $multiply: [{ $indexOfArray: [['High', 'Medium', 'Low'], '$priority'] }, -1] 
            } 
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
