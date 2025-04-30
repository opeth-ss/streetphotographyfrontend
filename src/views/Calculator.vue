<template>
    <div class="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card class="w-full max-w-md p-6 shadow-2xl">
        <template #title>Simple Calculator</template>
        <template #content>
          <div class="space-y-4">
            <div>
              <label for="first-number" class="font-bold block mb-2">First Number</label>
              <InputNumber
                v-model="firstNumber"
                inputId="first-number"
                locale="en-IN"
                :minFractionDigits="0"
                :maxFractionDigits="0"
                mode="decimal"
                @update:modelValue="resetResults"
                :class="['w-full', firstNumberError ? 'border border-red-500' : '']"
              />
              <small v-if="firstNumberError" class="block mt-1 text-red-500">{{ firstNumberError }}</small>
            </div>
  
            <div>
              <label for="second-number" class="font-bold block mb-2">Second Number</label>
              <InputNumber
                v-model="secondNumber"
                inputId="second-number"
                locale="en-IN"
                :minFractionDigits="0"
                :maxFractionDigits="0"
                mode="decimal"
                @update:modelValue="resetResults"
                :class="['w-full', (secondNumberError || divideError) ? 'border border-red-500' : '']"
              />
              <small v-if="secondNumberError" class="block mt-1 text-red-500">{{ secondNumberError }}</small>
              <small v-if="divideError" class="block mt-1 text-red-500">{{ divideError }}</small>
            </div>
  
            <div v-if="showResult" class="mt-6 p-4 bg-blue-50 rounded-md">
              <div class="font-bold mb-2 text-blue-700">Result:</div>
              <div v-if="activeOperation === 'add'">Sum: 
                <span class="font-semibold">{{ formatNumber(sumResult) }}</span>
              </div>
              <div v-if="activeOperation === 'multiply'">Product: 
                <span class="font-semibold">{{ formatNumber(productResult) }}</span>
              </div>
              <div v-if="activeOperation === 'divide'">Quotient: 
                <span class="font-semibold">{{ formatNumber(divideResult) }}</span>
              </div>
            </div>
  
            <div class="flex gap-2 justify-center mt-6">
              <Button label="Add" @click="add" :disabled="!isFormValid" class="w-1/3" />
              <Button label="Multiply" severity="secondary" @click="multiply" :disabled="!isFormValid" class="w-1/3" />
              <Button label="Divide" severity="danger" @click="divide" :disabled="!isFormValid || secondNumber === 0" class="w-1/3" />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </template>
  
  <script lang="ts">
  import { ref, computed } from 'vue'
  import InputNumber from 'primevue/inputnumber'
  import Button from 'primevue/button'
  import Card from 'primevue/card'
  import { onMounted, onUnmounted } from 'vue'
  
  export default {
    components: {
      InputNumber,
      Button,
      Card,
    },
    setup() {
      const firstNumber = ref<number | null>(null)
      const secondNumber = ref<number | null>(null)
      const sumResult = ref<number | null>(null)
      const productResult = ref<number | null>(null)
      const divideResult = ref<number | null>(null)
      const showResult = ref(false)
      const activeOperation = ref<string | null>(null)
      const firstNumberError = ref<string | null>(null)
      const secondNumberError = ref<string | null>(null)
      const divideError = ref<string | null>(null)
  
      const isFormValid = computed(() => {
        return firstNumber.value !== null && secondNumber.value !== null
      })
  
      const toInteger = (value: number | null): number | null => {
        if (value === null) return null
        return Math.trunc(value)
      }
  
      const validate = () => {
        firstNumberError.value = firstNumber.value === null ? 'First number is required' : null
        secondNumberError.value = secondNumber.value === null ? 'Second number is required' : null
        divideError.value = secondNumber.value === 0 ? 'Cannot divide by zero' : null
      }
  
      const resetResults = () => {
        showResult.value = false
        activeOperation.value = null
        validate()
      }
  
      const add = () => {
        validate()
        if (!isFormValid.value) return
        firstNumber.value = toInteger(firstNumber.value)
        secondNumber.value = toInteger(secondNumber.value)
        sumResult.value = firstNumber.value! + secondNumber.value!
        showResult.value = true
        activeOperation.value = 'add'
      }
  
      const multiply = () => {
        validate()
        if (!isFormValid.value) return
        firstNumber.value = toInteger(firstNumber.value)
        secondNumber.value = toInteger(secondNumber.value)
        productResult.value = firstNumber.value! * secondNumber.value!
        showResult.value = true
        activeOperation.value = 'multiply'
      }
  
      const divide = () => {
        validate()
        if (!isFormValid.value || secondNumber.value === 0) return
        firstNumber.value = toInteger(firstNumber.value)
        secondNumber.value = toInteger(secondNumber.value)
        divideResult.value = firstNumber.value! / secondNumber.value!
        showResult.value = true
        activeOperation.value = 'divide'
      }
  
      const formatNumber = (value: number | null): string => {
        if (value === null) return ''
        return new Intl.NumberFormat('en-IN', {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value)
      }

      onMounted(() => {
    document.addEventListener('contextmenu', disableRightClick)
    document.addEventListener('keydown', disableKeyCombos)
    window.addEventListener('keydown', blockDeveloperShortcuts)
})
onUnmounted(() => {
    document.removeEventListener('contextmenu', disableRightClick)
    document.removeEventListener('keydown', disableKeyCombos)
    window.removeEventListener('keydown', blockDeveloperShortcuts)
})
function disableRightClick(event: MouseEvent) {
    event.preventDefault()
}
function disableKeyCombos(event: KeyboardEvent) {
    // Disabling F12, Ctrl+Shift+I/C/J, and Ctrl+U
    if (
        event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && ['I', 'C', 'J'].includes(event.key)) ||
        (event.ctrlKey && event.key === 'U')
    ) {
        event.preventDefault()
    }
}
// Blocking Developer Tools Key Shortcuts more effectively
function blockDeveloperShortcuts(event: KeyboardEvent) {
    if (
        (event.ctrlKey && event.key === 'I') || // Ctrl + I
        (event.ctrlKey && event.key === 'U') || // Ctrl + U
        (event.ctrlKey && event.shiftKey && event.key === 'J') || // Ctrl + Shift + J
        (event.ctrlKey && event.shiftKey && event.key === 'C') || // Ctrl + Shift + C
        event.key === 'F12' // F12
    ) {
      event.preventDefault()
    }
}

(function detectDevTools() {
    let threshold = 160;
    setInterval(() => {
        const start = performance.now();
        debugger;
        const timeTaken = performance.now() - start;
        if (timeTaken > threshold) {
            // Detected DevTools — try to close or redirect
            document.body.innerHTML = ''; // Clear content
            alert("DevTools detected. The page will close.");
            // Attempt to close (only works if page was opened via script)
            window.close();
            // Fallback: redirect to blank page
            location.href = "about:blank";
        }
    }, 1000);
})();
  
      return {
        firstNumber,
        secondNumber,
        sumResult,
        productResult,
        divideResult,
        showResult,
        activeOperation,
        firstNumberError,
        secondNumberError,
        divideError,
        isFormValid,
        add,
        multiply,
        divide,
        resetResults,
        formatNumber, 
      }
    },
  }
  </script>  

<style scoped>
.p-card {
  border-radius: 1rem;
}
</style>  