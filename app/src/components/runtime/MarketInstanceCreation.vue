<template>
  <div class="market-instance-creation">
    <div class="creation-container">
      <!-- Header -->
      <div class="creation-header">
        <h1 class="creation-title">Create Market Instance</h1>
        <p class="creation-subtitle">
          Select a template to create a new trading simulation market instance
        </p>
      </div>

      <!-- Creation Form -->
      <div v-if="!isCreating && !currentProgress" class="creation-form">
        <form @submit.prevent="handleCreateMarketInstance">
          <!-- Template Selection -->
          <div class="form-group">
            <label for="template-select" class="form-label">
              Market Instance Template
            </label>
            <select
              id="template-select"
              v-model="selectedTemplateId"
              class="form-select"
              required
              :disabled="isLoading"
            >
              <option value="">Select a template...</option>
              <option
                v-for="template in templates"
                :key="template.id"
                :value="template.id"
              >
                {{ template.name }} - {{ template.description }}
              </option>
            </select>
            <div v-if="selectedTemplate" class="template-preview">
              <div class="preview-stats">
                <div class="stat-item">
                  <span class="stat-label">Traders:</span>
                  <span class="stat-value">{{ selectedTemplate.traderCount || 'N/A' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Stocks:</span>
                  <span class="stat-value">{{ selectedTemplate.stockCount || 'N/A' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Category:</span>
                  <span class="stat-value">{{ selectedTemplate.difficulty || 'General' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Market Instance Name (Optional) -->
          <div class="form-group">
            <label for="market-instance-name" class="form-label">
              Market Instance Name (Optional)
            </label>
            <input
              id="market-instance-name"
              v-model="marketInstanceName"
              type="text"
              class="form-input"
              placeholder="Enter custom name or leave blank for auto-generated name"
              :disabled="isLoading"
            />
          </div>

          <!-- Submit Button -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn-create"
              :disabled="!selectedTemplateId || isLoading"
            >
              <span v-if="isLoading" class="btn-spinner"></span>
              {{ isLoading ? 'Loading Templates...' : 'Create Market Instance' }}
            </button>
          </div>
        </form>

        <!-- Template Loading State -->
        <div v-if="isLoading && templates.length === 0" class="loading-templates">
          <div class="loading-spinner"></div>
          <p>Loading available templates...</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="error-message">
          <div class="error-icon">⚠️</div>
          <div class="error-content">
            <div class="error-title">Failed to Load Templates</div>
            <div class="error-text">{{ error }}</div>
            <button @click="loadTemplates" class="btn-retry">
              Try Again
            </button>
          </div>
        </div>
      </div>

      <!-- Progress Tracking -->
      <div v-if="isCreating || currentProgress" class="creation-progress">
        <ProgressTracker
          :progress="currentProgress"
          :is-loading="isCreating && !currentProgress"
        />

        <!-- Cancel Button (only during creation) -->
        <div v-if="isCreating && !isCompleted" class="progress-actions">
          <button @click="cancelCreation" class="btn-cancel">
            Cancel Creation
          </button>
        </div>

        <!-- Success Actions -->
        <div v-if="isCompleted && !currentProgress?.error" class="success-actions">
          <button @click="viewMarketInstance" class="btn-primary">
            View Market Instance
          </button>
          <button @click="createAnother" class="btn-secondary">
            Create Another
          </button>
        </div>

        <!-- Error Actions -->
        <div v-if="currentProgress?.error" class="error-actions">
          <button @click="retryCreation" class="btn-retry">
            Retry Creation
          </button>
          <button @click="createAnother" class="btn-secondary">
            Start Over
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import ProgressTracker from './ProgressTracker.vue';
import { marketInstanceApi } from '../../services/marketInstanceApi';
import type { MarketTemplate, CreationProgress } from '../../types/environment';

// Router
const router = useRouter();

// Reactive state
const templates = ref<MarketTemplate[]>([]);
const selectedTemplateId = ref<string>('');
const marketInstanceName = ref<string>('');
const isLoading = ref<boolean>(false);
const isCreating = ref<boolean>(false);
const error = ref<string>('');
const currentProgress = ref<CreationProgress | null>(null);
const currentRequestId = ref<string>('');
const progressPollingInterval = ref<NodeJS.Timeout | null>(null);

// Computed properties
const selectedTemplate = computed(() => {
  return templates.value.find(t => t.id === selectedTemplateId.value);
});

const isCompleted = computed(() => {
  return currentProgress.value?.stage === 'COMPLETE';
});

// Methods
const loadTemplates = async (): Promise<void> => {
  isLoading.value = true;
  error.value = '';

  try {
    const response = await marketInstanceApi.getTemplates();
    templates.value = response;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load templates';
    console.error('Failed to load templates:', err);
  } finally {
    isLoading.value = false;
  }
};

const handleCreateMarketInstance = async (): Promise<void> => {
  if (!selectedTemplateId.value) return;

  isCreating.value = true;
  error.value = '';
  currentProgress.value = null;

  try {
    const response = await marketInstanceApi.createMarketInstance({
      templateId: selectedTemplateId.value,
      name: marketInstanceName.value || undefined
    });

    currentRequestId.value = response.requestId;
    startProgressPolling();

  } catch (err) {
    isCreating.value = false;
    error.value = err instanceof Error ? err.message : 'Failed to create market instance';
    console.error('Failed to create market instance:', err);
  }
};

const startProgressPolling = (): void => {
  if (!currentRequestId.value) return;

  // Initial progress check
  checkProgress();

  // Set up polling interval (every 1 second)
  progressPollingInterval.value = setInterval(() => {
    checkProgress();
  }, 1000);
};

const checkProgress = async (): Promise<void> => {
  if (!currentRequestId.value) return;

  try {
    const response = await marketInstanceApi.getCreationProgress(currentRequestId.value);
    currentProgress.value = response;

    // Stop polling if completed or error
    if (response.stage === 'COMPLETE' || response.error) {
      stopProgressPolling();
      isCreating.value = false;
    }

  } catch (err) {
    console.error('Failed to get progress:', err);
    
    // If progress endpoint fails, stop polling after a few attempts
    stopProgressPolling();
    isCreating.value = false;
    
    if (!currentProgress.value) {
      currentProgress.value = {
        requestId: currentRequestId.value,
        stage: 'ERROR',
        percentage: 0,
        message: 'Failed to track progress',
        details: { totalTraders: 0, createdTraders: 0, totalStocks: 0, createdStocks: 0 },
        error: {
          code: 'PROGRESS_ERROR',
          message: 'Unable to retrieve progress information'
        },
        startedAt: new Date().toISOString()
      };
    }
  }
};

const stopProgressPolling = (): void => {
  if (progressPollingInterval.value) {
    clearInterval(progressPollingInterval.value);
    progressPollingInterval.value = null;
  }
};

const cancelCreation = (): void => {
  stopProgressPolling();
  isCreating.value = false;
  currentProgress.value = null;
  currentRequestId.value = '';
};

const retryCreation = (): void => {
  currentProgress.value = null;
  currentRequestId.value = '';
  handleCreateMarketInstance();
};

const createAnother = (): void => {
  // Reset form
  selectedTemplateId.value = '';
  marketInstanceName.value = '';
  currentProgress.value = null;
  currentRequestId.value = '';
  isCreating.value = false;
  error.value = '';
};

const viewMarketInstance = (): void => {
  if (currentProgress.value?.requestId) {
    // Navigate to market instance details (assuming we have the market instance ID)
    router.push(`/market-instances`);
  }
};

// Lifecycle hooks
onMounted(() => {
  loadTemplates();
});

onUnmounted(() => {
  stopProgressPolling();
});
</script>

<style scoped>
.market-instance-creation {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.creation-container {
  width: 100%;
  max-width: 800px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Header */
.creation-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  text-align: center;
}

.creation-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.creation-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

/* Form */
.creation-form {
  padding: 40px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-select,
.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  background: #ffffff;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-select:disabled,
.form-input:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

/* Template Preview */
.template-preview {
  margin-top: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.preview-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

/* Form Actions */
.form-actions {
  margin-top: 32px;
}

.btn-create {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-create:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-create:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Loading States */
.loading-templates {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error States */
.error-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
  margin-top: 16px;
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

.error-text {
  font-size: 0.875rem;
  color: #7f1d1d;
  margin-bottom: 12px;
}

/* Progress Section */
.creation-progress {
  padding: 40px;
}

.progress-actions,
.success-actions,
.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
  flex-wrap: wrap;
}

/* Buttons */
.btn-primary,
.btn-secondary,
.btn-cancel,
.btn-retry {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.btn-cancel {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-cancel:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.btn-retry {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #dbeafe;
}

.btn-retry:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

/* Responsive Design */
@media (max-width: 768px) {
  .market-instance-creation {
    padding: 16px;
  }

  .creation-header {
    padding: 24px;
  }

  .creation-title {
    font-size: 1.5rem;
  }

  .creation-subtitle {
    font-size: 1rem;
  }

  .creation-form,
  .creation-progress {
    padding: 24px;
  }

  .preview-stats {
    flex-direction: column;
    gap: 12px;
  }

  .progress-actions,
  .success-actions,
  .error-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary,
  .btn-cancel,
  .btn-retry {
    width: 100%;
  }
}
</style>