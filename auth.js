import { supabase } from './supabase.js';

// Global State
let currentPredictions = [];
let currentCategoryFilter = null;

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

// Check initial session
supabase.auth.getSession().then(({ data: { session } }) => {
    updateUI(session?.user ?? null);
    if (session?.user) {
        loadPredictions();
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
