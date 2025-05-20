<template>
    <div class="card">
      <h1>User Management</h1>
  
      <!-- Global Search Input -->
      <div class="search-bar">
        <IconField>
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText
            v-model="filters.global.value"
            placeholder="Search by username, email, or role"
            class="p-inputtext-lg"
            @keyup.enter="onFilter"
            @blur="onFilter"
          />
        </IconField>
      </div>
  
      <DataTable
        :value="users"
        :lazy="true"
        :paginator="true"
        :rows="rowsPerPage"
        :totalRecords="totalRecords"
        :loading="loading"
        :filters="filters"
        dataKey="id"
        filterDisplay="row"
        @page="onPage($event)"
        @sort="onSort($event)"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25, 50]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
      >
        <Column field="id" header="ID" :sortable="true">
          <template #filter="{ filterModel }">
            <InputText
              :value="filters.id.value"
              type="text"
              @input="updateColumnFilter('id', $event.target.value)"
              @keyup.enter="onFilter"
              @blur="onFilter"
              placeholder="Search by ID"
              class="p-column-filter"
            />
          </template>
        </Column>
        <Column field="userName" header="Username" :sortable="true">
          <template #filter="{ filterModel }">
            <InputText
              :value="filters.userName.value"
              type="text"
              @input="updateColumnFilter('userName', $event.target.value)"
              @keyup.enter="onFilter"
              @blur="onFilter"
              placeholder="Search by username"
              class="p-column-filter"
            />
          </template>
        </Column>
        <Column field="email" header="Email" :sortable="true">
          <template #filter="{ filterModel }">
            <InputText
              :value="filters.email.value"
              type="text"
              @input="updateColumnFilter('email', $event.target.value)"
              @keyup.enter="onFilter"
              @blur="onFilter"
              placeholder="Search by email"
              class="p-column-filter"
            />
          </template>
        </Column>
        <Column field="role" header="Role" :sortable="true" :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <Dropdown
              :value="filters.role.value"
              :options="roles"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a Role"
              class="p-column-filter"
              :showClear="true"
              @change="updateColumnFilter('role', $event.value); onFilter()"
            />
          </template>
        </Column>
        <Column field="averageRating" header="Rating" :sortable="true">
          <template #body="{ data }">
            <Rating :modelValue="data.averageRating" readonly :cancel="false" />
          </template>
        </Column>
        <Column field="next" header="Next">
            <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            class="p-button-rounded p-button-sm p-button-success p-mr-2"
          />
        </template>
        </Column>
      </DataTable>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Rating from 'primevue/rating';
  import InputText from 'primevue/inputtext';
  import Dropdown from 'primevue/dropdown';
  import IconField from 'primevue/iconfield';
  import InputIcon from 'primevue/inputicon';
  import Button from 'primevue/button';

  
  export default {
    components: {
        Button,
      DataTable,
      Column,
      Rating,
      InputText,
      Dropdown,
      IconField,
      InputIcon,
    },
    setup() {
      const users = ref([]);
      const loading = ref(false);
      const roles = ref([
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ]);
      const totalRecords = ref(0);
      const rowsPerPage = ref(5);
      const currentPage = ref(1);
      const sortField = ref(null);
      const sortOrder = ref(null);
  
      const filters = ref({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        id: { value: null, matchMode: FilterMatchMode.EQUALS },
        userName: { value: null, matchMode: FilterMatchMode.CONTAINS },
        email: { value: null, matchMode: FilterMatchMode.CONTAINS },
        role: { value: null, matchMode: FilterMatchMode.EQUALS },
      });
  
      const fetchUsers = async (
        page = 1,
        rows = rowsPerPage.value,
        sortFieldParam = sortField.value,
        sortOrderParam = sortOrder.value
      ) => {
        loading.value = true;
        try {
          const columnFilters = {
            id: filters.value.id.value || null,
            userName: filters.value.userName.value || null,
            email: filters.value.email.value || null,
            role: filters.value.role.value || null,
            global: filters.value.global.value || null,
          };
  
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/userlist`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              page: page,
              size: rows,
              sortField: sortFieldParam,
              sortOrder: sortOrderParam === 1 ? 'ASC' : sortOrderParam === -1 ? 'DESC' : null,
              filters: columnFilters,
            }),
          });
  
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
          }
  
          const data = await response.json();
          users.value = data.users;
          totalRecords.value = data.totalRecords;
          currentPage.value = page;
        } catch (error) {
          console.error('Failed to fetch users:', error);
        } finally {
          loading.value = false;
        }
      };
  
      const onPage = (event) => {
        rowsPerPage.value = event.rows;
        const page = event.page + 1;
        fetchUsers(page, event.rows);
      };
  
      const onSort = (event) => {
        sortField.value = event.sortField;
        sortOrder.value = event.sortOrder;
        fetchUsers(1, rowsPerPage.value, event.sortField, event.sortOrder);
      };
  
      const onFilter = () => {
        currentPage.value = 1;
        fetchUsers(1, rowsPerPage.value, sortField.value, sortOrder.value);
      };
  
      const updateColumnFilter = (field, value) => {
        filters.value[field].value = value;
      };
  
      // Fetch users when the component mounts
      onMounted(() => {
        fetchUsers();
      });
  
      return {
        users,
        loading,
        roles,
        totalRecords,
        rowsPerPage,
        filters,
        fetchUsers,
        onPage,
        onSort,
        onFilter,
        updateColumnFilter,
      };
    },
  };
  </script>
  
  <style scoped>
  .card {
    padding: 2rem;
  }
  
  h1 {
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
  
  .p-inputtext {
    width: 100%;
  }
  </style>