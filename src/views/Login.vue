<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="bg-white p-6 shadow-lg rounded-lg w-full max-w-md">
      <div class="text-center mb-8">
        <svg class="mb-4 mx-auto h-16 text-gray-600" viewBox="0 0 30 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M20.7207 6.18211L14.9944 3.11148L3.46855 9.28678L0.579749 7.73444L14.9944 0L23.6242 4.62977L20.7207 6.18211ZM14.9996 12.3574L26.5182 6.1821L29.4216 7.73443L14.9996 15.4621L6.37724 10.8391L9.27337 9.28677L14.9996 12.3574ZM2.89613 16.572L0 15.0196V24.2656L14.4147 32V28.8953L2.89613 22.7132V16.572ZM11.5185 18.09L0 11.9147V8.81001L14.4147 16.5376V25.7904L11.5185 24.2312V18.09ZM24.2086 15.0194V11.9147L15.5788 16.5377V31.9998L18.475 30.4474V18.09L24.2086 15.0194ZM27.0969 22.7129V10.3623L30.0004 8.81V24.2653L21.3706 28.895V25.7904L27.0969 22.7129Z"
          />
        </svg>
        <div class="text-gray-900 text-3xl font-medium mb-4">Welcome Back</div>
      </div>

      <div>
        <form @submit.prevent="login">
          <div class="mb-4">
            <label for="username" class="text-gray-900 font-medium mb-2 block">Username</label>
            <InputText
              id="username"
              v-model="username"
              placeholder="Enter your username"
              class="w-full border-gray-300 rounded-md"
              @keyup.enter="focusPassword"
            />
          </div>

          <div class="mb-4">
            <label for="password" class="text-gray-900 font-medium mb-2 block">Password</label>
            <div class="relative w-full">
              <Password
                id="password"
                v-model="password"
                :feedback="false"
                :toggleMask="true"
                placeholder="Enter your password"
                class="w-full"
                ref="passwordInput"
                @keyup.enter="login"
                inputClass="w-full border-gray-300 rounded-md"
                :inputStyle="{ width: '100%' }"
              />
            </div>
          </div>
          <div class="flex justify-center mt-4 mb-6">
            <span class="text-gray-600 font-medium">Don't have an account?</span>
            <router-link to="/register" class="font-medium no-underline ml-2 text-blue-600 hover:text-blue-800">
              Create today!
            </router-link>
          </div>
          <Button
            type="submit"
            :label="isLoading ? 'Logging in...' : 'Sign In'"
            icon="pi pi-user !text-xl !leading-none"
            class="w-full bg-blue-600 text-white rounded-md hover:bg-blue-700"
            :disabled="!isFormValid || isLoading"
          />

          <Message v-if="errorMessage" severity="error" class="mt-4">
            {{ errorMessage }}
          </Message>
        </form>
      </div>

      <!-- Login Success Dialog -->
      <Dialog
        v-model:visible="showSuccessPopup"
        modal
        header="Login Successful"
        :style="{ width: '400px' }"
        :closable="false"
      >
        <div class="text-center">
          <p>Welcome back, {{ authStore.getUser?.userName }}!</p>
        </div>
        <template #footer>
          <div class="text-center w-full">
            <Button
              label="Close"
              @click="closePopup"
              class="bg-blue-600 text-white rounded-md hover:bg-blue-700"
            />
          </div>
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import { useAuthStore } from '../stores/auth';
import apiFetch from '../api';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const showSuccessPopup = ref(false);
const passwordInput = ref(null);

const isFormValid = computed(() => {
  return username.value.trim() !== '' && password.value.trim() !== '';
});

const focusPassword = () => {
  passwordInput.value.$el.querySelector('input').focus();
};

const closePopup = () => {
  showSuccessPopup.value = false;
  // Redirect based on role
  if (authStore.getUser?.role === 'admin') {
    router.push('/');
  } else {
    router.push('/dashboard');
  }
};

const login = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please enter both username and password';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        userName: username.value,
        password: password.value,
      }),
    });

    authStore.setUser(data.user); // Store in memory
    showSuccessPopup.value = true;
  } catch (error) {
    if (error.message.includes('401')) {
      errorMessage.value = 'Invalid username or password';
    } else {
      errorMessage.value = 'Login failed. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>