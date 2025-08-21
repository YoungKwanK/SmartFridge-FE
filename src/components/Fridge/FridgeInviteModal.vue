<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title class="text-h5 text-center py-4">
        냉장고 참여하기
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                label="참여 코드"
                placeholder="참여 코드를 입력하세요"
                v-model="inviteCode"
                required
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn variant="outlined" @click="closeModal">취소</v-btn>
        <v-btn color="primary" @click="joinFridge">참여하기</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    modelValue: Boolean,
  },
  data() {
    return {
      inviteCode: '',
    };
  },
  computed: {
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
    joinFridge() {
      // 부모에게 'join' 이벤트와 함께 초대 코드를 전달
      this.$emit('join', this.inviteCode);
      this.closeModal();
    },
    closeModal() {
      this.dialog = false;
    }
  }
};
</script>