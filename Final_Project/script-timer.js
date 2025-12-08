// Timer to track database inactivity (14-day deletion if no activity)
async function loadExpirationProgress() {
  try {
    if (typeof supabaseClient === 'undefined') {
      console.warn('Supabase client not ready for timer');
      return;
    }

    // Fetch the latest upload_time from city_images table
    const { data, error } = await supabaseClient
      .from('city_images')
      .select('upload_time')
      .order('upload_time', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Failed to fetch latest upload_time:', error);
      document.getElementById('expiry-label').innerText = 'Unable to fetch DB status';
      return;
    }

    if (!data || data.length === 0) {
      // No uploads yet; use current time as baseline
      const now = Date.now();
      const fourteenDays = 14 * 24 * 60 * 60 * 1000;
      document.getElementById('expiry-fill').style.width = '0%';
      document.getElementById('expiry-label').innerText = '14.0 days before DB deletion';
      return;
    }

    const lastActivityIso = data[0].upload_time;
    const lastActivity = new Date(lastActivityIso).getTime();
    const now = Date.now();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    const elapsed = now - lastActivity;
    const percent = Math.min(100, (elapsed / fourteenDays) * 100);

    // Update progress bar
    document.getElementById('expiry-fill').style.width = percent + '%';

    // Update label
    const daysLeft = (fourteenDays - elapsed) / (24 * 60 * 60 * 1000);
    let labelText = `${daysLeft.toFixed(1)} days left before deletion`;
    if (daysLeft <= 0) {
      labelText = '⚠ Database is deleted!';
    }

    document.getElementById('expiry-label').innerText = labelText;
  } catch (err) {
    console.error('Error in loadExpirationProgress:', err);
    document.getElementById('expiry-label').innerText = '⚠ Error';
  }
}

// Refresh every 60 seconds
setInterval(loadExpirationProgress, 60000);
// Load once on startup
document.addEventListener('DOMContentLoaded', loadExpirationProgress);