<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title class="text-h5 text-center py-4">
        {{ isEditMode ? '냉장고 수정' : '새 냉장고 만들기' }}
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                label="냉장고 이름"
                v-model="formData.fridgeName"
                required
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea
                label="설명"
                v-model="formData.description"
                rows="3"
                variant="outlined"
                density="compact"
              ></v-textarea>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn variant="outlined" @click="closeModal">취소</v-btn>
        <v-btn color="primary" @click="saveFridge">{{ isEditMode ? '수정하기' : '만들기' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    modelValue: Boolean,
    editingFridge: {
      type: Object,
      default: () => ({}) 
    },
  },  
  data() {
    return {
      formData: {
        fridgeName: '',
        description: ''
      },
    };
  },
  computed: {
    isEditMode() {
      return this.editingFridge && this.editingFridge.fridgeId;
    },
    dialog: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    }
  },
  methods: {
    saveFridge() {
      this.$emit('save', this.formData);
      this.closeModal();
    },
    closeModal() {
      this.formData = { fridgeName: '', description: '' };
      this.dialog = false;
    }
  },
  watch: {
    editingFridge: {
      handler(newFridgeData) {
        this.formData = { ...newFridgeData };
      },
      immediate: true, 
      deep: true
    }
  },
}
</script>