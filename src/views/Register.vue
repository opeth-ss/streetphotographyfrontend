<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="bg-white p-6 shadow-lg rounded-lg w-full max-w-md">
      <div class="text-center mb-8">
        <div class="text-gray-900 text-3xl font-medium mb-4">Create Account</div>
      </div>

      <div>
        <form @submit.prevent="register">
          <div class="mb-4">
            <label for="username" class="text-gray-900 font-medium mb-2 block">Username</label>
            <InputText 
              id="username" 
              v-model="username" 
              placeholder="Choose a username" 
              class="w-full border-gray-300 rounded-md"
              @keyup.enter="focusEmail"
            />
          </div>

          <div class="mb-4">
            <label for="email" class="text-gray-900 font-medium mb-2 block">Email</label>
            <InputText 
              id="email" 
              v-model="email" 
              placeholder="Enter your email" 
              class="w-full border-gray-300 rounded-md"
              ref="emailInput"
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
                placeholder="Create a password" 
                class="w-full"
                ref="passwordInput"
                @keyup.enter="focusConfirmPassword"
                inputClass="w-full border-gray-300 rounded-md"
                :inputStyle="{ width: '100%' }"
              />
            </div>
          </div>

          <div class="mb-4">
            <label for="confirmPassword" class="text-gray-900 font-medium mb-2 block">Confirm Password</label>
            <div class="relative w-full">
              <Password 
                id="confirmPassword" 
                v-model="confirmPassword" 
                :feedback="false" 
                :toggleMask="true"
                placeholder="Confirm your password" 
                class="w-full"
                ref="confirmPasswordInput"
                @keyup.enter="register"
                inputClass="w-full border-gray-300 rounded-md"
                :inputStyle="{ width: '100%' }"
              />
            </div>
          </div>

          <div class="flex justify-center mt-4 mb-6">
            <span class="text-gray-600 font-medium">Already have an account?</span>
            <a class="font-medium no-underline ml-2 text-blue-600 hover:text-blue-800" href="/login">Log in</a>
          </div>

          <Button 
            type="submit" 
            :label="isLoading ? 'Creating Account...' : 'Register'" 
            class="w-full bg-blue-600 text-white rounded-md hover:bg-blue-700"
            :disabled="!isFormValid || isLoading"
          />

          <Message v-if="errorMessage" severity="error" class="mt-4">
            {{ errorMessage }}
          </Message>
        </form>
      </div>

      <!-- Toast Component -->
      <Toast />
    </div>
  </div>
</template>

<script>
export default {
  name: 'RegisterForm',
  data() {
    return {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      showPassword: false,
      isLoading: false,
      errorMessage: ''
    }
  },
  computed: {
    isFormValid() {
      return this.username.trim() !== '' && 
             this.email.trim() !== '' && 
             this.password.trim() !== '' &&
             this.password === this.confirmPassword &&
             this.validateEmail(this.email);
    }
  },
  methods: {
    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
    focusEmail() {
      this.$refs.emailInput.$el.focus();
    },
    focusPassword() {
      this.$refs.passwordInput.$el.querySelector('input').focus();
    },
    focusConfirmPassword() {
      this.$refs.confirmPasswordInput.$el.querySelector('input').focus();
    },
    async register() {
      if (!this.username.trim()) {
        this.errorMessage = 'Please enter a username';
        return;
      }
      
      if (!this.email.trim()) {
        this.errorMessage = 'Please enter an email';
        return;
      }
      
      if (!this.validateEmail(this.email)) {
        this.errorMessage = 'Please enter a valid email address';
        return;
      }
      
      if (!this.password.trim()) {
        this.errorMessage = 'Please enter a password';
        return;
      }
      
      if (this.password !== this.confirmPassword) {
        this.errorMessage = 'Passwords do not match';
        return;
      }
      
      this.isLoading = true;
      this.errorMessage = '';
      
      try {
        const response = await fetch('http://localhost:8080/streetphotography/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userName: this.username,
            email: this.email,
            password: this.password
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          this.$toast.add({
            severity: 'success',
            summary: 'Registration Successful',
            detail: `Welcome to our platform, ${this.username}!`,
            life: 3000
          });
          
          this.$emit('register-success', {
            username: this.username,
            email: this.email
          });
          
          setTimeout(() => {
            this.$router.push('/login');
          }, 2000);
        } else {
          if (response.status === 409) {
            this.errorMessage = 'Username already exists';
          } else {
            this.errorMessage = 'Registration failed. Please try again.';
          }
        }
      } catch (error) {
        console.error('Registration error:', error);
        this.errorMessage = 'Network error. Please check your connection.';
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<script setup>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import Message from 'primevue/message';

const toast = useToast();
</script>