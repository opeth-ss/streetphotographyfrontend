<template>
  <div class="card">
    <h1>User Management</h1>

    <div class="button-group">
      <Button label="Refresh" icon="pi pi-refresh" @click="fetchUsers" class="p-button-rounded p-button-text" />
      <Button
        label="Download PDF"
        icon="pi pi-file-pdf"
        @click="openFormatDialog"
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

    <!-- PDF Format Customization Dialog -->
    <Dialog
      v-model:visible="showFormatDialog"
      header="Customize PDF Format"
      :modal="true"
      class="p-fluid"
      style="width: 600px"
    >
      <div class="p-field">
        <label for="pdfTitle">Report Title</label>
        <InputText id="pdfTitle" v-model="pdfFormat.title" placeholder="e.g., User Management Report" />
      </div>
      <div class="p-field">
        <label for="pdfSubtitle">Subtitle (Optional)</label>
        <InputText id="pdfSubtitle" v-model="pdfFormat.subtitle" placeholder="e.g., Generated for Organization XYZ" />
      </div>
      <div class="p-field">
        <label>Columns to Include</label>
        <div v-for="col in availableColumns" :key="col.dataKey" class="p-field-checkbox">
          <Checkbox v-model="pdfFormat.columns" :value="col" />
          <label>{{ col.header }}</label>
        </div>
      </div>
      <div class="p-field">
        <label for="theme">Table Theme</label>
        <Dropdown
          id="theme"
          v-model="pdfFormat.theme"
          :options="themeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select Theme"
        />
      </div>
      <div class="p-field">
        <label for="headerText">Header Text (Optional)</label>
        <InputText id="headerText" v-model="pdfFormat.header.text" placeholder="e.g., Organization Name" />
        <Checkbox v-model="pdfFormat.header.show" inputId="showHeader" class="p-mt-2" />
        <label for="showHeader" class="p-ml-2">Show Header</label>
      </div>
      <div class="p-field">
        <label for="logoUpload">Upload Logo (Optional)</label>
        <FileUpload
          id="logoUpload"
          mode="basic"
          accept="image/*"
          :maxFileSize="1000000"
          @select="onLogoUpload"
          chooseLabel="Select Logo"
        />
        <img v-if="uploadedLogo" :src="uploadedLogo" alt="Logo Preview" style="max-width: 100px; margin-top: 10px;" />
      </div>
      <div class="p-field">
        <label for="footerText">Footer Text (Optional)</label>
        <InputText id="footerText" v-model="pdfFormat.footer.text" placeholder="e.g., Generated on {date}" />
        <Checkbox v-model="pdfFormat.footer.show" inputId="showFooter" class="p-mt-2" />
        <label for="showFooter" class="p-ml-2">Show Footer</label>
      </div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" @click="showFormatDialog = false" class="p-button-text" />
        <Button label="Generate PDF" icon="pi pi-check" @click="generatePdf" :disabled="!isFormValid" />
      </template>
    </Dialog>

    <ConfirmDialog></ConfirmDialog>
    <Toast />
  </div>
</template>
<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Rating from 'primevue/rating';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import FileUpload from 'primevue/fileupload';
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
    Checkbox,
    IconField,
    InputIcon,
    ConfirmDialog,
    Toast,
    FileUpload,
  },
  setup() {
    const users = ref([]);
    const loading = ref(false);
    const displayDialog = ref(false);
    const showFormatDialog = ref(false);
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
    const uploadedLogo = ref(null);
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

    const availableColumns = ref([
      { header: 'ID', dataKey: 'id', width: 30, format: 'number' },
      { header: 'Username', dataKey: 'userName', width: 50, format: 'string' },
      { header: 'Email', dataKey: 'email', width: 70, format: 'string' },
      { header: 'Role', dataKey: 'role', width: 40, format: 'string' },
      { header: 'Rating', dataKey: 'averageRating', width: 30, format: 'rating' },
    ]);

    const themeOptions = ref([
      { label: 'Grid', value: 'grid' },
      { label: 'Striped', value: 'striped' },
      { label: 'Plain', value: 'plain' },
    ]);

    const pdfFormat = ref({
      fileName: 'user-list.pdf',
      title: 'User Management Report',
      subtitle: '',
      columns: [...availableColumns.value],
      styles: {
        font: 'helvetica',
        fontSize: 10,
        textColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 12,
      },
      bodyStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
      },
      margin: {
        top: 30,
        left: 10,
        right: 10,
        bottom: 10,
      },
      header: {
        show: true,
        text: 'Organization Name',
        logo: null,
        logoWidth: 30,
        logoHeight: 10,
      },
      footer: {
        show: true,
        text: 'Generated on {date} | Page {page}',
        fontSize: 8,
      },
      theme: 'grid',
      metadata: {
        author: 'Admin',
        subject: 'User Report',
        keywords: 'users, report, management',
      },
    });

    const isFormValid = computed(() => {
      return pdfFormat.value.title && pdfFormat.value.columns.length > 0;
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

    const openFormatDialog = () => {
      showFormatDialog.value = true;
    };

    const onLogoUpload = (event) => {
      const file = event.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedLogo.value = e.target.result;
        pdfFormat.value.header.logo = e.target.result;
        toast.add({ severity: 'success', summary: 'Success', detail: 'Logo uploaded', life: 3000 });
      };
      reader.onerror = () => {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload logo', life: 3000 });
      };
      reader.readAsDataURL(file);
    };

    const generatePdf = () => {
      if (!isFormValid.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Please provide a title and at least one column', life: 3000 });
        return;
      }

      downloadPdf(pdfFormat.value);
      showFormatDialog.value = false;
    };

    const downloadPdf = (format) => {
      const doc = new jsPDF();

      // Set metadata
      doc.setProperties({
        title: format.metadata.title || format.title,
        author: format.metadata.author,
        subject: format.metadata.subject,
        keywords: format.metadata.keywords,
      });

      // Add header
      if (format.header.show) {
        doc.setFontSize(16);
        doc.setFont(format.styles.font, 'bold');
        doc.text(format.header.text, format.margin.left, 15);

        if (format.header.logo) {
          try {
            doc.addImage(format.header.logo, 'PNG', format.margin.left, 5, format.header.logoWidth, format.header.logoHeight);
          } catch (error) {
            toast.add({ severity: 'warn', summary: 'Warning', detail: 'Failed to add logo', life: 3000 });
          }
        }
      }

      // Add title and subtitle
      let currentY = format.margin.top - 10;
      doc.setFontSize(14);
      doc.setFont(format.styles.font, 'bold');
      const formattedTitle = format.title.replace('{filter}', filters.value.global.value || 'All');
      doc.text(formattedTitle, format.margin.left, currentY);
      if (format.subtitle) {
        currentY += 7;
        doc.setFontSize(12);
        doc.setFont(format.styles.font, 'normal');
        const formattedSubtitle = format.subtitle.replace('{filter}', filters.value.global.value || 'All');
        doc.text(formattedSubtitle, format.margin.left, currentY);
      }

      // Prepare columns
      const columns = format.columns.map(col => ({
        header: col.header,
        dataKey: col.dataKey,
      }));

      // Map user data to rows with custom formatting
      const rows = users.value.map(user =>
        format.columns.reduce((row, col) => {
          let value = user[col.dataKey] || '';
          if (col.format === 'number') {
            value = Number(value).toFixed(0);
          } else if (col.format === 'rating') {
            value = `${value} ★`;
          }
          row[col.dataKey] = value;
          return row;
        }, {})
      );

      // Generate table
      autoTable(doc, {
        startY: currentY + 10,
        columns: columns,
        body: rows,
        styles: format.styles,
        headStyles: format.headStyles,
        bodyStyles: format.bodyStyles,
        theme: format.theme,
        columnStyles: format.columns.reduce((styles, col) => {
          styles[col.dataKey] = { cellWidth: col.width };
          return styles;
        }, {}),
        didDrawPage: (data) => {
          if (format.footer.show) {
            const formattedFooter = format.footer.text
              .replace('{date}', new Date().toLocaleDateString())
              .replace('{page}', data.pageNumber);
            doc.setFontSize(format.footer.fontSize);
            doc.setFont(format.styles.font, 'normal');
            doc.text(formattedFooter, format.margin.left, doc.internal.pageSize.height - format.margin.bottom);
          }
        },
      });

      // Save the PDF
      doc.save(format.fileName);
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
      showFormatDialog,
      selectedUser,
      roles,
      totalRecords,
      rowsPerPage,
      filters,
      availableColumns,
      themeOptions,
      pdfFormat,
      uploadedLogo,
      isFormValid,
      fetchUsers,
      onPage,
      onSort,
      onFilter,
      updateColumnFilter,
      editUser,
      updateUser,
      confirmDeleteUser,
      openFormatDialog,
      onLogoUpload,
      generatePdf,
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

.p-field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.p-mr-2 {
  margin-right: 0.5rem;
}

.p-ml-2 {
  margin-left: 0.5rem;
}

.p-mt-2 {
  margin-top: 0.5rem;
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

.p-inputtext {
  width: 100%;
}

.p-checkbox {
  display: flex;
  align-items: center;
}
</style>