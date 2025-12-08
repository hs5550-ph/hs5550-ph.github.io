async function loadCityRankings() {
  if (!supabaseClient) {
    console.warn("Supabase not ready for rankings");
    return;
  }

  const { data, error } = await supabaseClient
    .from("city_rankings")
    .select("*")
    .order("image_count", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Ranking load error:", error);
    return;
  }

  renderCityRankings(data);
}

function renderCityRankings(cities) {
  const list = document.getElementById("ranking-list");
  if (!list) return;

  list.innerHTML = "";

  cities.forEach((row, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>#${index + 1}</strong> ${row.city}
      <span>Imgs: ${row.image_count}</span>
    `;
    list.appendChild(li);
  });
}

// Refresh rankings every 60 seconds
const refreshInterval = 60000;
setInterval(loadCityRankings, refreshInterval);

// Load once at startup
document.addEventListener("DOMContentLoaded", loadCityRankings);
