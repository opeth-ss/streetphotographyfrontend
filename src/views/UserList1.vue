<template>
  <div class="card">
    <div class="flex justify-content-between mb-3">
      <div class="flex align-items-center">
        <Dropdown 
          v-model="selectedPaperSize" 
          :options="paperSizes" 
          optionLabel="name" 
          optionValue="value"
          placeholder="Paper Size"
          class="w-10rem mr-2"
        />
      </div>
      <Button label="Export PDF" icon="pi pi-file-pdf" @click="generatePDF" severity="warning" />
    </div>

    <DataTable
      :value="filteredUsers"
      :lazy="true"
      :paginator="true"
      :rows="rowsPerPage"
      :totalRecords="totalRecords"
      :loading="loading"
      dataKey="id"
      @page="onPage($event)"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 25, 50]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
      ref="dt"
    >
      <Column field="id" header="ID"></Column>
      <Column field="userName" header="Username"></Column>
      <Column field="email" header="Email"></Column>
      <Column field="role" header="Role"></Column>
      <Column field="averageRating" header="Rating">
        <template #body="{ data }">
          <Rating :modelValue="data.averageRating" readonly :cancel="false" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Rating from 'primevue/rating';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default {
  components: {
    DataTable,
    Column,
    Rating,
    Button,
    Dropdown,
    InputText
  },
  setup() {
    const users = ref([]);
    const filteredUsers = ref([]);
    const loading = ref(false);
    const totalRecords = ref(0);
    const rowsPerPage = ref(10);
    const dt = ref();
    const searchTerm = ref('');
    const selectedPaperSize = ref('a4');
    const paperSizes = ref([
      { name: 'A4 (210 × 297 mm)', value: 'a4' },
      { name: 'A5 (148 × 210 mm)', value: 'a5' },
      { name: '80mm (80 × 297 mm)', value: [80, 297] }
    ]);

    const fetchUsers = async (page = 1, rows = rowsPerPage.value) => {
      loading.value = true;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/userlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            page: page,
            size: rows
          }),
        });

        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        users.value = data.users;
        filteredUsers.value = data.users;
        totalRecords.value = data.totalRecords;
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        loading.value = false;
      }
    };

    const generatePDF = () => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: selectedPaperSize.value
      });

      fetch('/templates/pdf-template.xml')
        .then(response => response.text())
        .then(xmlText => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "application/xml");

          // Get page dimensions
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();

          // Extract template configuration
          const title = xmlDoc.querySelector('title')?.textContent || 'User List';
          const styles = {
            font: xmlDoc.querySelector('styles font')?.textContent || 'helvetica',
            titleSize: parseInt(xmlDoc.querySelector('styles titleSize')?.textContent) || 18,
            headerSize: parseInt(xmlDoc.querySelector('styles headerSize')?.textContent) || 10,
            cellSize: parseInt(xmlDoc.querySelector('styles cellSize')?.textContent) || 9,
            margin: {
              top: parseInt(xmlDoc.querySelector('styles margin top')?.textContent) || 25,
              left: parseInt(xmlDoc.querySelector('styles margin left')?.textContent) || 15,
              right: parseInt(xmlDoc.querySelector('styles margin right')?.textContent) || 15,
              bottom: parseInt(xmlDoc.querySelector('styles margin bottom')?.textContent) || 20,
            },
          };

          // Scale styles based on page width
          const scaleFactor = pageWidth / 210; // Normalize based on A4 width
          styles.margin.top = Math.max(10, styles.margin.top * scaleFactor);
          styles.margin.left = Math.max(5, styles.margin.left * scaleFactor);
          styles.margin.right = Math.max(5, styles.margin.right * scaleFactor);
          styles.margin.bottom = Math.max(10, styles.margin.bottom * scaleFactor);
          styles.titleSize = Math.max(10, styles.titleSize * scaleFactor);
          styles.headerSize = Math.max(6, styles.headerSize * scaleFactor);
          styles.cellSize = Math.max(5, styles.cellSize * scaleFactor);

          // Adjust for specific sizes
          if (Array.isArray(selectedPaperSize.value) && selectedPaperSize.value[0] === 80) {
            styles.margin.top = Math.min(styles.margin.top, 10);
            styles.margin.left = Math.min(styles.margin.left, 5);
            styles.margin.right = Math.min(styles.margin.right, 5);
            styles.margin.bottom = Math.min(styles.margin.bottom, 10);
            styles.titleSize = Math.min(styles.titleSize, 12);
            styles.headerSize = Math.min(styles.headerSize, 6);
            styles.cellSize = Math.min(styles.cellSize, 5);
          } else if (selectedPaperSize.value === 'a5') {
            styles.margin.top = Math.min(styles.margin.top, 15);
            styles.margin.left = Math.min(styles.margin.left, 10);
            styles.margin.right = Math.min(styles.margin.right, 10);
            styles.margin.bottom = Math.min(styles.margin.bottom, 15);
            styles.titleSize = Math.min(styles.titleSize, 14);
            styles.headerSize = Math.min(styles.headerSize, 8);
            styles.cellSize = Math.min(styles.cellSize, 7);
          }

          // Process headers and footers
          const headers = Array.from(xmlDoc.querySelectorAll('header')).map(headerNode => ({
            text: headerNode.textContent || '',
            align: headerNode.getAttribute('align') || 'center',
            fontSize: parseInt(headerNode.getAttribute('fontSize')) || styles.headerSize
          }));

          const footers = Array.from(xmlDoc.querySelectorAll('footer')).map(footerNode => ({
            text: footerNode.textContent || '',
            align: footerNode.getAttribute('align') || 'center',
            fontSize: parseInt(footerNode.getAttribute('fontSize')) || styles.headerSize
          }));

          // Process columns
          const columns = Array.from(xmlDoc.querySelectorAll('columns column'))
            .filter(col => col.getAttribute('visible') !== 'false')
            .map(col => ({
              field: col.getAttribute('field'),
              header: col.getAttribute('header'),
              align: col.getAttribute('align') || 'left',
            }));

          const tableHeaders = columns.map(col => col.header);
          const data = filteredUsers.value.map(user =>
            columns.map(col => {
              if (col.field === 'averageRating') {
                return '★'.repeat(Math.round(user[col.field])) +
                       '☆'.repeat(5 - Math.round(user[col.field]));
              }
              return user[col.field];
            })
          );

          // Calculate footer height
          const footerHeight = footers.reduce((total, footer) => {
            return total + footer.fontSize + 2;
          }, 0) + 5;

          // Draw header function
          const drawHeader = (doc, styles, headers) => {
            doc.setFont(styles.font);
            doc.setFontSize(styles.titleSize);
            doc.text(title, pageWidth / 2, styles.margin.top - 10, { align: 'center' });

            let currentY = styles.margin.top;
            headers.forEach(header => {
              let headerText = header.text.replace('{date}', new Date().toLocaleDateString());
              doc.setFontSize(header.fontSize);
              doc.text(
                headerText,
                header.align === 'left' ? styles.margin.left : 
                header.align === 'right' ? pageWidth - styles.margin.right : pageWidth / 2,
                currentY,
                { align: header.align }
              );
              currentY += header.fontSize + 2;
            });
          };

          // Draw footer function
          const drawFooter = (doc, styles, footers, pageNum, pageCount) => {
            let currentY = pageHeight - styles.margin.bottom;
            footers.forEach(footer => {
              let footerText = footer.text
                .replace('{page}', pageNum)
                .replace('{pages}', pageCount);
              doc.setFontSize(footer.fontSize);
              doc.text(
                footerText,
                footer.align === 'left' ? styles.margin.left : 
                footer.align === 'right' ? pageWidth - styles.margin.right : pageWidth / 2,
                currentY,
                { align: footer.align }
              );
              currentY -= footer.fontSize + 2;
            });
          };

          // Dynamic column widths based on page size
          const columnWidths = columns.map((col, idx) => {
            if (Array.isArray(selectedPaperSize.value) && selectedPaperSize.value[0] === 80) {
              return (pageWidth - styles.margin.left - styles.margin.right) / columns.length;
            }
            return col.field === 'email' ? (pageWidth - styles.margin.left - styles.margin.right) * 0.3 :
                   col.field === 'userName' ? (pageWidth - styles.margin.left - styles.margin.right) * 0.25 :
                   (pageWidth - styles.margin.left - styles.margin.right) / columns.length;
          });

          // Initial header draw
          drawHeader(doc, styles, headers);

          // Generate table with dynamic sizing
          autoTable(doc, {
            head: [tableHeaders],
            body: data,
            startY: styles.margin.top + (headers.length * (styles.headerSize + 2)) + 5,
            theme: 'plain',
            styles: { 
              font: styles.font, 
              fontSize: styles.cellSize,
              cellPadding: Math.max(0.5, 1 * scaleFactor),
              overflow: 'linebreak',
              lineWidth: 0.1
            },
            margin: {
              top: styles.margin.top + (headers.length * (styles.headerSize + 2)) + 5,
              left: styles.margin.left,
              right: styles.margin.right,
              bottom: styles.margin.bottom + footerHeight,
            },
            tableWidth: pageWidth - styles.margin.left - styles.margin.right,
            columnStyles: columns.reduce((acc, col, idx) => {
              acc[idx] = { 
                halign: col.align,
                cellWidth: columnWidths[idx],
                fontSize: styles.cellSize
              };
              return acc;
            }, {}),
            didDrawPage: (data) => {
              const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
              const pageCount = doc.internal.getNumberOfPages();
              drawHeader(doc, styles, headers);
              drawFooter(doc, styles, footers, pageNum, pageCount);
            },
            willDrawCell: (data) => {
              if (data.section === 'body' && data.cursor.y > pageHeight - styles.margin.bottom - footerHeight) {
                doc.addPage();
                data.cursor.y = styles.margin.top;
                drawHeader(doc, styles, headers);
              }
            }
          });

          // Save the PDF
          doc.save(`user-list-${new Date().toISOString().slice(0,10)}.pdf`);
        })
        .catch(error => {
          console.error('Error generating PDF:', error);
        });
    };

    const onPage = (event) => {
      rowsPerPage.value = event.rows;
      fetchUsers(event.page + 1, event.rows);
    };

    onMounted(() => {
      fetchUsers();
    });

    return {
      users,
      filteredUsers,
      loading,
      totalRecords,
      rowsPerPage,
      dt,
      searchTerm,
      selectedPaperSize,
      paperSizes,
      fetchUsers,
      onPage,
      generatePDF
    };
  },
};
</script>

<style scoped>
.card {
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.flex {
  display: flex;
}

.justify-content-between {
  justify-content: space-between;
}

.justify-content-end {
  justify-content: flex-end;
}

.align-items-center {
  align-items: center;
}

.mb-3 {
  margin-bottom: 1.5rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.w-10rem {
  width: 10rem;
}
</style>