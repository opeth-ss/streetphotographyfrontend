<template>
  <h1>User Page</h1>
  <Button label="Logout" icon="pi pi-sign-out" @click="logout" class="p-button-rounded p-button-text" />

  <AutoComplete 
    v-model="selectedTags" 
    dropdown 
    multiple
    :suggestions="filteredItems" 
    @complete="search" 
    @focus="onFocus"
    optionLabel="displayLabel"
    :virtualScrollerOptions="{
      lazy: true, 
      autoSize: false, 
      itemSize: 40, 
      delay: 100, 
      appendOnly: true, 
      loading: loading, 
      onLazyLoad: onLazyLoad
    }"
  />

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
        :suggestions="dialogFilteredItems" 
        @complete="searchDialog" 
        optionLabel="displayLabel"
        :class="{ 'p-invalid': errors.tags }" />
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
        :class="{ 'p-invalid': errors.file }" />
      <small v-if="errors.file" class="p-error">{{ errors.file }}</small>
    </div>

    <template #footer>
      <Button label="Cancel" icon="pi pi-times" @click="displayDialog = false" class="p-button-text" />
      <Button 
        label="Save" 
        icon="pi pi-check" 
        @click="savePost" 
        :loading="loading" 
        :disabled="!isFormValid" />
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
    FileUpload,
  },
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();

    const value = ref('');
    const selectedTags = ref([]);
    const items = ref([]);
    const displayDialog = ref(false);
    const loading = ref(false);
    const offset = ref(0);
    const limit = 10;
    const hasMore = ref(true);

    const form = ref({
      description: '',
      location: '',
      tags: [],
      file: null
    });

    const errors = ref({
      description: '',
      location: '',
      tags: '',
      file: ''
    });

    const isDescriptionValid = computed(() => form.value.description.length >= 10);
    const isLocationValid = computed(() => isDescriptionValid.value && form.value.location.length >= 3);
    const isTagsValid = computed(() => isLocationValid.value && form.value.tags.length > 0);
    const isFormValid = computed(() =>
      isDescriptionValid.value &&
      isLocationValid.value &&
      isTagsValid.value &&
      form.value.file !== null
    );

    // Function to add display label to items
    const processItems = (rawItems) => {
      return rawItems.map(item => ({
        ...item,
        displayLabel: `${item.id}. ${item.tagName}`
      }));
    };

    // Function to filter items based on search query
    const filterItemsByQuery = (itemsList, query) => {
      if (!query) return itemsList;
      
      const searchTerm = query.toLowerCase();
      return itemsList.filter(item => {
        return item.tagName.toLowerCase().includes(searchTerm) || 
               item.id.toString().includes(searchTerm);
      });
    };

    watch(() => form.value.description, (newValue) => {
      errors.value.description = newValue.length < 10 ? 'Description must be at least 10 characters long' : '';
    });

    watch(() => form.value.location, (newValue) => {
      errors.value.location = newValue.length < 3 ? 'Location must be at least 3 characters long' : '';
    });

    watch(() => form.value.tags, (newValue) => {
      errors.value.tags = newValue.length === 0 ? 'At least one tag is required' : '';
    });

    const filteredItems = computed(() => {
      if (!items.value.length) return [];
      
      const processedItems = processItems(items.value);
      const searchFiltered = filterItemsByQuery(processedItems, value.value);
      
      const selectedIds = new Set((selectedTags.value || []).map(tag => 
        typeof tag === 'object' ? tag.id : tag
      ));
      
      const selected = searchFiltered.filter(item => selectedIds.has(item.id));
      const remaining = searchFiltered.filter(item => !selectedIds.has(item.id));
      
    
      return [...selected, ...remaining];
    });

    // Enhanced dialog filtered items with search functionality
    const dialogFilteredItems = computed(() => {
      if (!items.value.length) return [];
      
      const processedItems = processItems(items.value);
      const searchFiltered = filterItemsByQuery(processedItems, value.value);
      
      const selectedIds = new Set((form.value.tags || []).map(tag => 
        typeof tag === 'object' ? tag.id : tag
      ));
      
      const selected = searchFiltered.filter(item => selectedIds.has(item.id));
      const remaining = searchFiltered.filter(item => !selectedIds.has(item.id));
      
      return [...selected, ...remaining];
    });

    const loadTags = async (isInitial = false, firstIndex = 0, searchQuery = '') => {
      if (!hasMore.value && !isInitial) return;
      loading.value = true;
      try {
        if (isInitial) {
          offset.value = 0;
          items.value = [];
        } else {
          offset.value = firstIndex;
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/tags/paginated`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit,
            offset: offset.value
          })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        if (isInitial) {
          items.value = data;
        } else {
          const existingIds = new Set(items.value.map(item => item.id));
          const newItems = data.filter(item => !existingIds.has(item.id));
          items.value = [...items.value, ...newItems];
        }

        offset.value += limit;
        hasMore.value = data.length === limit;
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        loading.value = false;
      }
    };

    const search = async (event) => {
      offset.value = 0;
      value.value = event.query;
      await loadTags(true, 0, event.query);
    };

    const searchDialog = async (event) => {
      offset.value = 0;
      value.value = event.query;
      await loadTags(true, 0, event.query);
    };

    const onFocus = async () => {
      if (items.value.length === 0) {
        offset.value = 0;
        hasMore.value = true;
        value.value = '';
        await loadTags(true);
      }
    };

    const onLazyLoad = async (event) => {
      if (hasMore.value && !loading.value) {
        await loadTags(false, event.first, value.value);
      }
    };

    const logout = async () => {
      await authStore.logout();
      router.push('/login');
    };

    const openDialog = () => {
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
      errors.value.file = form.value.file ? '' : 'Please select an image';
    };

    const savePost = () => {
      if (!isFormValid.value) return;
      loading.value = true;
      setTimeout(() => {
        loading.value = false;
        displayDialog.value = false;
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
      selectedTags,
      filteredItems,
      dialogFilteredItems,
      items,
      logout,
      search,
      searchDialog,
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
      isFormValid,
      onFocus,
      onLazyLoad
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
.scroller {
  height: 300px;
  border: 1px solid #dee2e6;
  margin-bottom: 1.5rem;
}
.tag-item {
  padding: 0.5rem;
  border-bottom: 1px solid #dee2e6;
}
::v-deep(.p-autocomplete-panel) {
  height: 200px !important;
}
</style>