//Part 1 Setting up the 3D globe
(async () => {
  try {
    const globeContainer = document.getElementById('globe-container');

    const globe = Globe()(globeContainer)
      .globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
      .backgroundImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png');

    //https://github.com/lmfmaier/cities-json
    fetch('cities.json')
      .then(res => {
        if (!res.ok) throw new Error('Could not load cities.json (HTTP ' + res.status + ')');
        return res.json();
      })
      .then(cities => {
        const cityThreshold = 300000;
        const majorCities = cities.filter(c => c.pop > cityThreshold);
        const cityPointSizeReduction = 4000;
        globe
          .pointsData(majorCities)
          .pointLat(d => d.lat)
          .pointLng(d => d.lon)
          .pointAltitude(0.01)
          .pointRadius(d => Math.sqrt(d.pop) / cityPointSizeReduction)
          .pointColor(() => 'orange')
          .onPointClick(city => {
            console.log('Clicked city:', city.name);
            onClickCity(city);
          });
      })
      .catch(err => console.error('Error loading cities.json:', err));

  } catch (err) {
    console.error('Unexpected error in globe init:', err);
  }
})();


function onClickCity(city) {
  document.getElementById("city-name").textContent = city.name;
  document.getElementById("city-panel").classList.remove("hidden");
  // clear any previously selected image id
  const sel = document.getElementById('selected-image-id'); if (sel) sel.value = '';

  loadCityImages(city);
}

//Part 2 Opening the IndexedDB database 
const DB_NAME = "CityImages";
const DB_VERSION = 1; // Increment if you change schema

let db;
const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains("images")) {
        // Create object store with city name as key
        const store = db.createObjectStore("images", { keyPath: "storage_path" });
        // Index for city lookup
        store.createIndex("city", "city", { unique: false });
    }
};

request.onsuccess = (event) => {
    db = event.target.result;
    console.log("IndexedDB opened successfully");
};

request.onerror = (event) => {
    console.error("IndexedDB error:", event.target.errorCode);
};


//Part 3 Loading and displaying city images
//Loading the city images
function loadCityImages(city) {
  if (!db) {
    // DB not ready yet; try again shortly
    console.warn('IndexedDB not ready, retrying loadCityImages shortly');
    setTimeout(() => loadCityImages(city), 200);
    return;
  }
  const images = document.getElementById("city-images");
    // revoke previous blob URLs to avoid memory leaks
    Array.from(images.querySelectorAll('img')).forEach(i => { try { if (i.src && i.src.startsWith('blob:')) URL.revokeObjectURL(i.src); } catch(e){} });
    images.innerHTML = "";

    const transaction = db.transaction(["images"], "readonly");
    const store = transaction.objectStore("images");
    const index = store.index("city");

    const request = index.openCursor(IDBKeyRange.only(city.name));

    request.onsuccess = (event) => {
        const current = event.target.result;
        if (current) {
          const img = document.createElement("img");
          const url = URL.createObjectURL(current.value.file);
          img.src = url;
          img.alt = current.value.file.name || city.name;
          // attach the DB primary key so we can delete by id later
          img.dataset.storagePath = current.value.storage_path;
          img.addEventListener('click', () => {
            // toggle selection
            const already = img.classList.contains('selected');
            document.querySelectorAll('#city-images img.selected').forEach(el => el.classList.remove('selected'));
            if (!already) {
              img.classList.add('selected');
              document.getElementById('selected-image-id').value = img.dataset.storagePath;
            } else {
              document.getElementById('selected-image-id').value = '';
            }
          });
          images.appendChild(img);
          current.continue();
        }
    };

    request.onerror = (err) => console.error("Failed to load images:", err);
}

const downloadImageButton = document.getElementById("download-image-button");

downloadImageButton.addEventListener("click", () => {
  const selectedStoragePath = document.getElementById('selected-image-id').value;

  if (!selectedStoragePath) {
    return alert("Please select an image to download");
  }

  downloadCityImage(selectedStoragePath);
});


function downloadCityImage(storagePath) {
  if (!db) return console.error("IndexedDB not ready");

  const transaction = db.transaction(["images"], "readonly");
  const store = transaction.objectStore("images");
  const getRequest = store.get(storagePath);

  getRequest.onsuccess = () => {
    const record = getRequest.result;
    if (!record || !record.file) {
      return alert("Image not found in local storage");
    }

    const file = record.file;
    const url = URL.createObjectURL(file);

    // Create temporary download link
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name || "city-image.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up memory
    URL.revokeObjectURL(url);
  };

  getRequest.onerror = (err) => {
    console.error("Failed to download image:", err);
  };
}

const uploadButton = document.getElementById("upload-image-button");
// Use the real input id from the HTML: `image-upload`.
const imageInput = document.getElementById('image-upload');

uploadButton.addEventListener('click', () => {
  const file = imageInput.files && imageInput.files[0];
  const cityName = document.getElementById('city-name').textContent;
  uploadCityImage(file, cityName);
});

function uploadCityImage(img, cityName) {
  if (!img) return alert('No image selected for upload');
  if (!cityName) return alert('No city selected for upload');
  if (!db) return console.error('IndexedDB not ready yet');

  const storagePath = `city_images/${cityName}-${Date.now()}.jpg`;

  const transaction = db.transaction(["images"], "readwrite");
  const store = transaction.objectStore("images");
  const addRequest = store.put({ file: img, city: cityName, storage_path: storagePath, upload_time: new Date().toISOString() });

  addRequest.onsuccess = () => {
    console.log('Image uploaded to local storage successfully');
    
    // Also upload to remote backend (Supabase)
    uploadToSupabase(img, cityName, storagePath);
    
    alert('Image uploaded successfully');
    imageInput.value = '';
    loadCityImages({ name: cityName }); // Reload images for the city
  };

  addRequest.onerror = (err) => console.error('Failed to upload image:', err);
}

const deleteImageButton = document.getElementById("delete-image-button");
deleteImageButton.addEventListener("click", () => {
  const selectedStoragePath = document.getElementById('selected-image-id').value;

  if (!selectedStoragePath) {
    return alert('Please select an image to delete');
  }

  deleteCityImage(selectedStoragePath); 
});

function deleteCityImage(storagePath) {
  if (!db) return console.error('IndexedDB not ready');

  const transaction = db.transaction(["images"], "readwrite");
  const store = transaction.objectStore("images");
  const deleteRequest = store.delete(storagePath);

  deleteRequest.onsuccess = () => {
    console.log('Image deleted successfully');
    alert('Image deleted successfully');
    
    const imgEl = document.querySelector(`#city-images img[data-storage-path='${storagePath}']`);
    if (imgEl) {
      try { if (imgEl.src && imgEl.src.startsWith('blob:')) URL.revokeObjectURL(imgEl.src); } catch(err){}
      imgEl.remove();
    }

    deleteSupabaseRecord(storagePath);

    document.getElementById('selected-image-id').value = '';
    const cityName = document.getElementById('city-name').textContent;
    loadCityImages({ name: cityName }); // Reload images for the city
  };

  deleteRequest.onerror = (err) => console.error('Failed to delete image:', err);
}

//Part 4 Adding Backend — Sync with Supabase
// Initialize Supabase client
const supabaseURL = "https://izwifggqwfsuclooachz.supabase.co";
const supabaseAPIKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6d2lmZ2dxd2ZzdWNsb29hY2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjgyMjAsImV4cCI6MjA4MDM0NDIyMH0.vQUAKRwQOvuUnWJRTiPdiIZZc5nmWjRQzx-8uV81b7Y";
const supabaseClient = supabase.createClient(supabaseURL, supabaseAPIKey);
let hasStartedSync = false;
startPeriodicSync();

function getLastSyncTime() {
  return localStorage.getItem("lastSupabaseSync");
}

function setLastSyncTime(timestamp) {
  localStorage.setItem("lastSupabaseSync", timestamp);
}

// Sync function: fetch only new remote data since last sync
async function fetchOnlyNewRemoteData() {
  if (!supabaseClient) {
    console.warn("Supabase not initialized yet");
    return [];
  }

  const lastSync = getLastSyncTime();
  let query = supabaseClient.from("city_images").select("*");

  if (lastSync) {
    query = query.gt("upload_time", lastSync);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Delta sync failed:", error);
    return [];
  }

  return data || [];
}

// Upsert a remote image record into local IndexedDB
async function upsertLocalRecord(record) {
  if (!db) {
    console.warn("IndexedDB not ready");
    return;
  }

  try {
    // Fetch the image from the remote URL
    const response = await fetch(record.url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    const blob = await response.blob();

    // Create a File-like object from the blob
    const file = new File([blob], record.storage_path || "image.jpg", { type: blob.type });

    const transaction = db.transaction(["images"], "readwrite");
    const store = transaction.objectStore("images");

    // Add the record
    const addRequest = store.put({
      file: file,
      city: record.city,
      upload_time: record.upload_time,
      storage_path: record.storage_path
    });

    addRequest.onsuccess = () => console.log(`Synced image for ${record.city}`);
    addRequest.onerror = (err) => console.error(`Failed to sync image for ${record.city}:`, err);
  } catch (err) {
    console.error("Error syncing image:", err);
  }
}

async function deleteSupabaseRecord(storagePath) {
  if (!supabaseClient) {
    console.warn("Supabase not initialized");
    return;
  }

  const { data, error } = await supabaseClient
    .from('city_images')
    .delete()
    .eq('storage_path', storagePath);

  if (error) {
    console.error("Failed to delete Supabase record:", error);
  } else {
    console.log("Deleted Supabase record for", storagePath, data);
  }

  const { error: storageError } = await supabaseClient
    .storage
    .from('city-images')
    .remove([storagePath]);

  if (storageError) {
    console.error("Failed to delete file from storage:", storageError);
    return;
  }
}

// Upload a local image to Supabase storage and database
async function uploadToSupabase(file, cityName, storagePath) {
  if (!supabaseClient) {
    console.warn("Supabase it not initialized");
    return;
  }

  try {
    const timestamp = new Date().toISOString();

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('city-images')
      .upload(storagePath, file, { upsert: false });

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);
    console.log(`File uploaded to storage: ${storagePath}`);

    // Get the public URL of the uploaded file
    const { data: publicUrlData } = await supabaseClient.storage
      .from('city-images')
      .getPublicUrl(storagePath);
    
    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) throw new Error('Failed to get public URL');

    // Insert record into table
    const generatedId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : null;

    const insertPayload = {
      city: cityName,
      url: publicUrl,
      storage_path: storagePath,
      upload_time: timestamp
    };
    if (generatedId) insertPayload.id = generatedId;

    const { data: dbData, error: dbError } = await supabaseClient
      .from('city_images')
      .insert([insertPayload])
      .select();

    if (dbError) {
      console.error('Database insert failed:', dbError);
      return { success: false, error: dbError };
    }
    console.log('Image record inserted to database for', cityName, dbData);

    // Update last sync time so we don't re-download our own upload
    setLastSyncTime(timestamp);

  } catch (err) {
    console.error("Error uploading to Supabase:", err);
    // Don't alert user since image was already stored locally
    console.warn("Image stored locally but failed to sync to cloud. Will retry on next sync.");
  }
}

// Main sync function: fetch and apply remote changes
async function syncOnlyIfChanged() {
  const newRows = await fetchOnlyNewRemoteData();

  if (newRows.length === 0) {
    console.log("No DB changes detected.");
    return;
  }

  console.log(`Syncing ${newRows.length} new image(s) from cloud...`);

  for (const row of newRows) {
    await upsertLocalRecord(row);
  }

  // Save latest sync time
  const newestTime = newRows.reduce((max, r) => {
    const maxTime = new Date(max);
    const rTime = new Date(r.upload_time);
    return rTime > maxTime ? r.upload_time : max;
  }, newRows[0]?.upload_time || new Date().toISOString());

  setLastSyncTime(newestTime);
  console.log(`Last sync time updated to: ${newestTime}`);

  // Refresh UI if user is viewing a city
  const activeCity = document.getElementById("city-name")?.textContent;
  if (activeCity && activeCity.trim()) {
    console.log(`Refreshing images for active city: ${activeCity}`);
    loadCityImages({ name: activeCity });
  }
}

// Periodic sync: check for backend changes every 30 seconds while browsing
function startPeriodicSync() {
  let syncInterval = 30000; // 30 seconds

  if (hasStartedSync) return; // already running

  console.log("Starting periodic sync (every 30s)");
  hasStartedSync = true;
  // Sync immediately on first call
  syncOnlyIfChanged().catch(err => console.error("Initial sync error:", err));
  
  // Then sync every 30 seconds
  syncIntervalId = setInterval(() => {
    syncOnlyIfChanged().catch(err => console.error("Periodic sync error:", err));
  }, syncInterval);
 
}

function stopPeriodicSync() {
  if (syncIntervalId) {
    console.log("Stopping periodic sync");
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

// Stop sync when user leaves
window.addEventListener("beforeunload", () => {
  stopPeriodicSync();
});




