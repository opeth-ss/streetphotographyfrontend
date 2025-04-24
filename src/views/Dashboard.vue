<template>
    <h1>User Page</h1>
    <Button label="Logout" icon="pi pi-sign-out" @click="logout" class="p-button-rounded p-button-text" />
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
    const confirm = useConfirm();
    const toast = useToast();
    const authStore = useAuthStore();
    const router = useRouter();

    const fetchUsers = async () => {
      loading.value = true;
      try {
        const response = await fetch('http://localhost:8080/streetphotography/api/admin/userlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include', // Send cookies
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        users.value = await response.json();
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch users', life: 3000 });
      } finally {
        loading.value = false;
      }
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
          credentials: 'include', // Send cookies
          body: JSON.stringify(selectedUser.value),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        displayDialog.value = false;
        fetchUsers();
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
            credentials: 'include', // Send cookies
          }
        );

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        fetchUsers();
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
      fetchUsers,
      editUser,
      updateUser,
      confirmDeleteUser,
      logout,
    };
  },
};
</script>