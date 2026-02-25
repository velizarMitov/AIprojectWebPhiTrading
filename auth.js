import { supabase } from './supabase.js';

// Global State
let currentPredictions = [];
let currentCategoryFilter = null;
const priceCache = {}; // { 'EUR/USD': { price: '1.0821', ts: Date.now() } }

// DOM Elements
const authModal = document.getElementById('auth-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const showLoginBtn = document.getElementById('show-login');
const showRegisterBtn = document.getElementById('show-register');
const adminPanelBtn = document.getElementById('admin-panel-btn');
const adminSection = document.getElementById('admin-section');
const adminPredictionForm = document.getElementById('admin-prediction-form');
const predictionsFeed = document.getElementById('predictions-feed');
const editModal = document.getElementById('edit-modal');
const editPredictionForm = document.getElementById('edit-prediction-form');
const closeEditModalBtn = document.getElementById('close-edit-modal');
const predictionDetails = document.getElementById('prediction-details');
const closeModalBtn = document.getElementById('close-modal');
const tabBtns = document.querySelectorAll('.tab-btn');
const authMessage = document.getElementById('auth-message');

// Open Modal
function openModal(tab = 'login') {
    authModal.classList.add('active');
    switchTab(tab);
}

// Close Modal
function closeModal() {
    authModal.classList.remove('active');
    clearMessage();
}

// Switch between Login and Register tabs
function switchTab(tab) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

// Display message
function showMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${isError ? 'error' : 'success'}`;
}

function clearMessage() {
    authMessage.textContent = '';
    authMessage.className = 'auth-message';
}

// Load and display predictions based on user tier
async function loadPredictions() {
    if (!predictionsFeed) return;

    // Get user tier from localStorage
    const userTier = localStorage.getItem('userTier');
    
    if (!userTier) {
        predictionsFeed.innerHTML = '<div class="no-predictions">Please log in to view predictions.</div>';
        return;
    }

    // Fetch all predictions from Supabase
    const { data: predictions, error } = await supabase
        .from('predictions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching predictions:', error);
        predictionsFeed.innerHTML = '<div class="no-predictions">Error loading predictions.</div>';
        return;
    }

    // Store in global state
    currentPredictions = predictions || [];

    applyFiltersAndRender();
}

// Apply tier + category filters and render — call this whenever filters change
function applyFiltersAndRender() {
    const userTier = localStorage.getItem('userTier');
    if (!userTier || !predictionsFeed) return;

    const tierHierarchy = {
        'Bronze': ['Bronze'],
        'Silver': ['Bronze', 'Silver'],
        'Gold': ['Bronze', 'Silver', 'Gold']
    };
    const allowedTiers = tierHierarchy[userTier] || ['Bronze'];

    // Apply tier filter
    let filtered = currentPredictions.filter(pred =>
        allowedTiers.includes(pred.required_tier)
    );

    // Apply category filter (if active)
    if (currentCategoryFilter) {
        filtered = filtered.filter(pred =>
            pred.category.toLowerCase() === currentCategoryFilter.toLowerCase()
        );
    }

    const isAdmin = localStorage.getItem('userRole') === 'admin';

    if (filtered.length === 0) {
        predictionsFeed.innerHTML = `<div class="no-predictions">No ${
            currentCategoryFilter ? currentCategoryFilter + ' ' : ''
        }predictions available for your tier.</div>`;
        return;
    }

    predictionsFeed.innerHTML = filtered.map(pred => {
        const date = new Date(pred.created_at);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Include image if available
        const imageHtml = pred.image_url 
            ? `<img src="${pred.image_url}" alt="${pred.asset}" class="prediction-image">` 
            : '';

        // Admin action buttons
        const adminButtons = isAdmin ? `
            <div class="prediction-actions" style="position:absolute; top:12px; right:12px; display:flex; gap:8px; z-index:2;">
                <button class="edit-btn" data-id="${pred.id}" style="padding:6px 14px; background:#00ff88; color:#050505; border:none; font-weight:700; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer;">Edit</button>
                <button class="delete-btn" data-id="${pred.id}" style="padding:6px 14px; background:#ff4444; color:#fff; border:none; font-weight:700; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer;">Delete</button>
            </div>
        ` : '';

        return `
            <div class="prediction-card" data-id="${pred.id}">
                <span class="prediction-category">${pred.category}</span>
                ${adminButtons}
                <h3 class="prediction-asset">${pred.asset}</h3>
                ${imageHtml}
                <p class="prediction-text">${pred.prediction_text}</p>
                <div class="prediction-footer">
                    <span class="prediction-tier">Tier: ${pred.required_tier}</span>
                    <span class="prediction-timestamp">${formattedDate}</span>
                </div>
            </div>
        `;
    }).join('');

    console.log(`Rendered ${filtered.length} predictions (tier: ${userTier}, category: ${currentCategoryFilter || 'all'})`);
}

// Register function
async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const selectedTier = document.getElementById('tier-select').value;

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        showMessage(error.message, true);
        console.error('Signup error:', error);
        return;
    }

    // Insert profile data into profiles table
    if (data.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ 
                id: data.user.id, 
                tier: selectedTier, 
                role: 'user' 
            }]);

        if (profileError) {
            console.error('Profile creation error:', profileError);
            showMessage('Account created but profile setup failed: ' + profileError.message, true);
        } else {
            console.log('Profile created successfully for user:', data.user.id);
            showMessage('Registration successful! Check your email to confirm.');
            registerForm.reset();
        }
    }
}

// Login function
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showMessage(error.message, true);
    } else {
        showMessage('Login successful!');
        closeModal();
        // Load predictions after successful login
        setTimeout(loadPredictions, 500);
    }
}

// Logout function
async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error.message);
    }
    // Clear localStorage
    localStorage.removeItem('userRole');
    localStorage.removeItem('userTier');
}

// Update UI based on auth state
async function updateUI(user) {
    if (user) {
        // User is logged in
        showLoginBtn.style.display = 'none';
        showRegisterBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';

        // Fetch user profile data
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, tier')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
        } else if (profile) {
            // Save to localStorage
            localStorage.setItem('userRole', profile.role);
            localStorage.setItem('userTier', profile.tier);
            
            console.log('User Role:', profile.role);
            console.log('User Tier:', profile.tier);

            // Show admin panel if user is admin
            if (profile.role === 'admin') {
                adminPanelBtn.style.display = 'inline-block';
                adminSection.style.display = 'block';
            } else {
                adminPanelBtn.style.display = 'none';
                adminSection.style.display = 'none';
            }
        }
    } else {
        // User is logged out
        showLoginBtn.style.display = 'inline-block';
        showRegisterBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        adminPanelBtn.style.display = 'none';
        adminSection.style.display = 'none';
        
        // Clear localStorage
        localStorage.removeItem('userRole');
        localStorage.removeItem('userTier');
    }
}

// Auth State Change Listener
supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session?.user ?? null);
    if (session?.user) {
        setTimeout(loadPredictions, 500);
    }
});

// --- NEWS SYSTEM LOGIC ---

// DOM Elements for News
const adminNewsForm = document.getElementById('admin-news-form');
const newsContentInput = document.getElementById('news-content');
const newsListContainer = document.getElementById('admin-news-list');
const newsSlider = document.getElementById('news-slider');

// Fetch and Display News in Admin Panel
async function loadAdminNews() {
    if (!newsListContainer) return;
    
    const UserRole = localStorage.getItem('userRole');
    if (UserRole !== 'admin') return;

    const { data: news, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching news for admin panel:', error);
        newsListContainer.innerHTML = '<p style="color: #ff4444;">Error loading news list</p>';
        return;
    }

    if (!news || news.length === 0) {
        newsListContainer.innerHTML = '<p style="color: #888;">No news items yet. Add some above!</p>';
        return;
    }

    newsListContainer.innerHTML = news.map(item => {
        const imagePreview = item.image_url 
            ? `<img src="${item.image_url}" style="max-height: 30px; margin-right: 10px; border-radius: 3px;">` 
            : '';
        
        return `
            <div style="background: #1a1a1a; padding: 10px; margin-bottom: 10px; border: 1px solid #333; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="display: flex; align-items: center; flex: 1;">
                    ${imagePreview}
                    <span style="color: #e0e0e0; font-size: 0.9rem;">${item.content}</span>
                </div>
                <button onclick="deleteNews('${item.id}')" style="background: #ff4444; border: none; color: white; padding: 5px 10px; cursor: pointer; border-radius: 3px; font-weight: 600;">Del</button>
            </div>
        `;
    }).join('');
}

// Global scope for delete function (for onclick)
window.deleteNews = async (id) => {
    if (!confirm('Delete this news item?')) return;
    
    const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Error deleting news');
        console.error(error);
    } else {
        loadAdminNews();
        loadNewsSlider(); // Refresh slider
    }
};

// Post News
if (adminNewsForm) {
    adminNewsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = newsContentInput.value;
        const newsImageInput = document.getElementById('news-image-input');
        const imageFile = newsImageInput ? newsImageInput.files[0] : null;

        if (!content) return;

        const submitBtn = adminNewsForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Posting...';

        try {
            let imageUrl = null;

            // Handle Image Upload
            if (imageFile) {
                submitBtn.innerHTML = 'Uploading Image...';
                const fileName = `news-${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('news-images')
                    .upload(fileName, imageFile);

                if (uploadError) throw new Error('Image upload failed: ' + uploadError.message);

                const { data: urlData } = supabase.storage
                    .from('news-images')
                    .getPublicUrl(fileName);
                
                imageUrl = urlData.publicUrl;
            }

            // Insert News Item
            const { error: insertError } = await supabase
                .from('news')
                .insert([{ 
                    content: content, 
                    image_url: imageUrl 
                }]);

            if (insertError) throw insertError;

            // Success
            newsContentInput.value = '';
            if (newsImageInput) newsImageInput.value = '';
            loadAdminNews();
            loadNewsSlider();
            alert('News posted successfully!');

        } catch (err) {
            console.error(err);
            alert(err.message || 'Error posting news');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }); // End submit listener
}

// News Slider Logic
async function loadNewsSlider() {
    console.log('🔄 loadNewsSlider called');
    
    if (!newsSlider) {
        console.error('❌ News slider element (#news-slider) not found in DOM');
        return;
    }
    
    console.log('✅ News slider element found:', newsSlider);
    
    // Initial fetch - Include both content and image_url
    const { data: newsItems, error } = await supabase
        .from('news')
        .select('content, image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log('📥 Fetched news:', newsItems);
    console.log('❓ Error:', error);

    // Handle errors or empty data
    if (error) {
        console.error('❌ Error fetching news from Supabase:', error);
        newsSlider.innerHTML = `
            <div class="news-item">
                <span class="breaking-tag">ERROR</span>
                <span class="news-content">Unable to load news feed</span>
            </div>`;
        return;
    }

    if (!newsItems || newsItems.length === 0) {
        console.warn('⚠️ No news items found in database');
        newsSlider.innerHTML = `
            <div class="news-item">
                <span class="breaking-tag">STATUS</span>
                <span class="news-content">AI Market Analysis System Online...</span>
            </div>`;
        return;
    }

    console.log(`✅ ${newsItems.length} news item(s) loaded, starting slider`);

    let currentIndex = 0;
    
    function cycleNews() {
        const item = newsItems[currentIndex];
        console.log(`🔄 Cycling to news item ${currentIndex}:`, item);
        
        // Fade out
        newsSlider.style.opacity = '0';
        newsSlider.style.transition = 'opacity 0.5s ease-in-out';
        
        setTimeout(() => {
            // Build image HTML if image_url exists
            const imageHtml = item.image_url 
                ? `<img src="${item.image_url}" alt="News" style="max-height: 35px; margin-right: 10px; border-radius: 3px; vertical-align: middle;">` 
                : '';
            
            // Update content
            newsSlider.innerHTML = `
                <div class="news-item">
                    <span class="breaking-tag">BREAKING</span>
                    ${imageHtml}
                    <span class="news-content">${item.content}</span>
                </div>
            `;
            
            // Fade in
            newsSlider.style.opacity = '1';
            
            // Increment index (loop back to 0 if at end)
            currentIndex = (currentIndex + 1) % newsItems.length;
        }, 500); // Wait for fade out
    }

    // Start cycle immediately
    cycleNews();
    
    // Only set interval if there's more than 1 item
    if (newsItems.length > 1) {
        setInterval(cycleNews, 5000);
        console.log('✅ Auto-cycle enabled (5s interval)');
    } else {
        console.log('ℹ️ Only 1 news item, auto-cycle disabled');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadNewsSlider();
    // Admin list is loaded when admin panel is shown or page loads if admin
    if (localStorage.getItem('userRole') === 'admin') {
        loadAdminNews();
    }
});

// Event Listeners
showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('login');
});

showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('register');
});

closeModalBtn.addEventListener('click', closeModal);

authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        closeModal();
    }
});

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
logoutBtn.addEventListener('click', handleLogout);

// Category nav links — filter predictions without re-fetching
document.querySelectorAll('[data-category]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = link.getAttribute('data-category');

        // Toggle: clicking active category resets to all
        if (currentCategoryFilter === category) {
            currentCategoryFilter = null;
        } else {
            currentCategoryFilter = category;
        }

        // Update active class on nav links
        document.querySelectorAll('[data-category]').forEach(l => l.classList.remove('active'));
        if (currentCategoryFilter) link.classList.add('active');

        // Re-render with new filter (no Supabase call needed)
        applyFiltersAndRender();

        // Scroll to predictions feed
        const predictionsSection = document.getElementById('predictions-section');
        if (predictionsSection) {
            predictionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Admin Panel Button - Scroll to Admin Section
if (adminPanelBtn) {
    adminPanelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (adminSection) {
            adminSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

// Admin Prediction Form Submit
if (adminPredictionForm) {
    adminPredictionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const category = document.getElementById('prediction-category').value;
        const asset = document.getElementById('prediction-asset').value;
        const predictionText = document.getElementById('prediction-text').value;
        const requiredTier = document.getElementById('prediction-tier').value;
        const imageFile = document.getElementById('prediction-image').files[0];
        
        let imageUrl = null;
        
        // Upload image if selected
        if (imageFile) {
            try {
                // Generate unique filename
                const fileName = Date.now() + '-' + imageFile.name;
                
                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('prediction_images')
                    .upload(fileName, imageFile);
                
                if (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    alert('Error uploading image: ' + uploadError.message);
                    return;
                }
                
                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('prediction_images')
                    .getPublicUrl(fileName);
                
                imageUrl = urlData.publicUrl;
                console.log('Image uploaded successfully:', imageUrl);
            } catch (err) {
                console.error('Error during image upload:', err);
                alert('Error uploading image. Please try again.');
                return;
            }
        }
        
        // Insert prediction with image URL
        const { data, error } = await supabase
            .from('predictions')
            .insert([
                {
                    category: category,
                    asset: asset,
                    prediction_text: predictionText,
                    required_tier: requiredTier,
                    image_url: imageUrl
                }
            ]);
        
        if (error) {
            console.error('Error adding prediction:', error);
            alert('Error adding prediction: ' + error.message);
        } else {
            console.log('Prediction added successfully:', data);
            alert('✅ Prediction added successfully!');
            adminPredictionForm.reset();
            // Reload predictions to show the new one
            loadPredictions();
        }
    });
}

// Fetch live price from Alpha Vantage
// Supports: 'EUR/USD' (forex/crypto) or 'AAPL' (stock)
async function getAlphaVantagePrice(asset) {
    const API_KEY = '2K3F9UBFMD818I49';
    const CACHE_TTL = 60_000; // 1 minute cache

    // Return cached price if fresh
    const cached = priceCache[asset];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return { price: cached.price, fromCache: true };
    }

    let url;
    if (asset.includes('/')) {
        // Forex / Crypto pair: EUR/USD, BTC/USD
        const [from, to] = asset.split('/');
        url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${API_KEY}`;
    } else {
        // Stock / single symbol: AAPL, TSLA
        url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset}&apikey=${API_KEY}`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();

        // Rate limit hit
        if (data.Note || data.Information) {
            if (cached) return { price: cached.price, fromCache: true, rateLimited: true };
            return { price: null, rateLimited: true };
        }

        let price = null;
        if (asset.includes('/')) {
            price = data?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate'];
        } else {
            price = data?.['Global Quote']?.['05. price'];
        }

        if (price) {
            const formatted = parseFloat(price).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 5
            });
            priceCache[asset] = { price: formatted, ts: Date.now() };
            return { price: formatted, fromCache: false };
        }
        return { price: null };
    } catch (err) {
        console.error('Price fetch error:', err);
        if (cached) return { price: cached.price, fromCache: true };
        return { price: null };
    }
}

// Show full details view for a prediction — hides feed & admin, injects content
function showPredictionDetails(pred) {
    const predictionsSection = document.getElementById('predictions-section');
    const adminSectionEl = document.getElementById('admin-section');
    const heroSection = document.querySelector('.hero');

    // Hide feed, admin panel and hero
    if (predictionsSection) predictionsSection.style.display = 'none';
    if (adminSectionEl) adminSectionEl.style.display = 'none';
    if (heroSection) heroSection.style.display = 'none';

    // Tier badge class
    const tierClass = 'tier-' + pred.required_tier.toLowerCase();

    // Format date
    const date = new Date(pred.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    // Inject full markup into #prediction-details
    predictionDetails.innerHTML = `
        <div class="details-container">
            <div class="details-back-row">
                <button class="back-to-feed-btn" id="back-to-feed-btn">&larr; Back to Feed</button>
            </div>
            <div class="details-grid">
                <div class="details-left${pred.image_url ? '' : ' no-image'}">
                    ${pred.image_url ? `<img src="${pred.image_url}" alt="${pred.asset}">` : ''}
                </div>
                <div class="details-right">
                    <span class="details-category-tag">${pred.category}</span>
                    <h1 class="details-asset">${pred.asset}</h1>
                    <div id="live-price-indicator" class="live-price-indicator loading">
                        <span class="live-dot"></span>
                        <span class="live-label">FETCHING PRICE...</span>
                    </div>
                    <div class="details-meta">
                        <span class="details-tier-badge ${tierClass}">${pred.required_tier.toUpperCase()} TIER</span>
                        <span class="details-date">${formattedDate}</span>
                    </div>
                    <div class="details-divider"></div>
                    <p class="details-prediction-text">${pred.prediction_text}</p>
                </div>
            </div>
        </div>
    `;

    // Show section with fade-in animation
    predictionDetails.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch live price asynchronously and update indicator
    const indicator = document.getElementById('live-price-indicator');
    getAlphaVantagePrice(pred.asset).then(({ price, fromCache, rateLimited }) => {
        if (!indicator) return;
        if (rateLimited && !price) {
            indicator.className = 'live-price-indicator stale';
            indicator.innerHTML = `<span class="live-dot"></span><span class="live-label">UPDATING SOON...</span>`;
        } else if (price) {
            indicator.className = 'live-price-indicator' + (fromCache || rateLimited ? ' stale' : ' live');
            indicator.innerHTML = `<span class="live-dot"></span><span class="live-label">LIVE PRICE: $${price}</span>${rateLimited ? '<span class="live-note">(cached)</span>' : ''}`;
        } else {
            indicator.className = 'live-price-indicator error';
            indicator.innerHTML = `<span class="live-label">PRICE UNAVAILABLE</span>`;
        }
    });
}

// Restore the feed — hide details, show main sections
function backToFeed() {
    predictionDetails.classList.remove('active');
    predictionDetails.innerHTML = '';

    const predictionsSection = document.getElementById('predictions-section');
    if (predictionsSection) predictionsSection.style.display = '';

    const heroSection = document.querySelector('.hero');
    if (heroSection) heroSection.style.display = '';

    const isAdmin = localStorage.getItem('userRole') === 'admin';
    const adminSectionEl = document.getElementById('admin-section');
    if (adminSectionEl) adminSectionEl.style.display = isAdmin ? 'block' : 'none';

    // Scroll back to predictions
    if (predictionsSection) {
        predictionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Async function to execute the actual delete after confirmation
async function executeDelete(id) {
    const { data, error } = await supabase
        .from('predictions')
        .delete()
        .eq('id', id);

    console.log('Delete response:', error, data);

    if (error) {
        console.error('Error deleting prediction:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: error.message, background: '#121212', color: '#e0e0e0' });
    } else {
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'The prediction has been removed.', background: '#121212', color: '#e0e0e0', confirmButtonColor: '#00ff88', confirmButtonText: 'OK' });
        loadPredictions();
    }
}

// Async function to execute the edit modal population
async function executeEdit(id) {
    const prediction = currentPredictions.find(p => String(p.id) === String(id));
    console.log('Found prediction:', prediction);

    if (prediction) {
        document.getElementById('edit-prediction-id').value = prediction.id;
        document.getElementById('edit-category').value = prediction.category;
        document.getElementById('edit-asset').value = prediction.asset;
        document.getElementById('edit-text').value = prediction.prediction_text;
        document.getElementById('edit-tier').value = prediction.required_tier;
        document.getElementById('edit-image').value = '';
        const previewEl = document.getElementById('edit-current-image');
        if (prediction.image_url) {
            previewEl.innerHTML = `<img src="${prediction.image_url}" alt="current" style="max-width:100%; max-height:120px; border:1px solid #333; margin-top:4px;">`;
        } else {
            previewEl.innerHTML = '<span style="color:#666; font-size:0.85rem;">No current image</span>';
        }
        document.getElementById('edit-modal').style.display = 'flex';
    } else {
        console.error('Prediction not found in currentPredictions for id:', id);
    }
}

// Global Event Delegation — NON-async so confirm/alert are never blocked
document.body.addEventListener('click', (e) => {
    // Back to Feed button inside details view
    if (e.target.closest('#back-to-feed-btn')) {
        backToFeed();
        return;
    }

    // Image lightbox — click image in details view to enlarge
    if (e.target.closest('.details-left img')) {
        const imgEl = e.target.closest('.details-left img');
        const lightbox = document.createElement('div');
        lightbox.className = 'img-lightbox';
        lightbox.innerHTML = `<img src="${imgEl.src}" alt="${imgEl.alt}">`;
        lightbox.addEventListener('click', () => lightbox.remove());
        document.addEventListener('keydown', function escClose(ev) {
            if (ev.key === 'Escape') { lightbox.remove(); document.removeEventListener('keydown', escClose); }
        });
        document.body.appendChild(lightbox);
        return;
    }

    // Handle Edit Button Click
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        console.log('Edit clicked for ID:', id);
        console.log('currentPredictions length:', currentPredictions.length);
        executeEdit(id);
        return;
    }

    // Handle Close Edit Modal Button Click
    if (e.target.id === 'close-edit-modal') {
        document.getElementById('edit-modal').style.display = 'none';
        return;
    }

    // Handle Delete Button Click
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        Swal.fire({
            title: 'Delete Prediction?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4444',
            cancelButtonColor: '#333',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
            background: '#121212',
            color: '#e0e0e0'
        }).then((result) => {
            if (result.isConfirmed) {
                executeDelete(id);
            }
        });
        return;
    }

    // Handle Prediction Card Click — open details view (not on buttons)
    const card = e.target.closest('.prediction-card');
    if (card && !e.target.closest('.edit-btn') && !e.target.closest('.delete-btn')) {
        const id = card.getAttribute('data-id');
        if (!id) return;
        const pred = currentPredictions.find(p => String(p.id) === String(id));
        if (pred) showPredictionDetails(pred);
    }
});

// Edit Prediction Form Submit
if (editPredictionForm) {
    editPredictionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('edit-prediction-id').value;
        const category = document.getElementById('edit-category').value;
        const asset = document.getElementById('edit-asset').value;
        const predictionText = document.getElementById('edit-text').value;
        const requiredTier = document.getElementById('edit-tier').value;
        const imageFile = document.getElementById('edit-image').files[0];

        const updateData = {
            category: category,
            asset: asset,
            prediction_text: predictionText,
            required_tier: requiredTier
        };

        // Upload new image if selected
        if (imageFile) {
            const fileName = Date.now() + '-' + imageFile.name;
            const { error: uploadError } = await supabase.storage
                .from('prediction_images')
                .upload(fileName, imageFile);
            if (uploadError) {
                alert('Image upload failed: ' + uploadError.message);
                return;
            }
            const { data: urlData } = supabase.storage
                .from('prediction_images')
                .getPublicUrl(fileName);
            updateData.image_url = urlData.publicUrl;
            console.log('New image uploaded:', urlData.publicUrl);
        }

        // Update prediction
        const { data, error } = await supabase
            .from('predictions')
            .update(updateData)
            .eq('id', id);

        console.log('Update response:', error, data);

        if (error) {
            console.error('Error updating prediction:', error);
            Swal.fire({ icon: 'error', title: 'Update Failed', text: error.message, background: '#121212', color: '#e0e0e0' });
        } else {
            Swal.fire({ icon: 'success', title: 'Updated!', text: 'Prediction saved successfully.', background: '#121212', color: '#e0e0e0', confirmButtonColor: '#00ff88', confirmButtonText: 'OK' });
            document.getElementById('edit-modal').style.display = 'none';
            editPredictionForm.reset();
            loadPredictions();
        }
    });
}

// Delete Prediction
async function deletePrediction(predictionId) {
    if (!confirm('Are you sure you want to delete this prediction?')) {
        return;
    }

    console.log('Deleting prediction ID:', predictionId);

    const { data, error } = await supabase
        .from('predictions')
        .delete()
        .eq('id', predictionId);

    console.log('Delete response:', data, error);

    if (error) {
        console.error('Error deleting prediction:', error);
        alert('Error deleting prediction: ' + error.message);
    } else {
        alert('✅ Prediction deleted successfully!');
        loadPredictions();
    }
}

// Ticker functionality
async function initTicker() {
    const tickerEl = document.getElementById('forex-ticker');
    if (!tickerEl) return;
    
    // API Configurations
    const API_KEY = '2K3F9UBFMD818I49';
    const assets = [
        { from: 'EUR', to: 'USD', type: 'forex' },
        { from: 'GBP', to: 'USD', type: 'forex' },
        { from: 'BTC', to: 'USD', type: 'crypto' },
        { from: 'ETH', to: 'USD', type: 'crypto' }
    ];

    let tickerItems = [];
    
    // Live Badge HTML
    const liveBadge = `<span style='color: #fff; background: #ff4444; padding: 2px 5px; font-size: 0.6rem; border-radius: 3px; margin-right: 8px; vertical-align: middle;'>LIVE</span>`;

    try {
        for (const asset of assets) {
            let price = null;
            
            // Try to fetch live data
            try {
                const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${asset.from}&to_currency=${asset.to}&apikey=${API_KEY}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data["Realtime Currency Exchange Rate"]) {
                    price = data["Realtime Currency Exchange Rate"]["5. Exchange Rate"];
                } else if (data["Note"] || data["Information"]) {
                    console.warn(`API Limit Reached on ${asset.from}/${asset.to}`);
                }
            } catch (err) {
                console.error(`Error fetching ${asset.from}/${asset.to}`, err);
            }

            // Use fallback if live fetch failed
            if (!price) {
                // Hardcoded fallbacks for demo purposes when API limits are hit
                if (asset.from === 'EUR') price = '1.0854';
                else if (asset.from === 'GBP') price = '1.2642';
                else if (asset.from === 'BTC') price = '64231.50';
                else if (asset.from === 'ETH') price = '3450.20';
            }

            // Format the price
            let formattedRate;
            if (asset.type === 'crypto') {
                formattedRate = parseFloat(price).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            } else {
                formattedRate = parseFloat(price).toFixed(4);
            }

            tickerItems.push(`${liveBadge} ${asset.from}/${asset.to}: <span style="color:#fff">${formattedRate}</span>`);
            
            // Small delay to be gentle on the API
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch (globalErr) {
        console.error("Critical Ticker Error", globalErr);
        // Fallback checks handles inside loop now
    }

    // Join items and duplicate for infinite scroll
    const finalContent = tickerItems.join(' &nbsp;&nbsp;&nbsp;&nbsp; ');
    tickerEl.innerHTML = `<span class="ticker-item">${finalContent}</span>`.repeat(5);
}

// Start the ticker
document.addEventListener('DOMContentLoaded', () => {
    initTicker();
});


// --- RESTORED AUTH INITIALIZATION ---

// Auth State Change Listener
supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session?.user ?? null);
    if (session?.user) {
        setTimeout(loadPredictions, 500);
    }
});

// Check initial session
supabase.auth.getSession().then(({ data: { session } }) => {
    updateUI(session?.user ?? null);
    if (session?.user) {
        loadPredictions();
    }
});

