# site-matrics[index.html](https://github.com/user-attachments/files/21956505/index.html)
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SiteMetrics - Know Any Site's Traffic & Earnings</title>
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
});[script.js](https://github.com/user-attachments/files/21956509/script.js)
<meta nam/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--bg-color);
    transition: background-color 0.3s ease, color 0.3s ease;
}

/* CSS Variables for Light Theme */
.light-theme {
    --bg-color: #ffffff;
    --text-color: #1f2937;
    --text-muted: #6b7280;
    --border-color: #e5e7eb;
    --card-bg: #ffffff;
    --header-bg: #ffffff;
    --primary-color: #3b82f6;
    --primary-hover: #2563eb;
    --secondary-color: #8b5cf6;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --gradient-primary: linear-gradient(-45deg, #3b82f6, #8b5cf6, #3b82f6, #8b5cf6);
}

/* CSS Variables for Dark Theme */
.dark-theme {
    --bg-color: #111827;
    --text-color: #f9fafb;
    --text-muted: #9ca3af;
    --border-color: #374151;
    --card-bg: #1f2937;
    --header-bg: #1f2937;
    --primary-color: #3b82f6;
    --primary-hover: #2563eb;
    --secondary-color: #8b5cf6;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
    --gradient-primary: linear-gradient(-45deg, #3b82f6, #8b5cf6, #3b82f6, #8b5cf6);
}

/* Utility Classes */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.section {
    display: none;
    min-height: calc(100vh - 80px);
}

.section.active {
    display: block;
}

/* Header Styles */
.header {
    background: var(--header-bg);
    border-bottom: 1px solid var(--border-color);
    box-shadow: var(--shadow);
    position: sticky;
    top: 0;
    z-index: 100;
    transition: background-color 0.3s ease;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
}

.logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: inherit;
}

.logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
}

.logo-icon i {
    color: white;
    width: 20px;
    height: 20px;
}

.logo-text h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-color);
}

.logo-text p {
    font-size: 0.75rem;
    color: var(--text-muted);
}

.navigation {
    display: flex;
    gap: 2rem;
}

.nav-link {
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
}

.nav-link:hover,
.nav-link.active {
    color: var(--primary-color);
}

.theme-toggle {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.theme-toggle:hover {
    background: var(--border-color);
}

.theme-icon {
    width: 20px;
    height: 20px;
    display: none;
}

.light-theme .moon-icon {
    display: block;
    color: var(--text-muted);
}

.dark-theme .sun-icon {
    display: block;
    color: #f59e0b;
}

/* Hero Section */
.hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.hero-background {
    position: absolute;
    inset: 0;
    background: var(--gradient-primary);
    background-size: 400% 400%;
    animation: gradient 6s ease infinite;
}

.floating-elements {
    position: absolute;
    inset: 0;
    overflow: hidden;
}

.floating-element {
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    filter: blur(40px);
    animation: float 3s ease-in-out infinite;
}

.float-1 {
    width: 128px;
    height: 128px;
    top: 25%;
    left: 25%;
    animation-delay: 0s;
}

.float-2 {
    width: 96px;
    height: 96px;
    top: 75%;
    right: 25%;
    animation-delay: 2s;
}

.float-3 {
    width: 160px;
    height: 160px;
    top: 50%;
    left: 75%;
    animation-delay: 4s;
}

.hero-content {
    position: relative;
    z-index: 10;
    text-align: center;
    color: white;
    padding: 0 1rem;
    max-width: 800px;
    animation: slideUp 0.8s ease-out;
}

.hero-logo {
    margin-bottom: 2rem;
}

.hero-logo-icon {
    width: 96px;
    height: 96px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    box-shadow: var(--shadow-lg);
}

.hero-logo-icon i {
    width: 48px;
    height: 48px;
    color: white;
}

.hero-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 700;
    margin-bottom: 1.5rem;
    line-height: 1.1;
}

.gradient-text {
    background: linear-gradient(135deg, #ffffff, #e5e7eb);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 3rem;
    opacity: 0.9;
}

.search-container {
    max-width: 600px;
    margin: 0 auto;
}

.search-input-wrapper {
    position: relative;
    margin-bottom: 1.5rem;
}

#searchInput {
    width: 100%;
    padding: 1rem 1.5rem 1rem 1.5rem;
    padding-right: 4rem;
    font-size: 1.125rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 16px;
    color: #1f2937;
    box-shadow: var(--shadow-lg);
    transition: all 0.3s ease;
}

#searchInput:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.3);
}

.search-button {
    position: absolute;
    right: 8px;
    top: 8px;
    bottom: 8px;
    padding: 0 1.5rem;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    border: none;
    border-radius: 12px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.search-button:hover {
    transform: scale(1.02);
    box-shadow: var(--shadow-lg);
}

.search-button i {
    width: 20px;
    height: 20px;
}

.popular-sites {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
}

.popular-sites span {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
}

.popular-site {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.popular-site:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* Analytics Section */
.section-header {
    text-align: center;
    margin-bottom: 3rem;
    padding-top: 4rem;
}

.section-header h2 {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 1rem;
}

.section-header p {
    font-size: 1.125rem;
    color: var(--text-muted);
}

.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
}

.loading-spinner {
    width: 64px;
    height: 64px;
    border: 4px solid var(--border-color);
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

.loading-spinner.small {
    width: 20px;
    height: 20px;
    border-width: 2px;
    margin: 0;
}

.loading h2 {
    font-size: 1.5rem;
    color: var(--text-color);
    margin-bottom: 0.5rem;
}

.loading p {
    color: var(--text-muted);
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
}

.stat-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
}

.stat-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
}

.stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-icon.blue {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.stat-icon.purple {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.stat-icon.green {
    background: linear-gradient(135deg, #10b981, #059669);
}

.stat-icon.orange {
    background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-icon i {
    color: white;
    width: 20px;
    height: 20px;
}

.stat-change {
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.stat-change.positive {
    color: var(--success-color);
}

.stat-change.negative {
    color: var(--error-color);
}

.stat-card h3 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 0.5rem;
}

.stat-card p {
    color: var(--text-muted);
}

/* Charts Grid */
.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
}

.chart-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.chart-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
}

.chart-controls {
    display: flex;
    gap: 0.5rem;
}

.chart-btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.chart-btn.active,
.chart-btn:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.chart-container {
    height: 300px;
    position: relative;
}

/* Traffic Sources */
.traffic-sources {
    space-y: 1rem;
}

.traffic-source {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--border-color);
    border-radius: 12px;
    margin-bottom: 1rem;
}

.traffic-source-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.traffic-source-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.traffic-source-name {
    font-weight: 500;
    color: var(--text-color);
    text-transform: capitalize;
}

.traffic-source-stats {
    text-align: right;
}

.traffic-source-percentage {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
}

.traffic-source-visits {
    font-size: 0.875rem;
    color: var(--text-muted);
}

/* Device Stats */
.device-stats {
    margin-top: 1.5rem;
    space-y: 0.75rem;
}

.device-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.device-stat-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.device-stat-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.device-stat-name {
    color: var(--text-color);
}

.device-stat-percentage {
    font-weight: 600;
    color: var(--text-color);
}

/* Top Countries */
.country-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--border-color);
    border-radius: 12px;
    margin-bottom: 1rem;
}

.country-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.country-flag {
    font-size: 2rem;
}

.country-name {
    font-weight: 500;
    color: var(--text-color);
}

.country-stats {
    text-align: right;
}

.country-percentage {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
}

.country-visits {
    font-size: 0.875rem;
    color: var(--text-muted);
}

/* Compare Section */
.compare-inputs {
    background: var(--border-color);
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 3rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: end;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.input-group label {
    font-weight: 500;
    color: var(--text-color);
}

.input-group input {
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--card-bg);
    color: var(--text-color);
    transition: all 0.2s ease;
}

.input-group input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.compare-button {
    grid-column: 1 / -1;
    justify-self: center;
    padding: 0.75rem 2rem;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.compare-button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.compare-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.compare-loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.compare-results {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.compare-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
}

.compare-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.compare-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
}

.compare-label {
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
}

.compare-label.website-a {
    background: rgba(59, 130, 246, 0.1);
    color: var(--primary-color);
}

.compare-label.website-b {
    background: rgba(139, 92, 246, 0.1);
    color: var(--secondary-color);
}

.compare-metrics {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.compare-metric {
    display: flex;
    justify-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--border-color);
    border-radius: 8px;
}

.compare-metric-label {
    color: var(--text-muted);
}

.compare-metric-value {
    font-weight: 600;
    color: var(--text-color);
}

/* Bookmarks Section */
.bookmarks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.bookmark-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.bookmark-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
}

.bookmark-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.bookmark-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
}

.bookmark-avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 1.125rem;
}

.bookmark-details h3 {
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 0.25rem;
}

.bookmark-details p {
    font-size: 0.875rem;
    color: var(--text-muted);
}

.bookmark-delete {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    opacity: 0;
    transition: all 0.2s ease;
}

.bookmark-card:hover .bookmark-delete {
    opacity: 1;
}

.bookmark-delete:hover {
    color: var(--error-color);
    background: rgba(239, 68, 68, 0.1);
}

.bookmark-stats {
    margin-bottom: 1rem;
}

.bookmark-stat {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}

.bookmark-stat-label {
    color: var(--text-muted);
}

.bookmark-stat-value {
    font-weight: 500;
    color: var(--text-color);
}

.bookmark-view {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--text-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.bookmark-view:hover {
    background: var(--border-color);
}

.empty-state {
    text-align: center;
    padding: 4rem 0;
}

.empty-icon {
    width: 80px;
    height: 80px;
    background: var(--border-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
}

.empty-icon i {
    width: 32px;
    height: 32px;
    color: var(--text-muted);
}

.empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 0.5rem;
}

.empty-state p {
    color: var(--text-muted);
    margin-bottom: 1.5rem;
}

.empty-state button {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.empty-state button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

/* Floating Action Button */
.fab-container {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 1000;
}

.fab-options {
    position: absolute;
    bottom: 4rem;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.3s ease;
    pointer-events: none;
}

.fab-container.open .fab-options {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
}

.fab-option {
    width: 48px;
    height: 48px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-lg);
}

.fab-option:hover {
    background: var(--border-color);
    transform: scale(1.1);
}

.fab-option i {
    width: 20px;
    height: 20px;
    color: var(--text-color);
}

.fab-main {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-lg);
    position: relative;
}

.fab-main:hover {
    transform: scale(1.05);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.fab-icon-plus,
.fab-icon-close {
    position: absolute;
    width: 24px;
    height: 24px;
    color: white;
    transition: all 0.3s ease;
}

.fab-icon-close {
    opacity: 0;
    transform: rotate(-45deg);
}

.fab-container.open .fab-icon-plus {
    opacity: 0;
    transform: rotate(45deg);
}

.fab-container.open .fab-icon-close {
    opacity: 1;
    transform: rotate(0deg);
}

/* Toast Notifications */
.toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1001;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 400px;
}

.toast {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    box-shadow: var(--shadow-lg);
    animation: slideInRight 0.3s ease-out;
    position: relative;
}

.toast.success {
    border-color: var(--success-color);
}

.toast.error {
    border-color: var(--error-color);
}

.toast-title {
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 0.25rem;
}

.toast-description {
    font-size: 0.875rem;
    color: var(--text-muted);
}

/* Animations */
@keyframes gradient {
    0%, 100% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
}

@keyframes float {
    0%, 100% {
        transform: translateY(0px);
        opacity: 0.3;
    }
    50% {
        transform: translateY(-20px);
        opacity: 0.6;
    }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* Responsive Design */
@media (max-width: 768px) {
    .navigation {
        display: none;
    }
    
    .hero-title {
        font-size: 2.5rem;
    }
    
    .hero-subtitle {
        font-size: 1.125rem;
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
    }
    
    .charts-grid {
        grid-template-columns: 1fr;
    }
    
    .compare-inputs {
        grid-template-columns: 1fr;
    }
    
    .compare-results {
        grid-template-columns: 1fr;
    }
    
    .container {
        padding: 0 1rem;
    }
    
    .section-header h2 {
        font-size: 2rem;
    }
}

@media (max-width: 480px) {
    .hero-content {
        padding: 0 1rem;
    }
    
    .search-input-wrapper {
        margin-bottom: 1rem;
    }
    
    .popular-sites {
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    
    .fab-container {
        bottom: 1rem;
        right: 1rem;
    }
}

/* Smooth scrolling */
html {
    scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: var(--border-color);
}

::-webkit-scrollbar-thumb {
    background: var(--text-muted);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--text-color);
}[styles.css](https://github.com/user-attachments/files/21956507/styles.css)
e="description" content="Discover website analytics, traffic insights, and revenue estimates in seconds. Analyze any website's performance metrics, device usage, and geographic distribution.">
    
    <!-- Open Graph tags -->
    <meta property="og:title" content="SiteMetrics - Website Analytics Platform">
    <meta property="og:description" content="Get comprehensive insights into any website's traffic, earnings, and performance metrics">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://sitemetrics.com">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    
    <!-- Styles -->
    <link rel="stylesheet" href="styles.css">
</head>
<body class="light-theme">
    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <!-- Logo -->
                <a href="#" class="logo" onclick="showHome()">
                    <div class="logo-icon">
                        <i data-lucide="bar-chart-3"></i>
                    </div>
                    <div class="logo-text">
                        <h1>SiteMetrics</h1>
                        <p>Analytics Platform</p>
                    </div>
                </a>
                
                <!-- Navigation -->
                <nav class="navigation">
                    <a href="#" class="nav-link active" data-testid="nav-home" onclick="showHome()">Home</a>
                    <a href="#" class="nav-link" data-testid="nav-analytics" onclick="showAnalytics()">Analytics</a>
                    <a href="#" class="nav-link" data-testid="nav-compare" onclick="showCompare()">Compare</a>
                    <a href="#" class="nav-link" data-testid="nav-bookmarks" onclick="showBookmarks()">Bookmarks</a>
                </nav>
                
                <!-- Theme Toggle -->
                <button class="theme-toggle" data-testid="theme-toggle" onclick="toggleTheme()">
                    <i data-lucide="moon" class="theme-icon moon-icon"></i>
                    <i data-lucide="sun" class="theme-icon sun-icon"></i>
                </button>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main id="main-content">
        <!-- Home Section -->
        <section id="home" class="section active">
            <div class="hero">
                <div class="hero-background"></div>
                <div class="floating-elements">
                    <div class="floating-element float-1"></div>
                    <div class="floating-element float-2"></div>
                    <div class="floating-element float-3"></div>
                </div>
                
                <div class="hero-content">
                    <div class="hero-logo">
                        <div class="hero-logo-icon">
                            <i data-lucide="bar-chart-3"></i>
                        </div>
                    </div>
                    
                    <h1 class="hero-title">
                        Know Any Site's<br>
                        <span class="gradient-text">Traffic & Earnings</span>
                    </h1>
                    
                    <p class="hero-subtitle">
                        Discover website analytics, traffic insights, and revenue estimates in seconds
                    </p>
                    
                    <div class="search-container">
                        <div class="search-input-wrapper">
                            <input 
                                type="url" 
                                id="searchInput" 
                                placeholder="Enter website URL (e.g., example.com)"
                                data-testid="search-input"
                            >
                            <button class="search-button" data-testid="search-button" onclick="searchWebsite()">
                                <i data-lucide="search"></i>
                            </button>
                        </div>
                        
                        <div class="popular-sites">
                            <span>Try:</span>
                            <button class="popular-site" data-testid="example-google.com" onclick="setSearchValue('google.com')">google.com</button>
                            <button class="popular-site" data-testid="example-youtube.com" onclick="setSearchValue('youtube.com')">youtube.com</button>
                            <button class="popular-site" data-testid="example-github.com" onclick="setSearchValue('github.com')">github.com</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Analytics Section -->
        <section id="analytics" class="section">
            <div class="container">
                <div class="loading" id="analyticsLoading" style="display: none;">
                    <div class="loading-spinner"></div>
                    <h2>Analyzing Website</h2>
                    <p id="loadingText">Fetching analytics data...</p>
                </div>
                
                <div id="analyticsContent" style="display: none;">
                    <div class="section-header">
                        <h2>Website Analytics Dashboard</h2>
                        <p>Comprehensive insights for <span id="currentWebsite" data-testid="current-website"></span></p>
                    </div>
                    
                    <!-- Stats Cards -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-header">
                                <div class="stat-icon blue">
                                    <i data-lucide="users"></i>
                                </div>
                                <span class="stat-change positive">+12.5%</span>
                            </div>
                            <h3 id="monthlyVisitors" data-testid="stat-monthly-visitors">0</h3>
                            <p>Monthly Visitors</p>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-header">
                                <div class="stat-icon purple">
                                    <i data-lucide="eye"></i>
                                </div>
                                <span class="stat-change positive">+8.2%</span>
                            </div>
                            <h3 id="pageViews" data-testid="stat-page-views">0</h3>
                            <p>Page Views</p>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-header">
                                <div class="stat-icon green">
                                    <i data-lucide="trending-up"></i>
                                </div>
                                <span class="stat-change negative">+2.1%</span>
                            </div>
                            <h3 id="bounceRate" data-testid="stat-bounce-rate">0%</h3>
                            <p>Bounce Rate</p>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-header">
                                <div class="stat-icon orange">
                                    <i data-lucide="dollar-sign"></i>
                                </div>
                                <span class="stat-change positive">+15.7%</span>
                            </div>
                            <h3 id="estimatedRevenue" data-testid="stat-est.-monthly-revenue">$0</h3>
                            <p>Est. Monthly Revenue</p>
                        </div>
                    </div>
                    
                    <!-- Charts Grid -->
                    <div class="charts-grid">
                        <!-- Traffic Chart -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3>Traffic Overview</h3>
                                <div class="chart-controls">
                                    <button class="chart-btn active" data-testid="chart-period-30d">30D</button>
                                    <button class="chart-btn" data-testid="chart-period-90d">90D</button>
                                </div>
                            </div>
                            <div class="chart-container">
                                <canvas id="trafficChart"></canvas>
                            </div>
                        </div>
                        
                        <!-- Traffic Sources -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3>Traffic Sources</h3>
                            </div>
                            <div id="trafficSources" class="traffic-sources">
                                <!-- Traffic sources will be populated here -->
                            </div>
                        </div>
                        
                        <!-- Device Chart -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3>Device Split</h3>
                            </div>
                            <div class="chart-container">
                                <canvas id="deviceChart"></canvas>
                            </div>
                            <div id="deviceStats" class="device-stats">
                                <!-- Device stats will be populated here -->
                            </div>
                        </div>
                        
                        <!-- Top Countries -->
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3>Top Countries</h3>
                            </div>
                            <div id="topCountries" class="top-countries">
                                <!-- Top countries will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Compare Section -->
        <section id="compare" class="section">
            <div class="container">
                <div class="section-header">
                    <h2>Website Comparison</h2>
                    <p>Compare traffic and performance metrics between websites</p>
                </div>
                
                <div class="compare-inputs">
                    <div class="input-group">
                        <label for="websiteA">Website A</label>
                        <input type="url" id="websiteA" placeholder="Enter first website URL" data-testid="website-a-input">
                    </div>
                    <div class="input-group">
                        <label for="websiteB">Website B</label>
                        <input type="url" id="websiteB" placeholder="Enter second website URL" data-testid="website-b-input">
                    </div>
                    <button class="compare-button" data-testid="compare-button" onclick="compareWebsites()">
                        <span class="compare-text">Compare Websites</span>
                        <span class="compare-loading" style="display: none;">
                            <div class="loading-spinner small"></div>
                            Comparing...
                        </span>
                        <i data-lucide="arrow-right"></i>
                    </button>
                </div>
                
                <div id="compareResults" class="compare-results" style="display: none;">
                    <!-- Comparison results will be populated here -->
                </div>
            </div>
        </section>

        <!-- Bookmarks Section -->
        <section id="bookmarks" class="section">
            <div class="container">
                <div class="section-header">
                    <h2>Saved Websites</h2>
                    <p>Keep track of your favorite websites and their analytics</p>
                </div>
                
                <div id="bookmarksContent">
                    <!-- Bookmarks will be populated here -->
                </div>
            </div>
        </section>
    </main>

    <!-- Floating Action Button -->
    <div class="fab-container">
        <div id="fabOptions" class="fab-options">
            <button class="fab-option" data-testid="fab-share" onclick="sharePage()">
                <i data-lucide="share"></i>
            </button>
            <button class="fab-option" data-testid="fab-bookmark" onclick="bookmarkWebsite()">
                <i data-lucide="bookmark"></i>
            </button>
            <button class="fab-option" data-testid="fab-search" onclick="scrollToTop()">
                <i data-lucide="search"></i>
            </button>
        </div>
        <button class="fab-main" data-testid="fab-main" onclick="toggleFAB()">
            <i data-lucide="plus" class="fab-icon-plus"></i>
            <i data-lucide="x" class="fab-icon-close"></i>
        </button>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>

    <!-- Scripts -->
    <script src="script.js"></script>
</body>
</html>
