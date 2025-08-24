// Global state
let currentTheme = 'light';
let currentWebsite = '';
let fabOpen = false;
let bookmarks = JSON.parse(localStorage.getItem('sitemetrics-bookmarks') || '[]');
let trafficChart = null;
let deviceChart = null;

// Mock data generator
const mockData = {
    generateWebsiteData(url) {
        const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const seed = this.hashCode(domain);
        
        return {
            domain,
            monthlyVisitors: this.generateNumber(seed, 50000, 50000000),
            pageViews: this.generateNumber(seed + 1, 100000, 200000000),
            bounceRate: this.generateNumber(seed + 2, 25, 85),
            avgSessionDuration: this.generateNumber(seed + 3, 120, 600),
            estimatedRevenue: this.generateNumber(seed + 4, 1000, 5000000),
            trafficSources: this.generateTrafficSources(seed),
            deviceData: this.generateDeviceData(seed),
            topCountries: this.generateCountries(seed),
            monthlyTraffic: this.generateMonthlyTraffic(seed),
            dailyTraffic: this.generateDailyTraffic(seed)
        };
    },

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    },

    generateNumber(seed, min, max) {
        const x = Math.sin(seed) * 10000;
        const random = x - Math.floor(x);
        return Math.floor(random * (max - min + 1)) + min;
    },

    generateTrafficSources(seed) {
        const sources = [
            { name: 'organic', color: '#3b82f6', basePercent: 45 },
            { name: 'direct', color: '#8b5cf6', basePercent: 25 },
            { name: 'social', color: '#10b981', basePercent: 15 },
            { name: 'paid', color: '#f59e0b', basePercent: 10 },
            { name: 'referral', color: '#ef4444', basePercent: 5 }
        ];

        return sources.map((source, index) => {
            const variance = this.generateNumber(seed + index, -10, 10);
            const percentage = Math.max(1, source.basePercent + variance);
            return {
                ...source,
                percentage,
                visits: this.generateNumber(seed + index + 10, 1000, 100000)
            };
        });
    },

    generateDeviceData(seed) {
        const devices = [
            { name: 'Desktop', color: '#3b82f6', basePercent: 55 },
            { name: 'Mobile', color: '#8b5cf6', basePercent: 35 },
            { name: 'Tablet', color: '#10b981', basePercent: 10 }
        ];

        return devices.map((device, index) => {
            const variance = this.generateNumber(seed + index, -15, 15);
            const percentage = Math.max(5, device.basePercent + variance);
            return {
                ...device,
                percentage
            };
        });
    },

    generateCountries(seed) {
        const countries = [
            { name: 'United States', flag: '🇺🇸', code: 'US' },
            { name: 'United Kingdom', flag: '🇬🇧', code: 'GB' },
            { name: 'Germany', flag: '🇩🇪', code: 'DE' },
            { name: 'France', flag: '🇫🇷', code: 'FR' },
            { name: 'Canada', flag: '🇨🇦', code: 'CA' },
            { name: 'Australia', flag: '🇦🇺', code: 'AU' },
            { name: 'Japan', flag: '🇯🇵', code: 'JP' },
            { name: 'Netherlands', flag: '🇳🇱', code: 'NL' }
        ];

        return countries.slice(0, 5).map((country, index) => ({
            ...country,
            percentage: this.generateNumber(seed + index, 5, 35),
            visits: this.generateNumber(seed + index + 20, 5000, 500000)
        }));
    },

    generateMonthlyTraffic(seed) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.map((month, index) => ({
            month,
            visitors: this.generateNumber(seed + index, 100000, 5000000),
            pageViews: this.generateNumber(seed + index + 12, 200000, 10000000)
        }));
    },

    generateDailyTraffic(seed) {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push({
                date: date.toISOString().split('T')[0],
                visitors: this.generateNumber(seed + i, 5000, 200000),
                pageViews: this.generateNumber(seed + i + 30, 10000, 400000)
            });
        }
        return days;
    }
};

// Utility functions
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatCurrency(num) {
    return '$' + formatNumber(num);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getWebsiteColor(domain) {
    const colors = [
        '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    const hash = mockData.hashCode(domain);
    return colors[hash % colors.length];
}

function showToast(title, description, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-description">${description}</div>
    `;
    
    container.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('sitemetrics-theme') || 'light';
    currentTheme = savedTheme;
    document.body.className = `${savedTheme}-theme`;
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = `${currentTheme}-theme`;
    localStorage.setItem('sitemetrics-theme', currentTheme);
    
    // Recreate charts with new theme colors
    if (trafficChart || deviceChart) {
        setTimeout(() => {
            if (currentWebsite) {
                const data = mockData.generateWebsiteData(currentWebsite);
                createCharts(data);
            }
        }, 100);
    }
}

// Navigation
function showSection(sectionId) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-testid="nav-${sectionId}"]`)?.classList.add('active');
    
    // Update sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHome() {
    showSection('home');
}

function showAnalytics() {
    showSection('analytics');
    if (currentWebsite) {
        displayAnalytics(currentWebsite);
    }
}

function showCompare() {
    showSection('compare');
    loadCompareResults();
}

function showBookmarks() {
    showSection('bookmarks');
    displayBookmarks();
}

// Search functionality
function setSearchValue(url) {
    document.getElementById('searchInput').value = url;
}

function searchWebsite() {
    const input = document.getElementById('searchInput');
    const url = input.value.trim();
    
    if (!url) {
        showToast('Error', 'Please enter a website URL', 'error');
        return;
    }
    
    // Clean up URL
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    if (!cleanUrl.includes('.')) {
        showToast('Error', 'Please enter a valid website URL', 'error');
        return;
    }
    
    currentWebsite = cleanUrl;
    displayAnalytics(cleanUrl);
    showAnalytics();
}

// Analytics display
function displayAnalytics(url) {
    const loadingElement = document.getElementById('analyticsLoading');
    const contentElement = document.getElementById('analyticsContent');
    const loadingText = document.getElementById('loadingText');
    
    // Show loading
    loadingElement.style.display = 'flex';
    contentElement.style.display = 'none';
    
    const loadingSteps = [
        'Fetching analytics data...',
        'Processing traffic metrics...',
        'Analyzing visitor patterns...',
        'Generating insights...'
    ];
    
    let stepIndex = 0;
    const loadingInterval = setInterval(() => {
        if (stepIndex < loadingSteps.length) {
            loadingText.textContent = loadingSteps[stepIndex];
            stepIndex++;
        }
    }, 800);
    
    // Simulate loading delay
    setTimeout(() => {
        clearInterval(loadingInterval);
        
        const data = mockData.generateWebsiteData(url);
        
        // Update current website display
        document.getElementById('currentWebsite').textContent = data.domain;
        
        // Update stats
        document.getElementById('monthlyVisitors').textContent = formatNumber(data.monthlyVisitors);
        document.getElementById('pageViews').textContent = formatNumber(data.pageViews);
        document.getElementById('bounceRate').textContent = data.bounceRate + '%';
        document.getElementById('estimatedRevenue').textContent = formatCurrency(data.estimatedRevenue);
        
        // Update charts and other data
        createCharts(data);
        displayTrafficSources(data.trafficSources);
        displayTopCountries(data.topCountries);
        
        // Hide loading and show content
        loadingElement.style.display = 'none';
        contentElement.style.display = 'block';
        
        showToast('Analysis Complete', `Successfully analyzed ${data.domain}`);
    }, 3000);
}

// Chart creation
function createCharts(data) {
    createTrafficChart(data);
    createDeviceChart(data);
}

function createTrafficChart(data) {
    const ctx = document.getElementById('trafficChart').getContext('2d');
    
    if (trafficChart) {
        trafficChart.destroy();
    }
    
    const isDark = currentTheme === 'dark';
    const textColor = isDark ? '#f9fafb' : '#1f2937';
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    
    trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dailyTraffic.map(d => {
                const date = new Date(d.date);
                return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            }),
            datasets: [
                {
                    label: 'Visitors',
                    data: data.dailyTraffic.map(d => d.visitors),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Page Views',
                    data: data.dailyTraffic.map(d => d.pageViews),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        usePointStyle: true
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                },
                y: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

function createDeviceChart(data) {
    const ctx = document.getElementById('deviceChart').getContext('2d');
    
    if (deviceChart) {
        deviceChart.destroy();
    }
    
    const isDark = currentTheme === 'dark';
    const textColor = isDark ? '#f9fafb' : '#1f2937';
    
    deviceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.deviceData.map(d => d.name),
            datasets: [{
                data: data.deviceData.map(d => d.percentage),
                backgroundColor: data.deviceData.map(d => d.color),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            cutout: '60%'
        }
    });
    
    // Display device stats
    const statsContainer = document.getElementById('deviceStats');
    statsContainer.innerHTML = data.deviceData.map(device => `
        <div class="device-stat">
            <div class="device-stat-info">
                <div class="device-stat-color" style="background-color: ${device.color}"></div>
                <span class="device-stat-name">${device.name}</span>
            </div>
            <span class="device-stat-percentage">${device.percentage}%</span>
        </div>
    `).join('');
}

function displayTrafficSources(sources) {
    const container = document.getElementById('trafficSources');
    container.innerHTML = sources.map(source => `
        <div class="traffic-source">
            <div class="traffic-source-info">
                <div class="traffic-source-color" style="background-color: ${source.color}"></div>
                <span class="traffic-source-name">${capitalizeFirst(source.name)}</span>
            </div>
            <div class="traffic-source-stats">
                <div class="traffic-source-percentage">${source.percentage}%</div>
                <div class="traffic-source-visits">${formatNumber(source.visits)} visits</div>
            </div>
        </div>
    `).join('');
}

function displayTopCountries(countries) {
    const container = document.getElementById('topCountries');
    container.innerHTML = countries.map(country => `
        <div class="country-item">
            <div class="country-info">
                <span class="country-flag">${country.flag}</span>
                <span class="country-name">${country.name}</span>
            </div>
            <div class="country-stats">
                <div class="country-percentage">${country.percentage}%</div>
                <div class="country-visits">${formatNumber(country.visits)} visits</div>
            </div>
        </div>
    `).join('');
}

// Comparison functionality
function compareWebsites() {
    const websiteA = document.getElementById('websiteA').value.trim();
    const websiteB = document.getElementById('websiteB').value.trim();
    const button = document.querySelector('.compare-button');
    const text = button.querySelector('.compare-text');
    const loading = button.querySelector('.compare-loading');
    
    if (!websiteA || !websiteB) {
        showToast('Error', 'Please enter both website URLs', 'error');
        return;
    }
    
    // Clean URLs
    const cleanA = websiteA.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const cleanB = websiteB.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    if (!cleanA.includes('.') || !cleanB.includes('.')) {
        showToast('Error', 'Please enter valid website URLs', 'error');
        return;
    }
    
    // Show loading
    button.disabled = true;
    text.style.display = 'none';
    loading.style.display = 'flex';
    
    setTimeout(() => {
        const dataA = mockData.generateWebsiteData(cleanA);
        const dataB = mockData.generateWebsiteData(cleanB);
        
        displayComparisonResults(dataA, dataB);
        
        // Hide loading
        button.disabled = false;
        text.style.display = 'block';
        loading.style.display = 'none';
        
        showToast('Comparison Complete', `Compared ${cleanA} vs ${cleanB}`);
    }, 2000);
}

function displayComparisonResults(dataA, dataB) {
    const container = document.getElementById('compareResults');
    container.style.display = 'grid';
    
    container.innerHTML = `
        <div class="compare-card">
            <div class="compare-header">
                <h3 class="compare-title">${dataA.domain}</h3>
                <span class="compare-label website-a">Website A</span>
            </div>
            <div class="compare-metrics">
                <div class="compare-metric">
                    <span class="compare-metric-label">Monthly Visitors</span>
                    <span class="compare-metric-value">${formatNumber(dataA.monthlyVisitors)}</span>
                </div>
                <div class="compare-metric">
                    <span class="compare-metric-label">Page Views</span>
                    <span class="compare-metric-value">${formatNumber(dataA.pageViews)}</span>
                </div>
                <div class="compare-metric">
                    <span class="compare-metric-label">Bounce Rate</span>
                    <span class="compare-metric-value">${dataA.bounceRate}%</span>
                </div>
                <div class="compare-metric">
                    <span class="compare-metric-label">Est. Revenue</span>
                    <span class="compare-metric-value">${formatCurrency(dataA.estimatedRevenue)}</span>
                </div>
            </div>
        </div>
        
        <div class="compare-card">
            <div class="compare-header">
                <h3 class="compare-title">${dataB.domain}</h3>
                <span class="compare-label website-b">Website B</span>
            </div>
            <div class="compare-metrics">
                <div class="compare-metric">
                    <span class="compare-metric-label">Monthly Visitors</span>
                    <span class="compare-metric-value">${formatNumber(dataB.monthlyVisitors)}</span>
                </div>
                <div class="compare-metric">
                    <span class="compare-metric-label">Page Views</span>
                    <span class="compare-metric-value">${formatNumber(dataB.pageViews)}</span>
                </div>
                <div class="compare-metric">
                    <span class="compare-metric-label">Bounce Rate</span>
                    <span class="compare-metric-value">${dataB.bounceRate}%</span>
                </div>
                <div class="compare-metric">
                    <span class="compare-metric-label">Est. Revenue</span>
                    <span class="compare-metric-value">${formatCurrency(dataB.estimatedRevenue)}</span>
                </div>
            </div>
        </div>
    `;
}

function loadCompareResults() {
    // Keep existing results if any
}

// Bookmarks functionality
function displayBookmarks() {
    const container = document.getElementById('bookmarksContent');
    
    if (bookmarks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i data-lucide="bookmark"></i>
                </div>
                <h3>No Bookmarks Yet</h3>
                <p>Start by searching for a website and bookmark it to keep track of its analytics.</p>
                <button onclick="showHome()">
                    <i data-lucide="search"></i>
                    Search Websites
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    container.innerHTML = `
        <div class="bookmarks-grid">
            ${bookmarks.map(bookmark => `
                <div class="bookmark-card" data-testid="bookmark-${bookmark.domain}">
                    <div class="bookmark-header">
                        <div class="bookmark-info">
                            <div class="bookmark-avatar" style="background: ${getWebsiteColor(bookmark.domain)}">
                                ${bookmark.domain.charAt(0).toUpperCase()}
                            </div>
                            <div class="bookmark-details">
                                <h3>${bookmark.domain}</h3>
                                <p>Saved ${new Date(bookmark.savedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button class="bookmark-delete" onclick="removeBookmark('${bookmark.domain}')" data-testid="remove-bookmark-${bookmark.domain}">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                    <div class="bookmark-stats">
                        <div class="bookmark-stat">
                            <span class="bookmark-stat-label">Monthly Visitors</span>
                            <span class="bookmark-stat-value">${formatNumber(bookmark.monthlyVisitors)}</span>
                        </div>
                        <div class="bookmark-stat">
                            <span class="bookmark-stat-label">Est. Revenue</span>
                            <span class="bookmark-stat-value">${formatCurrency(bookmark.estimatedRevenue)}</span>
                        </div>
                    </div>
                    <button class="bookmark-view" onclick="viewBookmarkAnalytics('${bookmark.domain}')" data-testid="view-analytics-${bookmark.domain}">
                        <i data-lucide="bar-chart-3"></i>
                        View Analytics
                    </button>
                </div>
            `).join('')}
        </div>
    `;
    
    lucide.createIcons();
}

function bookmarkWebsite() {
    if (!currentWebsite) {
        showToast('Error', 'Please analyze a website first', 'error');
        return;
    }
    
    // Check if already bookmarked
    if (bookmarks.find(b => b.domain === currentWebsite)) {
        showToast('Already Bookmarked', 'This website is already in your bookmarks', 'error');
        return;
    }
    
    const data = mockData.generateWebsiteData(currentWebsite);
    const bookmark = {
        domain: currentWebsite,
        monthlyVisitors: data.monthlyVisitors,
        estimatedRevenue: data.estimatedRevenue,
        savedAt: new Date().toISOString()
    };
    
    bookmarks.push(bookmark);
    localStorage.setItem('sitemetrics-bookmarks', JSON.stringify(bookmarks));
    
    showToast('Bookmarked', `Added ${currentWebsite} to your bookmarks`);
    
    // Update bookmarks display if we're on that page
    if (document.getElementById('bookmarks').classList.contains('active')) {
        displayBookmarks();
    }
}

function removeBookmark(domain) {
    bookmarks = bookmarks.filter(b => b.domain !== domain);
    localStorage.setItem('sitemetrics-bookmarks', JSON.stringify(bookmarks));
    
    showToast('Removed', `Removed ${domain} from bookmarks`);
    displayBookmarks();
}

function viewBookmarkAnalytics(domain) {
    currentWebsite = domain;
    displayAnalytics(domain);
    showAnalytics();
}

// Floating Action Button
function toggleFAB() {
    const fabContainer = document.querySelector('.fab-container');
    fabOpen = !fabOpen;
    
    if (fabOpen) {
        fabContainer.classList.add('open');
    } else {
        fabContainer.classList.remove('open');
    }
}

function sharePage() {
    if (navigator.share && currentWebsite) {
        navigator.share({
            title: `SiteMetrics - ${currentWebsite} Analytics`,
            text: `Check out the analytics for ${currentWebsite}`,
            url: window.location.href
        });
    } else {
        // Fallback to clipboard
        const url = currentWebsite ? 
            `${window.location.origin}?website=${currentWebsite}` : 
            window.location.href;
        
        navigator.clipboard.writeText(url).then(() => {
            showToast('Copied', 'Link copied to clipboard');
        }).catch(() => {
            showToast('Error', 'Unable to copy link', 'error');
        });
    }
    toggleFAB();
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toggleFAB();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initializeTheme();
    
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Add enter key support for search
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWebsite();
        }
    });
    
    // Add enter key support for comparison inputs
    document.getElementById('websiteA').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            compareWebsites();
        }
    });
    
    document.getElementById('websiteB').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            compareWebsites();
        }
    });
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const website = urlParams.get('website');
    if (website) {
        currentWebsite = website;
        displayAnalytics(website);
        showAnalytics();
    }
    
    // Close FAB when clicking outside
    document.addEventListener('click', function(e) {
        const fabContainer = document.querySelector('.fab-container');
        if (!fabContainer.contains(e.target) && fabOpen) {
            toggleFAB();
        }
    });
    
    // Chart period buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('chart-btn')) {
            // Remove active from all chart buttons
            e.target.parentNode.querySelectorAll('.chart-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add active to clicked button
            e.target.classList.add('active');
            
            // Here you could implement different time periods
            // For now, we'll just keep the same data
        }
    });
});

// Handle escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && fabOpen) {
        toggleFAB();
    }
});

// Resize handler for charts
window.addEventListener('resize', function() {
    if (trafficChart) {
        trafficChart.resize();
    }
    if (deviceChart) {
        deviceChart.resize();
    }
});