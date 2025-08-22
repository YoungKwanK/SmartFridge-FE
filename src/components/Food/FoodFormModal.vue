<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title class="text-h5 text-center py-4">
        {{ isEditMode ? '식품 수정' : '식품 등록' }}
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                label="식품명"
                v-model="formData.name"
                required
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                label="수량"
                v-model.number="formData.quantity"
                type="number"
                min="1"
                variant="outlined"
                density="compact"
                append-icon="mdi-plus"
                prepend-inner-icon="mdi-minus"
                @click:append="formData.quantity++"
                @click:prepend-inner="formData.quantity > 1 ? formData.quantity-- : null"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                label="유통기한"
                v-model="formData.expirationDateTime"
                type="datetime-local"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-select
                :items="storageTypes"
                label="보관위치"
                v-model="formData.storageType"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>

            <v-col cols="12" sm="6">
              <v-select
                :items="categories"
                label="카테고리"
                v-model="formData.category"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>

            <v-col cols="12">
              <v-textarea
                label="메모"
                v-model="formData.memo"
                rows="2"
                variant="outlined"
                density="compact"
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-checkbox
                label="다른 멤버와 공유"
                v-model="formData.shareable"
              ></v-checkbox>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn variant="outlined" color="grey" @click="save(true)">임시 등록</v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="outlined" @click="closeModal">취소</v-btn>
        <v-btn color="primary" @click="save(false)">{{ isEditMode ? '수정' : '등록' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from 'axios';

export default {
  props: {
    modelValue: Boolean,
    editingFood: {
      type: Object,
      default: () => ({})
    },
  },
  data() {
    return {
      formData: {
        name: '',
        quantity: 1,
        expirationDateTime: '',
        storageType: null,
        category: null,
        memo: '',
        shareable: true // 기본값을 true로 설정
      },
      storageTypes: [],
      categories: [],
    }
  },
  created() {
    this.fetchEnums();
  },
  computed: {
    isEditMode() {
      return this.editingFood && this.editingFood.id;
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
  watch: {
    editingFood: {
      handler(newFoodData) {
        const defaultFormData = this.$options.data().formData;
        this.formData = {
          ...defaultFormData,
          ...newFoodData
        };

        if (this.formData.shareable == null) {
          this.formData.shareable = false;
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    async fetchEnums() {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/api/enums`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.categories = response.data.categories;
        this.storageTypes = response.data.storageTypes;
      } catch (error) {
        console.error("카테고리 및 보관위치 목록을 불러오는 데 실패했습니다.", error);
      }
    },
    save(isTemp) {
      if (this.formData.expirationDateTime && this.formData.expirationDateTime.length === 10) {
        this.formData.expirationDateTime += 'T23:59';
      }
      const saveData = { ...this.formData, isTemp: isTemp };
      this.$emit('save', saveData);
      this.closeModal();
    },
    closeModal() {
      this.dialog = false;
    }
  }
}
</script>