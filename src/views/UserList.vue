<template>
  <div class="card">
    <h1>User Management</h1>

    <div class="button-group">
      <Button label="Refresh" icon="pi pi-refresh" @click="fetchUsers" class="p-button-rounded p-button-text" />
      <Button
  label="Download PDF"
  icon="pi pi-file-pdf"
  @click="downloadPdf"
  class="p-button-rounded p-button-text p-button-danger"
/>

      <Button label="Logout" icon="pi pi-sign-out" @click="logout" class="p-button-rounded p-button-text" />
    </div>

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
      :rowsPerPageOptions="[5, 10, 25]"
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
      <Column header="Actions" :style="{ width: '120px' }">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            class="p-button-rounded p-button-sm p-button-success p-mr-2"
            @click="editUser(data)"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-rounded p-button-sm p-button-danger"
            @click="confirmDeleteUser(data)"
          />
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="displayDialog"
      header="Edit User"
      :modal="true"
      class="p-fluid"
      style="width: 450px"
    >
      <div class="p-field">
        <label for="username">Username</label>
        <InputText id="username" v-model="selectedUser.userName" />
      </div>
      <div class="p-field">
        <label for="email">Email</label>
        <InputText id="email" v-model="selectedUser.email" />
      </div>
      <div class="p-field">
        <label for="role">Role</label>
        <Dropdown
          id="role"
          v-model="selectedUser.role"
          :options="roles"
          optionLabel="label"
          optionValue="value"
          placeholder="Select a Role"
        />
      </div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" @click="displayDialog = false" class="p-button-text" />
        <Button label="Save" icon="pi pi-check" @click="updateUser" :loading="loading" />
      </template>
    </Dialog>

    <ConfirmDialog></ConfirmDialog>
    <Toast />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Rating from 'primevue/rating';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '../stores/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default {
  components: {
    Button,
    DataTable,
    Column,
    Rating,
    Dialog,
    InputText,
    Dropdown,
    IconField,
    InputIcon,
    ConfirmDialog,
    Toast,
  },
  setup() {
    const users = ref([]);
    const loading = ref(false);
    const displayDialog = ref(false);
    const selectedUser = ref({});
    const roles = ref([
      { label: 'Admin', value: 'admin' },
      { label: 'User', value: 'user' },
    ]);
    const totalRecords = ref(0);
    const rowsPerPage = ref(5);
    const currentPage = ref(1);
    const sortField = ref(null);
    const sortOrder = ref(null);
    const confirm = useConfirm();
    const toast = useToast();
    const authStore = useAuthStore();
    const router = useRouter();

    const filters = ref({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      id: { value: null, matchMode: FilterMatchMode.EQUALS },
      userName: { value: null, matchMode: FilterMatchMode.CONTAINS },
      email: { value: null, matchMode: FilterMatchMode.CONTAINS },
      role: { value: null, matchMode: FilterMatchMode.EQUALS },
    });

    const updateColumnFilter = (field, value) => {
      filters.value[field].value = value;
    };

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

        const response = await fetch('http://localhost:8080/streetphotography/api/admin/userlist', {
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
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch users', life: 3000 });
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

    const editUser = (user) => {
      selectedUser.value = { ...user };
      displayDialog.value = true;
    };

    const updateUser = async () => {
      loading.value = true;
      try {
        const response = await fetch('http://localhost:8080/streetphotography/api/admin/updateUser', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(selectedUser.value),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        displayDialog.value = false;
        fetchUsers(currentPage.value, rowsPerPage.value);
        toast.add({ severity: 'success', summary: 'Success', detail: 'User updated successfully', life: 3000 });
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update user', life: 3000 });
      } finally {
        loading.value = false;
      }
    };

    const confirmDeleteUser = (user) => {
      confirm.require({
        message: `Are you sure you want to delete ${user.userName}?`,
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteUser(user.id),
        reject: () => {
          toast.add({ severity: 'info', summary: 'Cancelled', detail: 'Deletion cancelled', life: 3000 });
        },
      });
    };

    const deleteUser = async (userId) => {
      loading.value = true;
      try {
        const response = await fetch(
          `http://localhost:8080/streetphotography/api/admin/deleteUser/${userId}`,
          {
            method: 'DELETE',
            headers: {
              'Accept': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        fetchUsers(currentPage.value, rowsPerPage.value);
        toast.add({ severity: 'success', summary: 'Success', detail: 'User deleted successfully', life: 3000 });
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete user', life: 3000 });
      } finally {
        loading.value = false;
      }
    };

    const downloadPdf = () => {
  const doc = new jsPDF();
  
  // Define columns with the same structure as the example
  const columns = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Username', dataKey: 'userName' },
    { header: 'Email', dataKey: 'email' },
    { header: 'Role', dataKey: 'role' },
    { header: 'Rating', dataKey: 'averageRating' }
  ];

  // Map the user data to rows
  const rows = users.value.map(user => ({
    id: user.id,
    userName: user.userName,
    email: user.email,
    role: user.role,
    averageRating: user.averageRating
  }));

  // Generate table using autoTable with similar styling
  autoTable(doc,{
    startY: 20,
    columns: columns,
    body: rows,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] }, // Same blue header as example
    theme: 'grid'
  });

  // Save the PDF
  doc.save('user-list.pdf');
};

    const logout = async () => {
      await authStore.logout();
      router.push('/login');
    };

    onMounted(() => {
      fetchUsers();
    });

    return {
      users,
      loading,
      displayDialog,
      selectedUser,
      roles,
      totalRecords,
      rowsPerPage,
      filters,
      fetchUsers,
      onPage,
      onSort,
      onFilter,
      updateColumnFilter,
      editUser,
      updateUser,
      confirmDeleteUser,
      downloadPdf,
      logout,
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
</style>