export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return "";
  if (dateString.toLowerCase().includes('ago') || dateString.toLowerCase().includes('just now')) {
    return dateString;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString; // fallback
  }
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};
