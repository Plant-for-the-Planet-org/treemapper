export function sortProjects(pData) {
  // Define role priority mapping (lower number = higher priority)
  const rolePriority = {
    'owner': 1,
    'admin': 2,
    'contributor': 3,
    'viewer': 4,
    'member': 5
  };

  // Extract the projects array from the response
  const projects = pData || [];

  // Sort the projects
  const sortedProjects = projects.sort((a, b) => {
    // First, sort by role priority
    const roleA = rolePriority[a.userRole.toLowerCase()] || 999;
    const roleB = rolePriority[b.userRole.toLowerCase()] || 999;
    
    if (roleA !== roleB) {
      return roleA - roleB; // Lower priority number comes first
    }
    
    // If roles are the same, sort by creation date (newest first)
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime(); // Newest first
  });

  // Return the sorted data in the same structure
  return sortedProjects
}