<template>
  <div class="progress-tracker">
    <div v-if="progress" class="progress-container">
      <!-- Progress Header -->
      <div class="progress-header">
        <h3 class="progress-title">{{ progressTitle }}</h3>
        <div class="progress-stage">{{ progress.stage }}</div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progress.percentage}%` }"
            :class="progressBarClass"
          ></div>
        </div>
        <div class="progress-percentage">{{ progress.percentage }}%</div>
      </div>

      <!-- Progress Message -->
      <div class="progress-message">{{ progress.message }}</div>

      <!-- Progress Details -->
      <div v-if="progress.details" class="progress-details">
        <div class="detail-row" v-if="progress.details.totalTraders">
          <span class="detail-label">AI Traders:</span>
          <span class="detail-value">
            {{ progress.details.createdTraders || 0 }} / {{ progress.details.totalTraders }}
          </span>
        </div>
        <div class="detail-row" v-if="progress.details.totalStocks">
          <span class="detail-label">Stocks:</span>
          <span class="detail-value">
            {{ progress.details.createdStocks || 0 }} / {{ progress.details.totalStocks }}
          </span>
        </div>
      </div>

      <!-- Time Estimation -->
      <div v-if="progress.estimatedTimeRemaining" class="time-estimation">
        <i class="icon-clock"></i>
        Estimated time remaining: {{ formatTime(progress.estimatedTimeRemaining) }}
      </div>

      <!-- Error State -->
      <div v-if="progress.error" class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-content">
          <div class="error-title">{{ progress.error.code }}</div>
          <div class="error-message">{{ progress.error.message }}</div>
        </div>
      </div>

      <!-- Success State -->
      <div v-if="progress.stage === 'COMPLETE' && !progress.error" class="success-state">
        <div class="success-icon">✅</div>
        <div class="success-message">Environment created successfully!</div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <div class="loading-message">Initializing environment creation...</div>
    </div>

    <!-- No Progress State -->
    <div v-else class="no-progress-state">
      <div class="no-progress-message">No progress information available</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CreationProgress } from '../../types/environment';

// Props
interface Props {
  progress?: CreationProgress | null;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  progress: null,
  isLoading: false
});

// Computed properties
const progressTitle = computed(() => {
  if (!props.progress) return 'Environment Creation';
  
  switch (props.progress.stage) {
    case 'INITIALIZING':
      return 'Initializing Environment';
    case 'READING_TEMPLATES':
      return 'Loading Templates';
    case 'CREATING_OBJECTS':
      return 'Creating Objects';
    case 'COMPLETE':
      return 'Environment Ready';
    case 'ERROR':
      return 'Creation Failed';
    default:
      return 'Environment Creation';
  }
});

const progressBarClass = computed(() => {
  if (!props.progress) return '';
  
  if (props.progress.error) return 'progress-error';
  if (props.progress.stage === 'COMPLETE') return 'progress-complete';
  return 'progress-active';
});

// Methods
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};
</script>

<style scoped>
.progress-tracker {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Progress Header */
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.progress-stage {
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Progress Bar */
.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease-in-out;
}

.progress-fill.progress-active {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.progress-fill.progress-complete {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-fill.progress-error {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.progress-percentage {
  font-weight: 600;
  color: #374151;
  min-width: 40px;
  text-align: right;
}

/* Progress Message */
.progress-message {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  padding: 8px 0;
}

/* Progress Details */
.progress-details {
  display: flex;
  gap: 24px;
  justify-content: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.detail-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

/* Time Estimation */
.time-estimation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #6b7280;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #e0f2fe;
}

.icon-clock::before {
  content: '⏱️';
}

/* Error State */
.error-state {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 4px;
}

.error-message {
  font-size: 0.875rem;
  color: #7f1d1d;
}

/* Success State */
.success-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.success-icon {
  font-size: 1.25rem;
}

.success-message {
  font-weight: 600;
  color: #059669;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-message {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
}

/* No Progress State */
.no-progress-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px;
}

.no-progress-message {
  font-size: 0.875rem;
  color: #9ca3af;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 640px) {
  .progress-tracker {
    margin: 0 16px;
    padding: 16px;
  }
  
  .progress-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .progress-details {
    flex-direction: column;
    gap: 12px;
  }
  
  .detail-row {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>