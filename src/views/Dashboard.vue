<template>
  <h1>User Page</h1>
  <Button label="Logout" icon="pi pi-sign-out" @click="logout" class="p-button-rounded p-button-text" />
  <AutoComplete 
    v-model="value" 
    dropdown 
    :suggestions="filteredItems" 
    @complete="search" 
    field="tagName" />
  <Button label="Create Post" @click="openDialog" />

  <Dialog
    v-model:visible="displayDialog"
    header="Create"
    :modal="true"
    class="p-fluid"
    style="width: 450px"
  >
    <div class="p-field">
      <label for="Description">Description</label>
      <InputText 
        id="Description" 
        v-model="form.description" 
        :class="{ 'p-invalid': errors.description }" 
      />
      <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
    </div>

    <div v-if="isDescriptionValid" class="p-field">
      <label for="location">Location</label>
      <InputText 
        id="location" 
        v-model="form.location" 
        :class="{ 'p-invalid': errors.location }" 
      />
      <small v-if="errors.location" class="p-error">{{ errors.location }}</small>
    </div>

    <div v-if="isLocationValid" class="p-field">
      <label for="tags">Tags</label>
      <AutoComplete 
        id="tags"
        v-model="form.tags" 
        dropdown 
        multiple
        :suggestions="filteredItems" 
        @complete="search" 
        field="tagName"
        :class="{ 'p-invalid': errors.tags }"
      />
      <small v-if="errors.tags" class="p-error">{{ errors.tags }}</small>
    </div>

    <div v-if="isTagsValid" class="p-field">
      <label for="upload">Upload Picture</label>
      <FileUpload 
        id="upload"
        mode="basic"
        name="demo[]"
        :auto="true"
        chooseLabel="Browse"
        @select="onSelectFile"
        @upload="onUpload"
        :class="{ 'p-invalid': errors.file }"
      />
      <small v-if="errors.file" class="p-error">{{ errors.file }}</small>
    </div>

    <template #footer>
      <Button label="Cancel" icon="pi pi-times" @click="displayDialog = false" class="p-button-text" />
      <Button 
        label="Save" 
        icon="pi pi-check" 
        @click="savePost" 
        :loading="loading" 
        :disabled="!isFormValid"
      />
    </template>
  </Dialog>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import AutoComplete from 'primevue/autocomplete';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import FileUpload from 'primevue/fileupload';
import { useAuthStore } from '../stores/auth';

export default {
  components: {
    Button,
    AutoComplete,
    Dialog,
    InputText,
    FileUpload
  },
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();

    const value = ref('');
    const items = ref([]);
    const displayDialog = ref(false);
    const loading = ref(false);

    // Form data
    const form = ref({
      description: '',
      location: '',
      tags: [],
      file: null
    });

    // Error messages
    const errors = ref({
      description: '',
      location: '',
      tags: '',
      file: ''
    });

    // Validation states
    const isDescriptionValid = computed(() => {
      return form.value.description.length >= 10;
    });

    const isLocationValid = computed(() => {
      return isDescriptionValid.value && form.value.location.length >= 3;
    });

    const isTagsValid = computed(() => {
      return isLocationValid.value && form.value.tags.length > 0;
    });

    const isFormValid = computed(() => {
      return isDescriptionValid.value && 
             isLocationValid.value && 
             isTagsValid.value && 
             form.value.file !== null;
    });

    // Watch form fields for real-time validation
    watch(() => form.value.description, (newValue) => {
      if (newValue.length < 10) {
        errors.value.description = 'Description must be at least 10 characters long';
      } else {
        errors.value.description = '';
      }
    });

    watch(() => form.value.location, (newValue) => {
      if (newValue.length < 3) {
        errors.value.location = 'Location must be at least 3 characters long';
      } else {
        errors.value.location = '';
      }
    });

    watch(() => form.value.tags, (newValue) => {
      if (newValue.length === 0) {
        errors.value.tags = 'At least one tag is required';
      } else {
        errors.value.tags = '';
      }
    });

    const filteredItems = computed(() => {
      return items.value.map(item => item.tagName);
    });

    const logout = async () => {
      await authStore.logout();
      router.push('/login');
    };

    const search = async (event) => {
      try {
        const response = await fetch('http://localhost:8080/streetphotography/api/user/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query: event.query,
            limit: event.query ? null : 10
          })
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        items.value = data;
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };

    const openDialog = () => {
      // Reset form when opening dialog
      form.value = {
        description: '',
        location: '',
        tags: [],
        file: null
      };
      errors.value = {
        description: '',
        location: '',
        tags: '',
        file: ''
      };
      displayDialog.value = true;
    };

    const onSelectFile = (event) => {
      form.value.file = event.files[0];
      errors.value.file = form.value.file ? '' : 'Please select an image';
    };

    const onUpload = () => {
      // Handle file upload logic here
      errors.value.file = form.value.file ? '' : 'Please select an image';
    };

    const savePost = () => {
      if (!isFormValid.value) return;

      loading.value = true;
      // Simulate async save
      setTimeout(() => {
        loading.value = false;
        displayDialog.value = false;
        // Reset form after save
        form.value = {
          description: '',
          location: '',
          tags: [],
          file: null
        };
      }, 1000);
    };

    return {
      value,
      filteredItems,
      logout,
      search,
      displayDialog,
      loading,
      openDialog,
      onSelectFile,
      onUpload,
      savePost,
      form,
      errors,
      isDescriptionValid,
      isLocationValid,
      isTagsValid,
      isFormValid
    };
  }
};
</script>

<style scoped>
.card {
  padding: 2rem;
}

h1 {
  margin-bottom: 1.5rem;
}

.p-field {
  margin-bottom: 1.5rem;
}

.p-mr-2 {
  margin-right: 0.5rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-bar {
  margin-bottom: 1.5rem;
}

.search-bar input {
  width: 100%;
  max-width: 400px;
}

.p-column-filter {
  width: 100%;
}

.p-error {
  color: #ff4d4f;
  font-size: 0.875rem;
}
</style>