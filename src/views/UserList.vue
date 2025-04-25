<template>
  <div class="card">
    <h1>User Management</h1>

    <div class="button-group">
      <Button label="Refresh" icon="pi pi-refresh" @click="fetchUsers" class="p-button-rounded p-button-text" />
      <Button label="Logout" icon="pi pi-sign-out" @click="logout" class="p-button-rounded p-button-text" />
    </div>

    <!-- Add Search Input -->
    <div class="search-bar">
      <InputText
        v-model="globalFilter"
        placeholder="Search by username, email, or role"
        @input="onGlobalFilter"
        class="p-inputtext-lg"
      />
    </div>

    <DataTable
      :value="users"
      :lazy="true"
      :paginator="true"
      :rows="rowsPerPage"
      :totalRecords="totalRecords"
      :loading="loading"
      @page="onPage($event)"
      @sort="onSort($event)"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[5, 10, 25]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
    >
      <Column field="id" header="ID" :sortable="true"></Column>
      <Column field="userName" header="Username" :sortable="true"></Column>
      <Column field="email" header="Email" :sortable="true"></Column>
      <Column field="role" header="Role" :sortable="true"></Column>
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

    <!-- Dialog and other components remain unchanged -->
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
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Rating from 'primevue/rating';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '../stores/auth';

export default {
  components: {
    Button,
    DataTable,
    Column,
    Rating,
    Dialog,
    InputText,
    Dropdown,
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
    const sortOrder = ref(null); // 1 for ascending, -1 for descending
    const globalFilter = ref(''); // Search input
    const confirm = useConfirm();
    const toast = useToast();
    const authStore = useAuthStore();
    const router = useRouter();

    const fetchUsers = async (
      page = 1,
      rows = rowsPerPage.value,
      sortFieldParam = sortField.value,
      sortOrderParam = sortOrder.value,
      filter = globalFilter.value
    ) => {
      loading.value = true;
      try {
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
            filter: filter || null,
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        users.value = data.users;
        totalRecords.value = data.totalRecords;
        currentPage.value = page;
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch users', life: 3000 });
      } finally {
        loading.value = false;
      }
    };

    const onPage = (event) => {
      rowsPerPage.value = event.rows;
      const page = event.page + 1; // PrimeVue page is 0-based, backend expects 1-based
      fetchUsers(page, event.rows);
    };

    const onSort = (event) => {
      sortField.value = event.sortField;
      sortOrder.value = event.sortOrder;
      fetchUsers(currentPage.value, rowsPerPage.value);
    };

    const onGlobalFilter = () => {
      fetchUsers(currentPage.value, rowsPerPage.value);
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
        console.error('Error updating user:', error);
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
        console.error('Error deleting user:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete user', life: 3000 });
      } finally {
        loading.value = false;
      }
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
      globalFilter,
      fetchUsers,
      onPage,
      onSort,
      onGlobalFilter,
      editUser,
      updateUser,
      confirmDeleteUser,
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
</style>