<template>
  <div id="app">
    <!-- Header Section -->
    <header class="header">
      <div class="header-content">
        <h1 class="title">{{ projectInfo.name || 'Stock Trading Simulator' }}</h1>
        <div class="version-info">
          <span class="version">Version {{ projectInfo.version || '1.0.0' }}</span>
          <span class="status-indicator" :class="backendStatus">
            {{ backendStatusText }}
          </span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading project information...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">Error Loading Project Information</h2>
        <p class="error-message">{{ error }}</p>
        <button @click="loadProjectInfo" class="retry-button" :disabled="retrying">
          {{ retrying ? 'Retrying...' : 'Retry' }}
        </button>
      </div>

      <!-- Success State -->
      <div v-else class="content">
        <!-- Project Description -->
        <section class="section description-section">
          <h2 class="section-title">About This Project</h2>
          <p class="description-text">{{ projectInfo.description }}</p>
        </section>

        <!-- Technologies Used -->
        <section class="section technologies-section">
          <h2 class="section-title">Technologies Used</h2>
          <div class="tech-grid">
            <div 
              v-for="tech in projectInfo.technologies" 
              :key="tech" 
              class="tech-item"
            >
              {{ tech }}
            </div>
          </div>
        </section>

        <!-- Features -->
        <section class="section features-section">
          <h2 class="section-title">Features</h2>
          <div class="features-grid">
            <div 
              v-for="feature in projectInfo.features" 
              :key="feature.name" 
              class="feature-card"
            >
              <div class="feature-header">
                <h3 class="feature-name">{{ feature.name }}</h3>
                <span class="feature-status" :class="feature.status">
                  {{ formatStatus(feature.status) }}
                </span>
              </div>
              <p class="feature-description">{{ feature.description }}</p>
            </div>
          </div>
        </section>

        <!-- Repository Link -->
        <section v-if="projectInfo.repository" class="section repository-section">
          <h2 class="section-title">Repository</h2>
          <a 
            :href="projectInfo.repository" 
            target="_blank" 
            rel="noopener noreferrer"
            class="repository-link"
          >
            <span class="link-icon">🔗</span>
            View on GitHub
            <span class="external-icon">↗</span>
          </a>
        </section>

        <!-- Project Stats -->
        <section class="section stats-section">
          <h2 class="section-title">Project Statistics</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ projectInfo.featureCount || 0 }}</span>
              <span class="stat-label">Features</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ projectInfo.technologies?.length || 0 }}</span>
              <span class="stat-label">Technologies</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ formatDate(projectInfo.createdAt) }}</span>
              <span class="stat-label">Created</span>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <p class="footer-text">
          Backend Status: 
          <span class="status-badge" :class="backendStatus">
            {{ backendStatusText }}
          </span>
        </p>
        <p class="footer-text">
          Last Updated: {{ formatTimestamp(lastUpdated) }}
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
import { projectService } from './services/projectService.js';

export default {
  name: 'App',
  data() {
    return {
      projectInfo: {},
      loading: true,
      error: null,
      retrying: false,
      backendStatus: 'checking',
      lastUpdated: null,
      refreshInterval: null
    };
  },
  computed: {
    backendStatusText() {
      const statusMap = {
        'online': 'Online',
        'offline': 'Offline',
        'checking': 'Checking...'
      };
      return statusMap[this.backendStatus] || 'Unknown';
    }
  },
  async mounted() {
    await this.initializeApp();
    this.setupPeriodicHealthCheck();
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    /**
     * Initialize the application
     */
    async initializeApp() {
      await this.checkBackendHealth();
      await this.loadProjectInfo();
    },

    /**
     * Check backend health status
     */
    async checkBackendHealth() {
      try {
        this.backendStatus = 'checking';
        const health = await projectService.healthCheck();
        this.backendStatus = health.status === 'healthy' ? 'online' : 'offline';
      } catch (error) {
        console.error('Health check failed:', error);
        this.backendStatus = 'offline';
      }
    },

    /**
     * Load project information from API
     */
    async loadProjectInfo() {
      this.loading = true;
      this.error = null;
      this.retrying = false;
      
      try {
        const response = await projectService.getProjectInfo();
        
        if (response.success) {
          this.projectInfo = response.data;
          this.lastUpdated = new Date();
          this.error = null;
        } else {
          throw new Error(response.message || 'Failed to load project information');
        }
      } catch (error) {
        this.error = error.message || 'Unable to load project information';
        console.error('Error loading project info:', error);
        
        // Update backend status if API call failed
        if (error.message.includes('Network') || error.message.includes('timeout')) {
          this.backendStatus = 'offline';
        }
      } finally {
        this.loading = false;
        this.retrying = false;
      }
    },

    /**
     * Retry loading project information
     */
    async retryLoad() {
      this.retrying = true;
      await this.checkBackendHealth();
      await this.loadProjectInfo();
    },

    /**
     * Setup periodic health check
     */
    setupPeriodicHealthCheck() {
      // Check backend health every 30 seconds
      this.refreshInterval = setInterval(async () => {
        await this.checkBackendHealth();
      }, 30000);
    },

    /**
     * Format feature status for display
     */
    formatStatus(status) {
      const statusMap = {
        'planned': 'Planned',
        'in-progress': 'In Progress',
        'completed': 'Completed'
      };
      return statusMap[status] || status;
    },

    /**
     * Format date for display
     */
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
      } catch (error) {
        return 'Invalid Date';
      }
    },

    /**
     * Format timestamp for display
     */
    formatTimestamp(date) {
      if (!date) return 'Never';
      
      try {
        return date.toLocaleString();
      } catch (error) {
        return 'Invalid Time';
      }
    }
  }
};
</script>

<style scoped>
/* Global Styles */
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header Styles */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.title {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.version-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.version {
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 500;
}

.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-indicator.online {
  background-color: #28a745;
  color: white;
}

.status-indicator.offline {
  background-color: #dc3545;
  color: white;
}

.status-indicator.checking {
  background-color: #ffc107;
  color: #212529;
}

/* Main Content */
.main {
  flex: 1;
  margin-bottom: 2rem;
}

/* Loading Styles */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1.125rem;
  color: #6c757d;
  margin: 0;
}

/* Error Styles */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  color: #dc3545;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.error-message {
  color: #6c757d;
  margin: 0 0 2rem 0;
  font-size: 1rem;
}

.retry-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.retry-button:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-1px);
}

.retry-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Content Sections */
.section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

.section:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.section-title {
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

/* Description Section */
.description-text {
  font-size: 1.125rem;
  line-height: 1.7;
  color: #495057;
  margin: 0;
}

/* Technologies Section */
.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.tech-item {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 0.875rem;
  transition: transform 0.2s ease;
}

.tech-item:hover {
  transform: translateY(-2px);
}

/* Features Section */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.feature-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.feature-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.feature-name {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.feature-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.feature-status.planned {
  background: #fff3cd;
  color: #856404;
}

.feature-status.in-progress {
  background: #cce5ff;
  color: #004085;
}

.feature-status.completed {
  background: #d4edda;
  color: #155724;
}

.feature-description {
  margin: 0;
  color: #6c757d;
  line-height: 1.6;
}

/* Repository Section */
.repository-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #2c3e50;
  color: white;
  padding: 1rem 1.5rem;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.repository-link:hover {
  background: #34495e;
  transform: translateY(-2px);
  color: white;
}

.link-icon,
.external-icon {
  font-size: 1rem;
}

/* Stats Section */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Footer */
.footer {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-text {
  margin: 0;
  color: #6c757d;
  font-size: 0.875rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.status-badge.online {
  background: #d4edda;
  color: #155724;
}

.status-badge.offline {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.checking {
  background: #fff3cd;
  color: #856404;
}

/* Responsive Design */
@media (max-width: 768px) {
  #app {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .version-info {
    align-items: center;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .section {
    padding: 1.5rem;
  }
  
  .tech-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.75rem;
  }
  
  .section {
    padding: 1rem;
  }
  
  .feature-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>